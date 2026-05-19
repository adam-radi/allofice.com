<?php
require_once '../config/app.php';
applyCorsHeaders();

session_start();
require_once '../config/db.php';
require_once '../helpers/utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = getRequestData(); // JSON body (useful for DELETE/PUT if sent as JSON)

switch ($method) {
  case 'GET':
    handleGetProducts($conn);
    break;

  case 'POST':
    // POST can be JSON OR multipart/form-data
    handleCreateOrActionProduct($conn, $data);
    break;

  case 'PUT':
    handleUpdateProduct($conn, $data);
    break;

  case 'DELETE':
    handleDeleteProduct($conn, $data);
    break;

  default:
    jsonResponse(false, 'Method not allowed', null, 405);
}

/**
 * =======================
 * GET PRODUCTS
 * Supports:
 * - action=list (default)
 * - action=single (id or slug)
 * =======================
 */
function handleGetProducts($conn)
{
  $action = sanitize($_GET['action'] ?? 'list');

  if ($action === 'single') {
    $id = intval($_GET['id'] ?? 0);
    $slug = sanitize($_GET['slug'] ?? '');

    if ($id <= 0 && !$slug) jsonResponse(false, 'Provide id or slug', null, 400);


    $query = "SELECT p.id, p.name, p.slug, p.description, p.price, p.quantity, p.category_id, p.product_type, p.created_at,
                   c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE " . ($id > 0 ? "p.id=?" : "p.slug=?") . "
            LIMIT 1";

    $stmt = $conn->prepare($query);
    if (!$stmt) jsonResponse(false, 'Database error: ' . $conn->error, null, 500);

    if ($id > 0) $stmt->bind_param('i', $id);
    else $stmt->bind_param('s', $slug);

    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) jsonResponse(false, 'Product not found', null, 404);

    $product = $res->fetch_assoc();

    // images
    $imgStmt = $conn->prepare("SELECT image_path, is_main FROM product_images WHERE product_id=? ORDER BY is_main DESC, id ASC");
    $imgStmt->bind_param('i', $product['id']);
    $imgStmt->execute();
    $imgRes = $imgStmt->get_result();

    $images = [];
    $main = null;
    while ($img = $imgRes->fetch_assoc()) {
      $images[] = $img['image_path'];
      if ($main === null && intval($img['is_main']) === 1) $main = $img['image_path'];
    }
    $product['images'] = $images;
    $product['main_image'] = $main ?? ($images[0] ?? null);

    // ensure slug
    if (!$product['slug']) $product['slug'] = generateSlug($product['name']);

    jsonResponse(true, 'Product retrieved successfully', $product);
  }

  // ===== action=list =====
  $type = sanitize($_GET['type'] ?? '');
  $category = intval($_GET['category_id'] ?? 0);
  $search = sanitize($_GET['search'] ?? '');
  $limit = max(1, intval($_GET['limit'] ?? 10));
  $offset = max(0, intval($_GET['offset'] ?? 0));

  $query = "SELECT p.id, p.name, p.slug, p.description, p.price, p.quantity, p.category_id, p.product_type, p.created_at,
                 c.name AS category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE 1=1";

  $params = [];
  $types = '';

  if ($type) {
    $query .= " AND p.product_type = ?";
    $params[] = $type;
    $types .= 's';
  }

  if ($category > 0) {
    $query .= " AND p.category_id = ?";
    $params[] = $category;
    $types .= 'i';
  }

  if ($search) {
    $query .= " AND (p.name LIKE ? OR p.description LIKE ?)";
    $like = "%$search%";
    $params[] = $like;
    $params[] = $like;
    $types .= 'ss';
  }

  $query .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
  $params[] = $limit;
  $params[] = $offset;
  $types .= 'ii';

  $stmt = $conn->prepare($query);
  if (!$stmt) jsonResponse(false, 'Database error: ' . $conn->error, null, 500);

  if (!empty($params)) $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();

  $products = [];
  while ($row = $result->fetch_assoc()) {
    // images
    $imgStmt = $conn->prepare("SELECT image_path, is_main FROM product_images WHERE product_id=? ORDER BY is_main DESC, id ASC");
    $imgStmt->bind_param('i', $row['id']);
    $imgStmt->execute();
    $imgResult = $imgStmt->get_result();

    $images = [];
    $main = null;
    while ($img = $imgResult->fetch_assoc()) {
      $images[] = $img['image_path'];
      if ($main === null && intval($img['is_main']) === 1) $main = $img['image_path'];
    }

    $row['images'] = $images;
    $row['main_image'] = $main ?? ($images[0] ?? null);
    if (!$row['slug']) $row['slug'] = generateSlug($row['name']);

    $products[] = $row;
  }

  jsonResponse(true, 'Products retrieved successfully', $products);
}

/**
 * POST handler:
 * - create (multipart or json)
 * - update/delete via action (optional) if you want later
 */
function handleCreateOrActionProduct($conn, $data)
{
  // if multipart, data comes from $_POST
  $action = sanitize($_POST['action'] ?? ($data['action'] ?? 'create'));

  if ($action === 'create') {
    handleCreateProduct($conn, $data);
    return;
  }

  if ($action === 'update') {
    handleUpdateProduct($conn, $data);
    return;
  }

  if ($action === 'delete') {
    handleDeleteProduct($conn, $data);
    return;
  }

  jsonResponse(false, 'Invalid action', null, 400);
}

