<?php

ini_set('memory_limit','1024M');

exec('./mapgen 700 1 1 2 40 &> /dev/null &');

ob_start('ob_gzhandler');
echo "{ \"tiles\":[";
	include_once 'tiles.json';
if (file_exists('rivers.json')) {
	echo "], \"rivers\":[";
		include_once 'rivers.json';
}
echo "]}";
