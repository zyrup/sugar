<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0">
		<title>mapgen</title>
		<link rel="stylesheet" type="text/css" href="main.css">
		<script type="text/javascript" src="main.js"></script>
	</head>
	<body>
		<canvas id="map"></canvas>
		<div class="menu">
			<div class="entry entry-tilecap">
				<div class="name">Tile Cap<span>1000</span></div>
				<input type="range" value="1000" min="1" max="1000000">
			</div>
			<div class="entry entry-pow">
				<div class="name">pow<span>0.00125</span></div>
				<input type="range" value="0.00125" step="0.00005" min="0.00125" max="1">
			</div>
			<div class="entry entry-tilesize">
				<div class="name">Tile size<span>1</span></div>
				<input type="range" value="1" step="0.25" min="0.25" max="10">
			</div>
			<div class="entry entry-showcords">
				<div class="name">Show cords</div>
				<input type="checkbox" name="cords">
			</div>
			<div class="entry">
				<div class="name">(Later) Fill gaps</div>
				<input type="checkbox" name="fillgaps" value="fillgaps">
			</div>
			<div class="entry">
				<div class="name">(Later) Click layer</div>
				<input type="checkbox" name="fillgaps" value="fillgaps">
			</div>
			<input type="button" name="send" value="send">
		</div>
	</body>
</html>