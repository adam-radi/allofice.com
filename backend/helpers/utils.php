<?php


/**
 * ==============================
 * Send JSON response
 * ==============================
 */
function jsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $response = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * ==============================
 * Get request data (GET, POST, PUT, DELETE or JSON body)
 * ==============================
 */
function getRequestData()
{
    $method = $_SERVER['REQUEST_METHOD'];

    // GET
    if ($method === 'GET') {
        return $_GET;
    }

    // POST / PUT / DELETE
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {

        // اقرأ raw input مرة وحدة
        $rawInput = file_get_contents('php://input');

        // إذا كان JSON
        if (!empty($rawInput)) {
            $decoded = json_decode($rawInput, true);

            // إذا تفكّك مزيان
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        // fallback (form-data أو x-www-form-urlencoded)
        return $_POST;
    }

    return [];
}


/**
 * ==============================
 * Sanitize input string
 * ==============================
 */
function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * ==============================
 * Generate unique filename for uploads
 * ==============================
 */
function generateUniqueFilename($originalName) {
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    return uniqid('file_') . '_' . time() . '.' . $ext;
}

/**
 * ==============================
 * Check if user is admin
 * ==============================
 */
function isAdmin($conn, $userId) {
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['role'] === 'admin';
    }
    return false;
}

/**
 * ==============================
 * Get current user ID (session or token)
 * ==============================
 */
function getCurrentUserId($conn = null) {
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }

    // Bearer token (future JWT support)
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        // Decode token logic here if JWT is used
        // For now, fallback to null
        return null;
    }

    return null;
}

/**
 * ==============================
 * Get product for offer
 * ==============================
 * Returns product data if offer is linked, otherwise null
 */
function getOfferProduct($conn, $offerId) {
    $stmt = $conn->prepare("
        SELECT p.id, p.name, p.slug, p.product_type 
        FROM offers o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ?
    ");
    $stmt->bind_param('i', $offerId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        return $result->fetch_assoc(); // Returns null if no product linked
    }
    return null;
}

/**
 * ==============================
 * Create guest user automatically
 * ==============================
 */
function createGuestUser($conn, $fullName, $phone, $city) {
    $fullName = sanitize($fullName);
    $phone = sanitize($phone);
    $city = sanitize($city);

    $stmt = $conn->prepare("
        INSERT INTO users (full_name, phone, city) 
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param('sss', $fullName, $phone, $city);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        $_SESSION['user_id'] = $stmt->insert_id;
        return $stmt->insert_id;
    }
    return null;
}


function generateSlug($string) {
    // تحويل للحروف الصغيرة
    $slug = strtolower($string);

    // إزالة العلامات الخاصة
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);

    // استبدال الفراغات بشرطة -
    $slug = preg_replace('/[\s-]+/', '-', $slug);

    // إزالة الشرطات الزائدة في البداية والنهاية
    $slug = trim($slug, '-');

    return $slug;
}

?>