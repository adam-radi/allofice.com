<?php
// Database setup script
$servername = "localhost";
$username = "root";
$password = "";

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS library_printing_db";
if ($conn->query($sql) === TRUE) {
    echo "Database created successfully\n";
} else {
    echo "Error creating database: " . $conn->error . "\n";
}

// Select database
$conn->select_db("library_printing_db");

// Create users table
$usersTable = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($usersTable) === TRUE) {
    echo "Users table created successfully\n";
} else {
    echo "Error creating users table: " . $conn->error . "\n";
}

// Create categories table
$categoriesTable = "CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($categoriesTable) === TRUE) {
    echo "Categories table created successfully\n";
} else {
    echo "Error creating categories table: " . $conn->error . "\n";
}

// Create products table
$productsTable = "CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    product_type ENUM('office', 'printing') DEFAULT 'office',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
)";

if ($conn->query($productsTable) === TRUE) {
    echo "Products table created successfully\n";
} else {
    echo "Error creating products table: " . $conn->error . "\n";
}

// Create product_images table
$imagesTable = "CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)";

if ($conn->query($imagesTable) === TRUE) {
    echo "Product images table created successfully\n";
} else {
    echo "Error creating product images table: " . $conn->error . "\n";
}

// Create orders table
$ordersTable = "CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";

if ($conn->query($ordersTable) === TRUE) {
    echo "Orders table created successfully\n";
} else {
    echo "Error creating orders table: " . $conn->error . "\n";
}

// Create order_items table
$orderItemsTable = "CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)";

if ($conn->query($orderItemsTable) === TRUE) {
    echo "Order items table created successfully\n";
} else {
    echo "Error creating order items table: " . $conn->error . "\n";
}

// Create offers table
$offersTable = "CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    image_path VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($offersTable) === TRUE) {
    echo "Offers table created successfully\n";
} else {
    echo "Error creating offers table: " . $conn->error . "\n";
}

// Insert sample admin user
$adminEmail = "admin@library.com";
$adminPassword = password_hash("admin123", PASSWORD_BCRYPT);
$checkAdmin = "SELECT id FROM users WHERE email = ?";
$stmt = $conn->prepare($checkAdmin);
$stmt->bind_param('s', $adminEmail);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $insertAdmin = "INSERT INTO users (name, email, password, phone, city, role, created_at) VALUES (?, ?, ?, ?, ?, 'admin', NOW())";
    $adminStmt = $conn->prepare($insertAdmin);
    $adminName = "Admin";
    $adminPhone = "0123456789";
    $adminCity = "Cairo";
    $adminStmt->bind_param('sssss', $adminName, $adminEmail, $adminPassword, $adminPhone, $adminCity);
    
    if ($adminStmt->execute()) {
        echo "Admin user created successfully\n";
        echo "Admin email: admin@library.com\n";
        echo "Admin password: admin123\n";
    } else {
        echo "Error creating admin user: " . $conn->error . "\n";
    }
}

// Insert sample categories
$categories = [
    ['Books', 'All types of books'],
    ['Notebooks', 'Writing notebooks and pads'],
    ['Pens', 'Writing instruments'],
    ['Printing Services', 'Professional printing services']
];

foreach ($categories as $cat) {
    $checkCat = "SELECT id FROM categories WHERE name = ?";
    $catStmt = $conn->prepare($checkCat);
    $catStmt->bind_param('s', $cat[0]);
    $catStmt->execute();
    $catResult = $catStmt->get_result();
    
    if ($catResult->num_rows === 0) {
        $insertCat = "INSERT INTO categories (name, description) VALUES (?, ?)";
        $insertStmt = $conn->prepare($insertCat);
        $insertStmt->bind_param('ss', $cat[0], $cat[1]);
        $insertStmt->execute();
    }
}

echo "Database setup completed successfully!\n";

$conn->close();
?>
