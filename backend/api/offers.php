<?php
require_once '../config/app.php';
applyCorsHeaders();

session_start();

require_once '../config/db.php';
require_once '../helpers/utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$data   = getRequestData();

switch ($method) {
    case 'GET':
        getOffers($conn, $data);
        break;

    case 'POST':
        createOffer($conn, $data);
        break;

    case 'PUT':
        updateOffer($conn, $data);
        break;

    case 'DELETE':
        deleteOffer($conn, $data);
        break;

    default:
        jsonResponse(false, 'Method not allowed', null, 405);
}

/* =========================================================
   GET OFFERS
   ========================================================= */
function getOffers($conn, $data)
{
    $type   = isset($data['offer_type']) ? sanitize($data['offer_type']) : '';
    $limit  = isset($data['limit']) ? (int)$data['limit'] : 10;
    $offset = isset($data['offset']) ? (int)$data['offset'] : 0;
    // ✅ SINGLE OFFER (by id) for /offer/:slug-:id
    $offerId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($offerId > 0) {

        $stmt = $conn->prepare("
    SELECT 
        o.id,
        o.title,
        o.description,
        o.offer_type,
        o.product_id,
        o.price,
        o.quantity,
        o.discount_percentage,
        o.image_path,
        o.start_date,
        o.end_date,
        o.created_at,

        p.name AS product_name,
        p.price AS product_price,
        p.quantity AS product_quantity,

        -- ✅ final price for frontend/orders
        CASE 
            WHEN o.price IS NOT NULL AND o.price > 0 THEN o.price
            WHEN o.product_id IS NOT NULL AND o.product_id > 0 AND p.price IS NOT NULL
                 THEN ROUND(p.price * (1 - (IFNULL(o.discount_percentage,0) / 100)), 2)
            ELSE IFNULL(p.price, 0)
        END AS final_price
    FROM offers o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
    LIMIT 1
");

        if (!$stmt) jsonResponse(false, 'Database error', null, 500);

        $stmt->bind_param('i', $offerId);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows === 0) jsonResponse(false, 'Offer not found', null, 404);

        $row = $res->fetch_assoc();
        $row['offer_mode'] = ((int)$row['product_id'] > 0) ? 'product' : 'other';

        jsonResponse(true, 'Offer retrieved successfully', $row);
    }

    $query = "
    SELECT 
        o.id,
        o.title,
        o.description,
        o.offer_type,
        o.product_id,
        o.price,
        o.quantity,
        o.discount_percentage,
        o.image_path,
        o.start_date,
        o.end_date,
        o.created_at,

        p.name AS product_name,
        p.price AS product_price,
        p.quantity AS product_quantity,

        CASE 
            WHEN o.price IS NOT NULL AND o.price > 0 THEN o.price
            WHEN o.product_id IS NOT NULL AND o.product_id > 0 AND p.price IS NOT NULL
                 THEN ROUND(p.price * (1 - (IFNULL(o.discount_percentage,0) / 100)), 2)
            ELSE IFNULL(p.price, 0)
        END AS final_price
    FROM offers o
    LEFT JOIN products p ON o.product_id = p.id
WHERE (o.end_date IS NULL OR o.end_date = '0000-00-00' OR o.end_date >= NOW())";


    $params = [];
    $types  = '';

    if (!empty($type)) {
        $query .= " AND o.offer_type = ?";
        $params[] = $type;
        $types .= 's';
    }

    $query .= " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        jsonResponse(false, 'Database error', null, 500);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();
    $offers = [];

    while ($row = $result->fetch_assoc()) {
        // تحديد نوع العرض
        $row['offer_mode'] = ((int)$row['product_id'] > 0) ? 'product' : 'other';
        $offers[] = $row;
    }

    jsonResponse(true, 'Offers retrieved successfully', $offers);
}

/* =========================================================
   CREATE OFFER (ADMIN)
   ========================================================= */
