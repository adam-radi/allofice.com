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
        handleGetCategories($conn);
        break;
    case 'POST':
        handleCreateCategory($conn, $data);
        break;
    case 'PUT':
        handleUpdateCategory($conn, $data);
        break;
    case 'DELETE':
        handleDeleteCategory($conn, $data);
        break;
    default:
        jsonResponse(false, 'Method not allowed', null, 405);
}

/**
 * GET categories
 * optional: ?type=office | printing
 */
function handleGetCategories($conn)
{
    $type = isset($_GET['type']) ? sanitize($_GET['type']) : null;

    $sql = "SELECT id, name, description, type, slug FROM categories";
    if ($type) {
        $sql .= " WHERE type = ?";
    }
    $sql .= " ORDER BY name ASC";

    $stmt = $conn->prepare($sql);
    if ($type) {
        $stmt->bind_param("s", $type);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }

    jsonResponse(true, 'Categories retrieved successfully', $categories);
}

/**
 * CREATE category (admin only)
 */
function handleCreateCategory($conn, $data)
{
    authorizeAdmin($conn);

    $name        = sanitize($data['name'] ?? '');
    $description = sanitize($data['description'] ?? '');
    $type        = sanitize($data['type'] ?? '');
    $slug = generateSlug($name);
    if (!$name || !in_array($type, ['office', 'printing'])) {
        jsonResponse(false, 'Invalid category data', null, 400);
    }

    $stmt = $conn->prepare(
        "INSERT INTO categories (name,slug, description, type) VALUES (?, ?,?, ?)"
    );
    $stmt->bind_param("ssss", $name, $slug, $description, $type);

    if ($stmt->execute()) {
        jsonResponse(true, 'Category created', [
            'id' => $conn->insert_id,
            'name' => $name,
            'description' => $description,
            'type' => $type
        ]);
    }

    jsonResponse(false, 'Failed to create category', null, 500);
}

/**
 * UPDATE category (admin only)
 */
function handleUpdateCategory($conn, $data)
{
    authorizeAdmin($conn);

    $id          = intval($data['id'] ?? 0);
    $name        = sanitize($data['name'] ?? '');
    $description = sanitize($data['description'] ?? '');
    $type        = sanitize($data['type'] ?? '');
    $slug = generateSlug($name);

    if ($id <= 0 || !$name || !in_array($type, ['office', 'printing'])) {
        jsonResponse(false, 'Invalid category data', null, 400);
    }

    $stmt = $conn->prepare(
        "UPDATE categories SET name=?, description=?, type=? ,  slug=? WHERE id=?"
    );
    $stmt->bind_param("ssssi", $name, $description, $type,$slug, $id);

    if ($stmt->execute()) {
        jsonResponse(true, 'Category updated');
    }

    jsonResponse(false, 'Failed to update category', null, 500);
}

/**
 * DELETE category (admin only)
 */
function handleDeleteCategory($conn, $data)
{
    authorizeAdmin($conn);

    $id = intval($data['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(false, 'Invalid category ID', null, 400);
    }

    $stmt = $conn->prepare("DELETE FROM categories WHERE id=?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        jsonResponse(true, 'Category deleted');
    }

    jsonResponse(false, 'Failed to delete category', null, 500);
}

/**
 * Admin guard
 */
function authorizeAdmin($conn)
{
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId || !isAdmin($conn, $userId)) {
        jsonResponse(false, 'Unauthorized', null, 403);
    }
}
