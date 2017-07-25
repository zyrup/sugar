<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0">
		<title>Faster map generator</title>
		<link rel="stylesheet" type="text/css" href="main.css">
		<script type="text/javascript" src="main.js"></script>
	</head>
	<body>
		<div class="browser-dev-info">Currently tested and developed with Chrome Version 59.0.3071.115 (Official Build) (64-bit)</div>
		<svg id="clicklayer"></svg>
		<canvas id="map"></canvas>
		<div class="menu">
			<div class="entry row entry-tilecap">
				<div class="col col30">
					<div class="name row">
						<div class="col col40">Tile Cap</div>
						<input class="col col60" type="text" value="1000" name="value-tilecap">
					</div>
				</div>
				<div class="col col70">
					<input type="range" value="1000" min="1" max="1000000">
				</div>
			</div>
			<div class="entry row entry-pow">
				<div class="col col30">
					<div class="name row">
						<div class="col col40">pow</div>
						<input class="col col60" type="text" value="0.00125" name="value-pow">
					</div>
				</div>
				<div class="col col70">
					<input type="range" value="0.00125" step="0.00005" min="0.00125" max="1">
				</div>
			</div>
			<div class="entry row entry-tilesize">
				<div class="col col30">
					<div class="name row">
						<div class="col col40">Tile size</div>
						<input class="col col60" type="text" value="2" name="value-tilesize">
					</div>
				</div>
				<div class="col col70">
					<input type="range" value="2" step="0.25" min="0.25" max="10">
				</div>
			</div>
			<div class="entry row entry-clicklayer">
				<div class="col col30">
					<div class="name row">
						<div class="col col40">Click layer</div>
						<input class="col col40" type="checkbox" name="clicklayer" checked>
					</div>
				</div>
			</div>
			<div class="entry row entry-fillgaps">
				<div class="col col30">
					<div class="name row">
						<div class="col col40">Fill gaps</div>
						<input class="col col40" type="checkbox" name="fillgaps" value="fillgaps" checked>
					</div>
				</div>
			</div>
			<div class="more-info"></div>
			<input type="button" name="send" value="send">
		</div>
		<div class="tile-info">
			
		</div>
	</body>
</html>