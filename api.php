<?php
// Сервер для редактирования каталога: вход, сохранение товаров, загрузка фото.
require __DIR__ . '/config.php';
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dataFile = __DIR__ . '/data/products.json';
$imgDir   = __DIR__ . '/images';

function out($a, $code = 200) { http_response_code($code); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }
function body() { $j = json_decode(file_get_contents('php://input'), true); return is_array($j) ? $j : []; }

$action = $_GET['action'] ?? '';

if ($action === 'status') {
    out(['admin' => !empty($_SESSION['admin']), 'csrf' => $_SESSION['csrf'] ?? null]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Только POST'], 405);

if ($action === 'login') {
    if (ADMIN_PASSWORD === 'ИЗМЕНИТЕ-ЭТОТ-ПАРОЛЬ') out(['error' => 'Сначала задайте свой пароль в файле config.php'], 403);
    usleep(500000); // защита от подбора пароля
    $in = body();
    if (isset($in['password']) && hash_equals(ADMIN_PASSWORD, (string)$in['password'])) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
        out(['ok' => true, 'csrf' => $_SESSION['csrf']]);
    }
    out(['error' => 'Неверный пароль'], 403);
}

if (empty($_SESSION['admin'])) out(['error' => 'Нужно войти как владелец'], 401);
if (!hash_equals($_SESSION['csrf'] ?? '', $_SERVER['HTTP_X_CSRF'] ?? '')) out(['error' => 'Ошибка безопасности, войдите заново'], 403);

if ($action === 'logout') { session_destroy(); out(['ok' => true]); }

if ($action === 'save') {
    $in = body();
    if (!isset($in['products']) || !is_array($in['products'])) out(['error' => 'Неверные данные'], 400);
    $clean = [];
    foreach ($in['products'] as $p) {
        if (!is_array($p)) continue;
        $photo = (string)($p['photo'] ?? '');
        if (!preg_match('#^images/[A-Za-z0-9._-]+$#', $photo)) $photo = '';
        $clean[] = [
            'id'       => (int)($p['id'] ?? 0),
            'name'     => mb_substr(trim((string)($p['name'] ?? '')), 0, 200),
            'box'      => (float)($p['box'] ?? 0),
            'pack'     => (float)($p['pack'] ?? 0),
            'price'    => (float)($p['price'] ?? 0),
            'section'  => in_array($p['section'] ?? '', ['sweets', 'dairy'], true) ? $p['section'] : 'sweets',
            'category' => mb_substr(trim((string)($p['category'] ?? '')), 0, 60),
            'emoji'    => mb_substr((string)($p['emoji'] ?? ''), 0, 8),
            'photo'    => $photo,
        ];
    }
    if (file_exists($dataFile)) @copy($dataFile, $dataFile . '.bak'); // резервная копия предыдущей версии
    $tmp = $dataFile . '.tmp';
    if (file_put_contents($tmp, json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) === false || !rename($tmp, $dataFile))
        out(['error' => 'Не удалось записать data/products.json — проверьте права на папку data (755/775)'], 500);
    out(['ok' => true]);
}

if ($action === 'upload') {
    $f = $_FILES['photo'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) out(['error' => 'Файл не получен (возможно, слишком большой)'], 400);
    if ($f['size'] > 5 * 1024 * 1024) out(['error' => 'Файл больше 5 МБ'], 400);
    $info = @getimagesize($f['tmp_name']);
    $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    if (!$info || !isset($ext[$info[2]])) out(['error' => 'Допустимы только JPG, PNG, WEBP'], 400);
    if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);
    $name = date('ymd') . '-' . bin2hex(random_bytes(4)) . '.' . $ext[$info[2]];
    if (!move_uploaded_file($f['tmp_name'], $imgDir . '/' . $name)) out(['error' => 'Не удалось сохранить фото — проверьте права на папку images'], 500);
    out(['ok' => true, 'path' => 'images/' . $name]);
}

out(['error' => 'Неизвестное действие'], 400);
