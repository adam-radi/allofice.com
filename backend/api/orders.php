<?php
require_once '../config/app.php';
applyCorsHeaders();
session_start();
require_once '../config/db.php';
require_once '../helpers/utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = getRequestData();

if ($method === 'GET') {
    handleGetOrders($conn);
} elseif ($method === 'POST') {
    handleCreateOrder($conn, $data);
} elseif ($method === 'PUT') {
    handleUpdateOrderStatus($conn, $data);
} else {
    jsonResponse(false, 'Method not allowed', null, 405);
}

/* ===================== GET ORDERS ===================== */
function handleGetOrders($conn)
{
    $userId = getCurrentUserId();
    if (!$userId) jsonResponse(false, 'Unauthorized', null, 401);

    $isAdmin = isAdmin($conn, $userId);

    $sql = "SELECT o.*, u.name, u.phone, u.city
            FROM orders o
            JOIN users u ON o.user_id = u.id";

    if (!$isAdmin) $sql .= " WHERE o.user_id = ?";

    $sql .= " ORDER BY o.created_at DESC";

    $stmt = $conn->prepare($sql);
    if (!$isAdmin) $stmt->bind_param('i', $userId);
    $stmt->execute();
    $res = $stmt->get_result();

    $orders = [];
    while ($o = $res->fetch_assoc()) {

        $itemsSql = "SELECT oi.*, 
                            p.name AS product_name,
                            ofr.title AS offer_title
                     FROM order_items oi
                     LEFT JOIN products p ON oi.product_id = p.id
                     LEFT JOIN offers ofr ON oi.offer_id = ofr.id
                     WHERE oi.order_id = ?";
        $it = $conn->prepare($itemsSql);
        $it->bind_param('i', $o['id']);
        $it->execute();
        $o['items'] = $it->get_result()->fetch_all(MYSQLI_ASSOC);

        $orders[] = $o;
    }

    jsonResponse(true, 'Orders loaded', $orders);
}

