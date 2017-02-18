<?php

if (isset($_GET['tilecap']) && isset($_GET['pow'])) {
	unlink ('export.json');
	exec('./mapgen '.$_GET['tilecap'].' '.$_GET['pow'].' &> /dev/null &');
} elseif (file_exists('export.json')) {
	ob_start('ob_gzhandler');
	echo "{ \"tiles\":[";
		include_once 'export.json';
	echo "]}";
}