// === UPDATE PRODUCT ===
function handleUpdateProduct($conn, $data)
{
  $userId = $_SESSION['user_id'] ?? null;
  if (!$userId || !isAdmin($conn, $userId)) jsonResponse(false, 'Unauthorized', null, 403);

  $id = intval($_POST['id'] ?? ($data['id'] ?? 0));
  $name = sanitize($_POST['name'] ?? ($data['name'] ?? ''));
  $description = sanitize($_POST['description'] ?? ($data['description'] ?? ''));
  $price = floatval($_POST['price'] ?? ($data['price'] ?? 0));
  $categoryId = intval($_POST['category_id'] ?? ($data['category_id'] ?? 0));
  $productType = sanitize($_POST['product_type'] ?? ($data['product_type'] ?? 'office'));
  $quantity = intval($_POST['quantity'] ?? ($data['quantity'] ?? 0));

  if ($quantity < 0) $quantity = 0;
  if (!$id || !$name || $price <= 0) jsonResponse(false, 'Invalid product data', null, 400);

  $slug = generateSlug($name);

  $stmt = $conn->prepare("UPDATE products 
                          SET name=?, description=?, slug=?, price=?, category_id=?, quantity=?, product_type=? 
                          WHERE id=?");
  if (!$stmt) jsonResponse(false, 'Database error: ' . $conn->error, null, 500);

  // ✅ types: s s s d i i s i
  $stmt->bind_param('sssdiisi', $name, $description, $slug, $price, $categoryId, $quantity, $productType, $id);

  if (!$stmt->execute()) jsonResponse(false, 'Update failed: ' . $stmt->error, null, 500);

  jsonResponse(true, 'Product updated successfully', [
    'id' => $id,
    'slug' => $slug,
    'name' => $name,
    'price' => $price,
    'quantity' => $quantity,
    'category_id' => $categoryId,
    'product_type' => $productType
  ]);
}


// === CREATE PRODUCT ===
function handleCreateProduct($conn, $data)
{
  $userId = $_SESSION['user_id'] ?? null;
  if (!$userId || !isAdmin($conn, $userId)) jsonResponse(false, 'Unauthorized', null, 403);

  // multipart support
  $name = sanitize($_POST['name'] ?? ($data['name'] ?? ''));
  $description = sanitize($_POST['description'] ?? ($data['description'] ?? ''));
  $price = floatval($_POST['price'] ?? ($data['price'] ?? 0));
  $categoryId = intval($_POST['category_id'] ?? ($data['category_id'] ?? 0));
  $productType = sanitize($_POST['product_type'] ?? ($data['product_type'] ?? 'office'));
  $quantity = intval($_POST['quantity'] ?? ($data['quantity'] ?? 1));
  if ($quantity < 0) $quantity = 0;

  if (!$name || $price <= 0) jsonResponse(false, 'Product name and price are required', null, 400);

  $slug = generateSlug($name);

  $stmt = $conn->prepare("INSERT INTO products (name, description, slug, price, category_id, quantity, product_type, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
  $stmt->bind_param('sssdiis', $name, $description, $slug, $price, $categoryId, $quantity, $productType);
  if (!$stmt->execute()) jsonResponse(false, 'Failed to create product: ' . $conn->error, null, 500);

  $productId = $conn->insert_id;

  // handle multiple images
  if (isset($_FILES['images'])) {
    $uploadDir = '../uploads/products/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $count = count($_FILES['images']['name']);
    for ($i = 0; $i < $count; $i++) {
      if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
        $filename = generateUniqueFilename($_FILES['images']['name'][$i]);
        $filepath = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['images']['tmp_name'][$i], $filepath)) {
          $isMain = ($i === 0) ? 1 : 0;
          $imgStmt = $conn->prepare("INSERT INTO product_images (product_id, image_path, is_main) VALUES (?, ?, ?)");
          $imgStmt->bind_param('isi', $productId, $filename, $isMain);
          $imgStmt->execute();
        }
      }
    }
  }

  jsonResponse(true, 'Product created successfully', [
    'id' => $productId,
    'slug' => $slug,
    'name' => $name,
    'price' => $price,
    'product_type' => $productType,
    'quantity' => $quantity

  ]);
}

// === DELETE PRODUCT ===
function handleDeleteProduct($conn, $data)
{
  $userId = $_SESSION['user_id'] ?? null;
  if (!$userId || !isAdmin($conn, $userId)) jsonResponse(false, 'Unauthorized', null, 403);

  $id = intval(($data['id'] ?? ($_POST['id'] ?? 0)));
  if (!$id) jsonResponse(false, 'Invalid product ID', null, 400);

  $imgStmt = $conn->prepare("SELECT image_path FROM product_images WHERE product_id=?");
  $imgStmt->bind_param('i', $id);
  $imgStmt->execute();
  $res = $imgStmt->get_result();

  $uploadDir = '../uploads/products/';
  while ($row = $res->fetch_assoc()) {
    $path = $uploadDir . $row['image_path'];
    if (file_exists($path)) unlink($path);
  }

  $delStmt = $conn->prepare("DELETE FROM product_images WHERE product_id=?");
  $delStmt->bind_param('i', $id);
  $delStmt->execute();

  $stmt = $conn->prepare("DELETE FROM products WHERE id=?");
  $stmt->bind_param('i', $id);
  $stmt->execute();

  jsonResponse(true, 'Product deleted successfully');
}
