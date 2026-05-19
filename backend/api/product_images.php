
<?php
require_once '../config/app.php';
applyCorsHeaders();

session_start();
require_once '../config/db.php';
require_once '../helpers/utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$data   = getRequestData();

switch ($method) {
    case 'GET': handleGetImages($conn, $data); break;
    case 'POST': handleUploadImages($conn, $data); break;
    case 'DELETE': handleDeleteImage($conn, $data); break;
    default: jsonResponse(false,'Method not allowed',null,405);
}

// ===== GET IMAGES BY PRODUCT =====
function handleGetImages($conn, $data) {
    $productId = intval($_GET['product_id'] ?? 0);
    if (!$productId) jsonResponse(false,'Invalid product ID',null,400);

    $stmt = $conn->prepare("SELECT id, image_path, is_main FROM product_images WHERE product_id=?");
    $stmt->bind_param('i', $productId);
    $stmt->execute();
    $res = $stmt->get_result();

    $images = [];
    while ($row = $res->fetch_assoc()) { $images[] = $row; }

    jsonResponse(true,'Images retrieved',$images);
}

// ===== UPLOAD IMAGES =====
function handleUploadImages($conn, $data) {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId || !isAdmin($conn,$userId)) jsonResponse(false,'Unauthorized',null,403);

    $productId = intval($_POST['product_id'] ?? 0);
    if (!$productId || !isset($_FILES['images'])) jsonResponse(false,'Product ID and images required',null,400);

    $uploadDir = '../uploads/products/';
    if (!is_dir($uploadDir)) mkdir($uploadDir,0755,true);

    $count = count($_FILES['images']['name']);
    $stmt = $conn->prepare("INSERT INTO product_images (product_id,image_path,is_main) VALUES (?,?,?)");

    // check if product has main image
    $mainCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM product_images WHERE product_id=? AND is_main=1");
    $mainCheck->bind_param('i',$productId); $mainCheck->execute(); $res = $mainCheck->get_result(); 
    $hasMain = ($res->fetch_assoc()['cnt'] > 0);

    for($i=0;$i<$count;$i++){
        if($_FILES['images']['error'][$i]===UPLOAD_ERR_OK){
            $filename = generateUniqueFilename($_FILES['images']['name'][$i]);
            $filepath = $uploadDir.$filename;
            if(move_uploaded_file($_FILES['images']['tmp_name'][$i],$filepath)){
                $isMain = (!$hasMain && $i===0)?1:0; // first uploaded if no main
                $stmt->bind_param('isi',$productId,$filename,$isMain);
                $stmt->execute();
            }
        }
    }

    jsonResponse(true,'Images uploaded successfully');
}

// ===== DELETE IMAGE =====
function handleDeleteImage($conn, $data) {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId || !isAdmin($conn,$userId)) jsonResponse(false,'Unauthorized',null,403);

    $id = intval($data['id'] ?? 0);
    if (!$id) jsonResponse(false,'Invalid image ID',null,400);

    // get filename
    $stmt = $conn->prepare("SELECT image_path, product_id, is_main FROM product_images WHERE id=?");
    $stmt->bind_param('i',$id); $stmt->execute(); $res=$stmt->get_result();
    if($res->num_rows===0) jsonResponse(false,'Image not found',null,404);

    $row = $res->fetch_assoc();
    $file = '../uploads/products/'.$row['image_path'];
    if(file_exists($file)) unlink($file);

    // delete db record
    $delStmt = $conn->prepare("DELETE FROM product_images WHERE id=?");
    $delStmt->bind_param('i',$id); $delStmt->execute();

    // if main image deleted, set another as main
    if($row['is_main']==1){
        $stmt2 = $conn->prepare("SELECT id FROM product_images WHERE product_id=? LIMIT 1");
        $stmt2->bind_param('i',$row['product_id']); $stmt2->execute(); $res2=$stmt2->get_result();
        if($res2->num_rows>0){
            $newMainId = $res2->fetch_assoc()['id'];
            $update = $conn->prepare("UPDATE product_images SET is_main=1 WHERE id=?");
            $update->bind_param('i',$newMainId); $update->execute();
        }
    }

    jsonResponse(true,'Image deleted successfully');
}
?>
