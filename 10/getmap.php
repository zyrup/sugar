<?php

exec('./mapgen '.$_GET['tilecap'].' '.$_GET['pow'].' &> /dev/null &');
echo "{ \"tiles\":[";
	include_once 'export.json';
echo "]}";