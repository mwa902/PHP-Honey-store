<?php
$host = $_SERVER['HTTP_HOST'];
$uri  = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
header('Location: http://' . $host . $uri . '/home/home.html', true, 302);
exit;
