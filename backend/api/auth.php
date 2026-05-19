
<?php
require_once '../config/app.php';
applyCorsHeaders();
session_start();

require_once '../config/db.php';
require_once '../helpers/utils.php';
$method = $_SERVER['REQUEST_METHOD'];
$data = getRequestData();

if ($method === 'POST') {
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'login') {
        handleLogin($conn, $data);
    } elseif ($action === 'guest_checkout') {
        handleGuestCheckout($conn, $data);
    } elseif ($action === 'update_profile') {
        handleUpdateProfile($conn, $data);
    } elseif ($action === 'register_manual') {
        file_put_contents(__DIR__ . '/debug.txt', print_r($data, true));
        handleRegisterManual($conn, $data);
    } elseif ($action === 'logout') {
        handleLogout();
    } else {
        jsonResponse(false, 'Invalid action', null, 400);
    }
} elseif ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    if ($action === 'check') {
        checkAuth();
    } else {
        jsonResponse(false, 'Invalid action', null, 400);
    }
} else {
    jsonResponse(false, 'Method not allowed', null, 405);
}

/* ===================== UPDATE PROFILE ===================== */
function handleUpdateProfile($conn, $data)
{
    $userId = getCurrentUserId();
    if (!$userId) jsonResponse(false, 'Unauthorized', null, 401);

    $email = sanitize($data['email'] ?? '');
    $newPassword = $data['new_password'] ?? '';

    if (!$email && !$newPassword) {
        jsonResponse(false, 'Nothing to update', null, 400);
    }

    // ✅ Email validation (خفيف)
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'Invalid email', null, 400);
    }

    // ✅ Email unique check
    if ($email) {
        $q = $conn->prepare("SELECT id FROM users WHERE email=? AND id<>? LIMIT 1");
        $q->bind_param('si', $email, $userId);
        $q->execute();
        $r = $q->get_result();
        if ($r->num_rows > 0) jsonResponse(false, 'Email already used', null, 409);
    }

    // ✅ Build query dynamic
    $fields = [];
    $types = '';
    $params = [];

    if ($email) {
        $fields[] = "email=?";
        $types .= 's';
        $params[] = $email;
    }

    if ($newPassword) {
        // 최소 6 chars مثلا
        if (strlen($newPassword) < 6) jsonResponse(false, 'Password too short', null, 400);
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);

        $fields[] = "password=?";
        $types .= 's';
        $params[] = $hash;
    }

    $types .= 'i';
    $params[] = $userId;

    $sql = "UPDATE users SET " . implode(',', $fields) . " WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) jsonResponse(false, 'Database error', null, 500);

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    jsonResponse(true, 'Profile updated');
}

/**
 * Handle user login
 * Login only with phone + password
 */
function handleLogin($conn, $data)
{
    $phone = isset($data['phone']) ? sanitize($data['phone']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    if (empty($phone) || empty($password)) {
        jsonResponse(false, 'Phone and password are required', null, 422);
    }

    $stmt = $conn->prepare("SELECT id, name, phone, password, role FROM users WHERE phone = ?");
    $stmt->bind_param('s', $phone);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        jsonResponse(false, 'Invalid phone or password', null, 401);
    }

    $user = $result->fetch_assoc();
    if (!password_verify($password, $user['password'])) {
        jsonResponse(false, 'Invalid phone or password', null, 401);
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_phone'] = $user['phone'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];

    jsonResponse(true, 'Login successful', [
        'id' => $user['id'],
        'name' => $user['name'],
        'phone' => $user['phone'],
        'role' => $user['role']
    ]);
}
/**
 * Handle manual registration (optional register button)
 * Requires: Name + Email + Password + Phone + City
 */
function handleRegisterManual($conn, $data)
{
    $name = sanitize($data['name'] ?? '');
    $email = sanitize($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $phone = sanitize($data['phone'] ?? '');
    $city = sanitize($data['city'] ?? '');

    if (!$name || !$email || !$password || !$phone || !$city) {
        jsonResponse(false, 'Name, email, password, phone, and city are required', null, 422);
    }

    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        jsonResponse(false, 'Email already exists. Try another one.', null, 409);
    }

    // Check if phone already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $stmt->bind_param('s', $phone);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        jsonResponse(false, 'Phone already exists. Use this phone to login.', null, 409);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $stmt = $conn->prepare("
        INSERT INTO users (name, email, password, phone, city, role)
        VALUES (?, ?, ?, ?, ?, 'user')
    ");
    $stmt->bind_param('sssss', $name, $email, $passwordHash, $phone, $city);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        $userId = $stmt->insert_id;
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_role'] = 'user';
        $_SESSION['user_phone'] = $phone;

        jsonResponse(true, 'Registration successful', [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => 'user'
        ]);
    } else {
        jsonResponse(false, 'Registration failed', null, 500);
    }
}
/**
 * Handle guest checkout / automatic registration
 * Phone becomes password
 */
function handleGuestCheckout($conn, $data)
{
    $fullName = sanitize($data['name'] ?? '');
    $phone = sanitize($data['phone'] ?? '');
    $city = sanitize($data['city'] ?? '');

    if (!$fullName || !$phone || !$city) {
        jsonResponse(false, 'Full name, phone, and city are required', null, 422);
    }

    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->bind_param('s', $phone);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // User exists → login automatically
        jsonResponse(false, 'Phone already exists. Please login.', null, 409);
    } else {
        // Create new user with phone as password
        $passwordHash = password_hash($phone, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("
            INSERT INTO users (name, phone, city, password, role)
            VALUES (?, ?, ?, ?, 'user')
        ");
        $stmt->bind_param('ssss', $fullName, $phone, $city, $passwordHash);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $userId = $stmt->insert_id;
            $_SESSION['user_id'] = $userId;
            jsonResponse(true, 'Guest user created successfully', ['user_id' => $userId]);
        } else {
            jsonResponse(false, 'Failed to create guest user', null, 500);
        }
    }
}

/**
 * Handle logout
 */
function handleLogout()
{
    session_destroy();
    jsonResponse(true, 'Logout successful');
}

/**
 * Check authentication status
 */
function checkAuth()
{
    if (isset($_SESSION['user_id'])) {
        jsonResponse(true, 'User is authenticated', [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'] ?? null,
            'phone' => $_SESSION['user_phone'] ?? null,
            'role' => $_SESSION['user_role'] ?? 'user'
        ], 200);
    } else {
        jsonResponse(false, 'User is not authenticated', null, 200);
    }
}
