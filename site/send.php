<?php
// Envía la captura del configurador a una dirección fija (no se acepta destinatario del navegador).
header('Content-Type: application/json; charset=utf-8');

$TO   = 'gregor@gpworx.com';
$FROM = 'info@gpworx.com'; // mismo buzón que el formulario de contacto de la web
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
$headers  = "From: GPworx Configurador <__FROM__>\r\nReply-To: <$TO>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$b\"\r\n";

$msg  = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n";
$msg .= str_replace("\n", "\r\n", $body) . "\r\n";
$msg .= "--$b\r\nContent-Type: image/png; name=\"$name\"\r\nContent-Transfer-Encoding: base64\r\n";
$msg .= "Content-Disposition: attachment; filename=\"$name\"\r\n\r\n";
$msg .= chunk_split(base64_encode($data)) . "--$b--\r\n";

$encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

// Si existe mail-config.php (lo genera la publicación desde los secretos de GitHub),
// se envía por SMTP autenticado a través del servidor de correo real (servidor-correo.net).
$cfgFile = __DIR__ . '/mail-config.php';
$cfg = is_file($cfgFile) ? include $cfgFile : null;

// Si no, se reutiliza la configuración SMTP del formulario de contacto de la web (php/mail.php),
// leyéndola en el propio servidor: la contraseña no se copia a ningún otro sitio.
if (!is_array($cfg) || empty($cfg['pass'])) {
    $webMail = dirname(__DIR__) . '/php/mail.php';
    if (is_file($webMail)) {
        $src = file_get_contents($webMail);
        $get = function ($var) use ($src) { return preg_match('/\$' . $var . '\s*=\s*([\'"])(.*?)\1\s*;/', $src, $m) ? stripcslashes($m[2]) : ''; };
        $cfg = ['host' => $get('host'), 'user' => $get('username'), 'pass' => $get('password')];
        if ($get('from')) $FROM = $get('from');
    }
}

$headers = str_replace('__FROM__', $FROM, $headers);
if (is_array($cfg) && !empty($cfg['pass'])) {
    $err = smtp_send($cfg, $FROM, $TO, $encSubject, $headers, $msg);
    if ($err !== null) fail(502, 'SMTP: ' . $err);
} else {
    if (!mail($TO, $encSubject, $msg, $headers, "-f$FROM")) fail(500, 'El servidor no pudo enviar el correo');
}
echo json_encode(['ok' => true, 'via' => (is_array($cfg) && !empty($cfg['pass'])) ? 'smtp' : 'mail']);

function smtp_send($cfg, $from, $to, $subject, $headers, $body) {
    $host = $cfg['host'] ?: 'smtp.servidor-correo.net';
    $user = $cfg['user'] ?: $from;
    $tries = [['tcp://' . $host, 587, true], ['ssl://' . $host, 465, false], ['tcp://' . $host, 25, null]];
    $last = 'sin conexión';
    foreach ($tries as [$addr, $port, $starttls]) {
        // El certificado del servidor de correo puede ser del proveedor (servidor-correo.net) y no de smtp.gpworx.com:
        // se verifica la cadena del certificado pero no el nombre.
        $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => false, 'SNI_enabled' => true, 'peer_name' => $host]]);
        $fp = @stream_socket_client("$addr:$port", $en, $es, 15, STREAM_CLIENT_CONNECT, $ctx);
        if (!$fp) { $last = "$port: $es"; continue; }
        stream_set_timeout($fp, 20);
        $r = function () use ($fp) { $d = ''; while (($l = fgets($fp, 1024)) !== false) { $d .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; } return $d; };
        $c = function ($cmd, $ok) use ($fp, $r) { fwrite($fp, $cmd . "\r\n"); $res = $r(); if (strpos($res, (string)$ok) !== 0) throw new Exception(trim($res) ?: 'sin respuesta'); return $res; };
        try {
            $g = $r(); if (strpos($g, '220') !== 0) throw new Exception(trim($g));
            $ehlo = $c('EHLO gpworx.com', 250);
            if ($starttls === null && stripos($ehlo ?? '', 'STARTTLS') === false) { /* puerto 25 sin TLS */ }
            elseif ($starttls !== false) {
                $c('STARTTLS', 220);
                if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new Exception('TLS');
                $c('EHLO gpworx.com', 250);
            }
            $c('AUTH LOGIN', 334);
            $c(base64_encode($user), 334);
            $c(base64_encode($cfg['pass']), 235);
            $c("MAIL FROM:<$from>", 250);
            $c("RCPT TO:<$to>", 250);
            $c('DATA', 354);
            $data = "To: <$to>\r\nSubject: $subject\r\nDate: " . date('r') . "\r\n" . $headers . "\r\n" . $body;
            $data = preg_replace('/^\./m', '..', $data);
            $c($data . "\r\n.", 250);
            fwrite($fp, "QUIT\r\n"); fclose($fp);
            return null;
        } catch (Exception $e) { $last = "$port: " . $e->getMessage(); @fclose($fp); }
    }
    return $last;
}
