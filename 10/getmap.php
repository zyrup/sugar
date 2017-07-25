<?php

ini_set('memory_limit','1024M');

if (isset($_GET['tilecap']) && isset($_GET['pow'])) {
	unlink ('export.json');
	$fillgap = 0;
	if (isset($_GET['fillgap'])) {
		$fillgap = ' '.$_GET['fillgap'];
	} else {
		$fillgap = '';
	}
	exec('./mapgen '.$_GET['tilecap'].' '.$_GET['pow'].$fillgap.' &> /dev/null &');
} elseif (file_exists('export.json')) {
	ob_start('ob_gzhandler');
	echo "{ \"tiles\":[";
		include_once 'export.json';
	echo "]}";
}