/* ===================== CREATE ORDER ===================== */
function handleCreateOrder($conn, $data)
{
    // DEBUG مؤقت
    file_put_contents(__DIR__ . '/orders_debug.log', print_r($data, true));

    $items = $data['items'] ?? [];
    $name  = sanitize($data['name'] ?? '');
    $phone = sanitize($data['phone'] ?? '');
    $city  = sanitize($data['city'] ?? '');

    if (!$items || !$name || !$phone || !$city) {
        jsonResponse(false, 'Missing required fields', null, 400);
    }

    /* ---------- USER AUTO REGISTER ---------- */
    $userId = getCurrentUserId();
    if (!$userId) {
        $q = $conn->prepare("SELECT id FROM users WHERE phone=?");
        $q->bind_param('s', $phone);
        $q->execute();
        $r = $q->get_result();

        if ($r->num_rows === 0) {
            $pass = password_hash($phone, PASSWORD_BCRYPT);
            $i = $conn->prepare("INSERT INTO users (name, phone, password, city, role, created_at)
                                 VALUES (?,?,?,?, 'user', NOW())");
            $i->bind_param('ssss', $name, $phone, $pass, $city);
            $i->execute();
            $userId = $conn->insert_id;
        } else {
            $userId = $r->fetch_assoc()['id'];
        }
        $_SESSION['user_id'] = $userId;
    }

    /* ---------- TRANSACTION ---------- */
    $conn->begin_transaction();

    try {
        $total = 0;
        $orderItems = [];

        foreach ($items as $item) {

            $qty = intval($item['quantity'] ?? $item['qty'] ?? 0);
            if ($qty <= 0) continue;

            $productId = $item['product_id'] ?? null;
            $offerId   = $item['offer_id'] ?? null;

            /* ===== OFFER ===== */
            if ($offerId) {

                $o = $conn->prepare(
                    "SELECT * FROM offers 
                     WHERE id=? AND start_date<=NOW() AND end_date>=NOW()"
                );
                $o->bind_param('i', $offerId);
                $o->execute();
                $offer = $o->get_result()->fetch_assoc();
                if (!$offer) continue;

                /* product + offer */
                if ($productId) {
                    $p = $conn->prepare("SELECT * FROM products WHERE id=? FOR UPDATE");
                    $p->bind_param('i', $productId);
                    $p->execute();
                    $prod = $p->get_result()->fetch_assoc();

                    if (!$prod || $prod['quantity'] < $qty) throw new Exception('Stock error');

                    $price = $prod['price'] * (1 - $offer['discount_percentage'] / 100);
                    $conn->query("UPDATE products SET quantity = quantity-$qty WHERE id=$productId");

                    $type = 'product_offer';
                }
                /* other offer */ else {
                    if ($offer['quantity'] < $qty) throw new Exception('Offer stock error');

                    $price = $offer['price'] * (1 - ($offer['discount_percentage'] ?? 0) / 100);

                    $conn->query("UPDATE offers SET quantity = quantity-$qty WHERE id=$offerId");

                    $type = 'other_offer';
                }
            }
            /* ===== PRODUCT ONLY ===== */ else {
                $p = $conn->prepare("SELECT * FROM products WHERE id=? FOR UPDATE");
                $p->bind_param('i', $productId);
                $p->execute();
                $prod = $p->get_result()->fetch_assoc();

                if (!$prod || $prod['quantity'] < $qty) throw new Exception('Stock error');

                $price = $prod['price'];
                $conn->query("UPDATE products SET quantity = quantity-$qty WHERE id=$productId");

                $type = 'product';
            }

            $total += $price * $qty;
            $orderItems[] = [$productId, $offerId, $type, $qty, $price];
        }

        if (!$orderItems) throw new Exception('Empty order');

        /* ---------- ORDER ---------- */
        $o = $conn->prepare(
            "INSERT INTO orders (user_id,total_price,status,created_at)
             VALUES (?,?,'pending',NOW())"
        );
        $o->bind_param('id', $userId, $total);
        $o->execute();
        $orderId = $conn->insert_id;

        /* ---------- ITEMS ---------- */
        $i = $conn->prepare(
            "INSERT INTO order_items 
            (order_id,product_id,offer_id,item_type,quantity,price)
             VALUES (?,?,?,?,?,?)"
        );

        foreach ($orderItems as $it) {
            $i->bind_param('iiisid', $orderId, $it[0], $it[1], $it[2], $it[3], $it[4]);
            $i->execute();
        }

        $conn->commit();

        jsonResponse(true, 'Order created', [
            'order_id' => $orderId,
            'total' => $total
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(false, $e->getMessage(), null, 400);
    }
}



function handleUpdateOrderStatus($conn, $data)
{

    $userId = getCurrentUserId();
    if (!$userId || !isAdmin($conn, $userId)) {
        jsonResponse(false, 'Unauthorized', null, 403);
    }

    $orderId = intval($data['order_id'] ?? 0);
    $status  = $data['status'] ?? '';

    if (!$orderId || !in_array($status, ['confirmed', 'cancelled'])) {
        jsonResponse(false, 'Invalid data', null, 400);
    }

    $conn->begin_transaction();

    try {
        if ($status === 'cancelled') {

            $q = $conn->prepare("SELECT * FROM order_items WHERE order_id=?");
            $q->bind_param('i', $orderId);
            $q->execute();
            $items = $q->get_result();

            while ($it = $items->fetch_assoc()) {

                if ($it['item_type'] === 'product' || $it['item_type'] === 'product_offer') {
                    $conn->query(
                        "UPDATE products 
                         SET quantity = quantity + {$it['quantity']}
                         WHERE id = {$it['product_id']}"
                    );
                }

                if ($it['item_type'] === 'other_offer') {
                    $conn->query(
                        "UPDATE offers 
                         SET quantity = quantity + {$it['quantity']}
                         WHERE id = {$it['offer_id']}"
                    );
                }
            }
        }

        $u = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
        $u->bind_param('si', $status, $orderId);
        $u->execute();

        $conn->commit();
        jsonResponse(true, 'Order updated');
    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(false, 'Failed', null, 500);
    }
}