function createOffer($conn, $data)
{
    $userId = getCurrentUserId();
    if (!$userId || !isAdmin($conn, $userId)) {
        jsonResponse(false, 'Unauthorized', null, 403);
    }

    // multipart support
    $title       = sanitize($_POST['title'] ?? ($data['title'] ?? ''));
    $description = sanitize($_POST['description'] ?? ($data['description'] ?? ''));
    $offerType   = sanitize($_POST['offer_type'] ?? ($data['offer_type'] ?? ''));
    $productIdRaw = $_POST['product_id'] ?? ($data['product_id'] ?? null);
    $productId   = ($productIdRaw !== null && $productIdRaw !== '' && $productIdRaw !== 'other')
        ? (int)$productIdRaw
        : null;

    $price      = isset($_POST['price']) ? (float)$_POST['price'] : (isset($data['price']) ? (float)$data['price'] : null);
    $quantity   = isset($_POST['quantity']) ? (int)$_POST['quantity'] : (isset($data['quantity']) ? (int)$data['quantity'] : null);
    $discount   = isset($_POST['discount_percentage']) ? (float)$_POST['discount_percentage'] : (isset($data['discount_percentage']) ? (float)$data['discount_percentage'] : 0);
    $startDate  = sanitize($_POST['start_date'] ?? ($data['start_date'] ?? ''));
    $endDate    = sanitize($_POST['end_date'] ?? ($data['end_date'] ?? ''));
    /* ---------- VALIDATION ---------- */
    if (empty($title) || !in_array($offerType, ['office', 'printing', 'other'])) {
        jsonResponse(false, 'Invalid offer data', null, 400);
    }

    // عرض مرتبط بمنتج
    if ($productId !== null) {

        // تأكد أن المنتج موجود ونوعه صحيح
        $check = $conn->prepare("SELECT id, price, quantity  FROM products WHERE id = ? AND product_type = ?");
        $check->bind_param('is', $productId, $offerType);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows === 0) {
            jsonResponse(false, 'Product not found or type mismatch', null, 400);
        }
        $product = $result->fetch_assoc();
        $price = $product['price'];
        $quantity = $product['quantity'];
    }
    // عرض مستقل (other)
    else {
        if ($price === null || $price <= 0 || $quantity === null || $quantity < 0) {
            jsonResponse(false, 'Price and quantity are required for other offers', null, 400);
        }
    }

    /* ---------- IMAGE UPLOAD ---------- */
    $imagePath = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/offers/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $imagePath = generateUniqueFilename($_FILES['image']['name']);
        move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $imagePath);
    }

    /* ---------- INSERT ---------- */
    $stmt = $conn->prepare("
        INSERT INTO offers
        (product_id, offer_type, title, description, price, quantity, discount_percentage, image_path, start_date, end_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $startDate = !empty($startDate) ? $startDate : date("Y-m-d");
    $endDate   = !empty($endDate) ? $endDate : date("Y-m-d", strtotime("+1 year"));
    $pid = $productId ?? null;
    $pr  = $price ?? null;
    $qty = $quantity ?? null;

    $stmt->bind_param(
        'isssdidsss',
        $pid,
        $offerType,
        $title,
        $description,
        $pr,
        $qty,
        $discount,
        $imagePath,
        $startDate,
        $endDate
    );
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Offer created successfully', ['id' => $conn->insert_id]);
    }

    jsonResponse(false, 'Failed to create offer', null, 500);
}

/* =========================================================
   UPDATE OFFER (ADMIN)
   ========================================================= */
function updateOffer($conn, $data)
{
    $userId = getCurrentUserId();
    if (!$userId || !isAdmin($conn, $userId)) {
        jsonResponse(false, 'Unauthorized', null, 403);
    }

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(false, 'Invalid offer ID', null, 400);
    }

    // للحفاظ على البساطة: تحديث النصوص والتواريخ فقط
    $title       = sanitize($data['title'] ?? '');
    $description = sanitize($data['description'] ?? '');
    $discount    = (float)($data['discount_percentage'] ?? 0);
    $startDate   = sanitize($data['start_date'] ?? '');
    $endDate     = sanitize($data['end_date'] ?? '');

    $stmt = $conn->prepare("
        UPDATE offers
        SET title = ?, description = ?, discount_percentage = ?, start_date = ?, end_date = ?
        WHERE id = ?
    ");

    $stmt->bind_param('ssdssi', $title, $description, $discount, $startDate, $endDate, $id);

    if ($stmt->execute()) {
        jsonResponse(true, 'Offer updated successfully');
    }

    jsonResponse(false, 'Failed to update offer', null, 500);
}

/* =========================================================
   DELETE OFFER (ADMIN)
   ========================================================= */
function deleteOffer($conn, $data)
{
    $userId = getCurrentUserId();
    if (!$userId || !isAdmin($conn, $userId)) {
        jsonResponse(false, 'Unauthorized', null, 403);
    }

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(false, 'Invalid offer ID', null, 400);
    }

    // حذف الصورة
    $img = $conn->prepare("SELECT image_path FROM offers WHERE id = ?");
    $img->bind_param('i', $id);
    $img->execute();
    $res = $img->get_result();

    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        if ($row['image_path']) {
            $path = '../uploads/offers/' . $row['image_path'];
            if (file_exists($path)) unlink($path);
        }
    }

    $stmt = $conn->prepare("DELETE FROM offers WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        jsonResponse(true, 'Offer deleted successfully');
    }

    jsonResponse(false, 'Failed to delete offer', null, 500);
}
