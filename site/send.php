<?php
// Envía la captura del configurador a una dirección fija (no se acepta destinatario del navegador).
header('Content-Type: application/json; charset=utf-8');

$TO   = 'gregor@gpworx.com';
$FROM = 'gregor@gpworx.com';
$MAX  = 10 * 1024 * 1024; // 10 MB

function fail($code, $msg) { http_response_code($code); echo json_encode(['ok' => false, 'error' => $msg]); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Método no permitido');
if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) fail(400, 'Falta la imagen');
if ($_FILES['image']['size'] > $MAX) fail(413, 'Imagen demasiado grande');

$data = file_get_contents($_FILES['image']['tmp_name']);
if (substr($data, 0, 8) !== "\x89PNG\r\n\x1a\n") fail(400, 'Formato no válido');

$clean = function ($s, $len) { return mb_substr(str_replace(["\r", "\0"], '', (string)$s), 0, $len); };
$subject = $clean($_POST['subject'] ?? 'Captura del configurador', 200);
$subject = str_replace("\n", ' ', $subject);
$body    = $clean($_POST['body'] ?? '', 5000);
$name    = preg_replace('/[^A-Za-z0-9._-]/', '', $_FILES['image']['name']) ?: 'captura.png';

$b = 'b' . bin2hex(random_bytes(12));
$headers  = "From: GPworx Configurador <$FROM>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$b\"\r\n";

$msg  = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n";
$msg .= str_replace("\n", "\r\n", $body) . "\r\n";
$msg .= "--$b\r\nContent-Type: image/png; name=\"$name\"\r\nContent-Transfer-Encoding: base64\r\n";
$msg .= "Content-Disposition: attachment; filename=\"$name\"\r\n\r\n";
$msg .= chunk_split(base64_encode($data)) . "--$b--\r\n";

$encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
if (!mail($TO, $encSubject, $msg, $headers, "-f$FROM")) fail(500, 'El servidor no pudo enviar el correo');

echo json_encode(['ok' => true]);
