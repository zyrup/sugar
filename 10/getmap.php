<?php

ini_set('memory_limit','1024M');

if (isset($_GET['tilecap']) && isset($_GET['pow'])) {
	unlink ('tiles.json');
	$fillgap = 0;
	if (isset($_GET['fillgap'])) {
		$fillgap = ' '.$_GET['fillgap'];
	} else {
		$fillgap = '';
	}
	$corrugation = 0;
	if (isset($_GET['h'])) {
		$corrugation = ' '.$_GET['h'];
	} else {
		$corrugation = '';
	}
	exec('./mapgen '.$_GET['tilecap'].' '.$_GET['pow'].$fillgap.$corrugation.' &> /dev/null &');
} elseif (file_exists('tiles.json')) {
	ob_start('ob_gzhandler');
	echo "{ \"tiles\":[";
		include_once 'tiles.json';
	if (file_exists('rivers.json')) {
		echo "], \"rivers\":[";
			include_once 'rivers.json';
	}
	echo "]}";
}
