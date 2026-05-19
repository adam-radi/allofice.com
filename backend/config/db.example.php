<?php

require_once __DIR__ . '/app.php';

define('DB_HOST', appEnv('DB_HOST', 'localhost'));
define('DB_USER', appEnv('DB_USER', 'root'));
define('DB_PASS', appEnv('DB_PASS', ''));
define('DB_NAME', appEnv('DB_NAME', 'library_printing_db'));

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

$conn->set_charset('utf8mb4');
