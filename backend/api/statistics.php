<?php
require_once '../config/app.php';
applyCorsHeaders();
session_start();
require_once '../config/db.php';
require_once '../helpers/utils.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    handleGetStatistics($conn);
} else {
    jsonResponse(false, 'Method not allowed', null, 405);
}

/**
 * Get statistics (admin only)
 */
function handleGetStatistics($conn) {
    authorizeAdmin($conn);

    $statistics = [];

    // Total users
    $res = $conn->query("SELECT COUNT(*) as count FROM users WHERE role='user'");
    $statistics['total_users'] = $res->fetch_assoc()['count'];

    // Total products
    $statistics['total_products'] = $conn->query("SELECT COUNT(*) as count FROM products")->fetch_assoc()['count'];

    // Products by type
    $res = $conn->query("SELECT product_type, COUNT(*) as count FROM products GROUP BY product_type");
    $statistics['products_by_type'] = [];
    while ($row = $res->fetch_assoc()) {
        $statistics['products_by_type'][$row['product_type']] = $row['count'];
    }

    // Total offers
    $statistics['total_offers'] = $conn->query("SELECT COUNT(*) as count FROM offers")->fetch_assoc()['count'];

    // Offers by type
    $res = $conn->query("SELECT offer_type, COUNT(*) as count FROM offers GROUP BY offer_type");
    $statistics['offers_by_type'] = [];
    while ($row = $res->fetch_assoc()) {
        $statistics['offers_by_type'][$row['offer_type']] = $row['count'];
    }

    // Total orders
    $statistics['total_orders'] = $conn->query("SELECT COUNT(*) as count FROM orders")->fetch_assoc()['count'];

    // Total revenue
    $statistics['total_revenue'] = $conn->query("SELECT SUM(total_price) as total FROM orders")->fetch_assoc()['total'] ?? 0;

    // Orders by status
    $res = $conn->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
    $statistics['orders_by_status'] = [];
    while ($row = $res->fetch_assoc()) {
        $statistics['orders_by_status'][$row['status']] = $row['count'];
    }

    // Recent orders
    $res = $conn->query("
        SELECT o.id, o.total_price, o.status, o.created_at, u.name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT 5
    ");
    $statistics['recent_orders'] = [];
    while ($row = $res->fetch_assoc()) {
        $statistics['recent_orders'][] = $row;
    }

    jsonResponse(true, 'Statistics retrieved successfully', $statistics);
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
?>
