"use strict";

window.onload = function () {
	XML.get( 'export.php?f', App.init );
	console.log('build(); corrugate(); irrigate();');
}

var App = {
	init: function (mapData) {
		Map.init(mapData);
		Path.init();
	}
}

function build () {
	XML.get( 'export.php?b', Map.init );
}
function corrugate () {
	XML.get( 'export.php?c', Map.init );
}
function irrigate () {
	XML.get( 'export.php?w', Map.init );
}

function closestTo(number, set) {
	var closest = set[0];
	var prev = Math.abs(set[0] - number);

	for (var i = 1; i < set.length; i++) {
		var diff = Math.abs(set[i] - number);

		if (diff < prev) {
			prev = diff;
			closest = set[i];
		}
	}

	return closest;
}

var Map = {
	init: function (data) {

		var exp = JSON.parse(data);
		var map = exp.map;
		var tiles = exp.tiles;
		var size = Map.tileSize;
		var mapW = map.r*size + Math.abs(map.l*size);
		var mapH = map.b*size + Math.abs(map.u*size);
		var mapVPx = map.l*size;
		var mapVPy = map.u*size;
		Map.mapVPx = mapVPx;
		Map.mapVPy = mapVPy;

		Map.tiles = tiles;

		Map.c = document.getElementById('map').getContext('2d');
		Map.touchLayer = document.getElementById('touch').getContext('2d');
		var c = Map.c;
		c.canvas.width = mapW;
		c.canvas.height = mapH;
		Map.touchLayer.canvas.width = mapW;
		Map.touchLayer.canvas.height = mapH;
		c.translate(-mapVPx, -mapVPy);
		Map.touchLayer.translate(-mapVPx, -mapVPy);

		var len = map.tiles;
		var i = 0;
		var tile = null;
		var points = null;
		var height = null;
		for (i; i<len; i++) {
			tile = tiles[i];

			points = tile.points;
			height = tile.height;

			tiles[i].points.my = points.b+(points.c-points.b)/2;

			if (height == 1) {
				c.fillStyle = '#eeeeee';
			} else if (height == 2) {
				c.fillStyle = '#dcdcdc';
			} else if (height == 3) {
				c.fillStyle = '#c1c1c1';
			} else if (height == 4) {
				c.fillStyle = '#a9a9a9';
			} else {
				c.fillStyle = '#919191';
			}
			if (tile.type == 1) {
				c.fillStyle = "#99ddff";
			}

			c.beginPath();
			c.moveTo(points.m*size, points.a*size);
			c.lineTo(points.l*size, points.b*size);
			c.lineTo(points.l*size, points.c*size);
			c.lineTo(points.m*size, points.d*size);
			c.lineTo(points.r*size, points.c*size);
			c.lineTo(points.r*size, points.b*size);
			c.closePath();
			c.fill();

			// c.font = "8px Arial";
			// c.fillStyle = '#000';
			// c.fillText(tile.cord,points.l*size,points.c*size);

			if (tile.is_river) {

				var land = null;
				var type = 'full';
				if (tile.river_to) {
					land = tiles[tile.river_to-1].type;
					var b2 = tiles[tile.river_to-1].points.b;
					var c2 = tiles[tile.river_to-1].points.c;
					var m2 = tiles[tile.river_to-1].points.m;
				} else {
					if (tile.type != 1) {
						land = 0;
					}
					var b2 = null;
					var c2 = null;
					var m2 = null;
					type = 'half';
				}

				if (tile.type == 0) {
					land = 0;
				}

				if (land == 0) {
					Map.drawRiverArr.push({
						'id':tile.id-1,
						'type':type,
						'm1':tile.points.m,
						'my1':tile.points.my,
						'b2':b2,
						'c2':c2,
						'm2':m2
					});
				}

			}
		}
		Map.drawRivers();

		// hex points
		var hp = {
			b: 2 * Map.tileSize,
			m: 4 * Map.tileSize,
			c: 7 * Map.tileSize,
			r: 8 * Map.tileSize,
			d: 9 * Map.tileSize
		}

		var qc = mapW / hp.r;
		var rc = (mapH - hp.b) / hp.c;

		// help grid
		if (true) {
			var i = 1;
			var j = 1;
			var add = 0;
			var q = 0;
			var r = 0;

			c.lineWidth = 1;

			for (i = 1; i <= rc; i++) {
				r = i*hp.c+mapVPy-(2.5*Map.tileSize);

				if (add == 0) {
					add = hp.m;
				} else {
					add = 0;
				}

				for (j = 0; j < qc; j++) {
					q = j*hp.r+mapVPx+add+0.5+hp.m;

					var toX = j*hp.r+add+hp.m;
					var toY = i*hp.c-2.5*Map.tileSize;

					if (add) { // even
						Map.tileCentersXE.push(toX);
					} else {
						Map.tileCentersXO.push(toX);
					}
					Map.tileCentersY.push(toY);
					

				}
			}
		}

		return;
		
		document.getElementById('map').addEventListener('mousemove', function(e) {

			// Object.keys(data).forEach(function (key) {
			// 	console.log(data[key]);
			// });

			var rect = document.getElementById('map').getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;

			var closestY = closestTo(y, Map.tileCentersY);
			if (Math.floor(closestY / hp.c) % 2 ) {
				var closestX = closestTo(x, Map.tileCentersXO);
			} else {
				var closestX = closestTo(x, Map.tileCentersXE);
			}

			var q = closestX+Map.mapVPx;
			var r = closestY+Map.mapVPy;

			c.beginPath();
			c.moveTo(q-hp.m, r-(2.5*Map.tileSize));
			c.lineTo(q, r-(4.5*Map.tileSize));
			c.lineTo(q+hp.m, r-(2.5*Map.tileSize));
			c.lineTo(q+hp.m, r+(2.5*Map.tileSize));
			c.lineTo(q, r+(4.5*Map.tileSize));
			c.lineTo(q-hp.m, r+(2.5*Map.tileSize));
			c.lineTo(q-hp.m, r-(2.5*Map.tileSize));
			c.fillStyle = 'red';
			c.fill();
			c.closePath;

		});

	},
	tileSize: 3,
	tiles: [],
	tileCentersXE: [],
	tileCentersXO: [],
	tileCentersY: [],
	c: null,
	drawRiverArr: [],
	drawRivers: function () {
		var len = Map.drawRiverArr.length;
		var i = 0;
		var tile = null;
		var my2 = null;
		var c = Map.c;
		var size = Map.tileSize;
		for (i; i<len; i++) {
			tile = Map.drawRiverArr[i];

			c.beginPath();
			c.moveTo(tile.m1*size, tile.my1*size);
			if (tile.type == 'full') {
				my2 = tile.b2+(tile.c2-tile.b2)/2;
				c.lineTo(tile.m2*size, my2*size);
			} else {
				tile = Map.tiles[tile.id];
				var points = tile.points;
				var keys = Object.keys(tile);
				var len2 = keys.length;
				var j = 0;
				var noN = [];
				var selN = null;
				var lt1 = null;
				var lt2 = null;
				for (j; j<len2; j++) {
					if (keys[j].indexOf('n_') > -1 && tile[keys[j]] == null) {
						noN.push(keys[j]);
					}
				}
				if (noN.length) {
					selN = noN[Math.floor(Math.random()*noN.length)];
					if (selN == 'n_lu') {
						lt1 = (points.l+points.m)/2;
						lt2 = (points.a+points.b)/2;
						c.lineTo(lt1*size, lt2*size);
					} else if (selN == 'n_ru') {
						lt1 = (points.m+points.r)/2;
						lt2 = (points.a+points.b)/2;
						c.lineTo(lt1*size, lt2*size);
					} else if (selN == 'n_ll') {
						lt1 = points.l;
						lt2 = (points.b+points.c)/2;
						c.lineTo(lt1*size, lt2*size);
					} else if (selN == 'n_rr') {
						lt1 = points.r;
						lt2 = (points.b+points.c)/2;
						c.lineTo(lt1*size, lt2*size);
					} else if (selN == 'n_lb') {
						lt1 = (points.l+points.m)/2;
						lt2 = (points.c+points.d)/2;
						c.lineTo(lt1*size, lt2*size);
					} else if (selN == 'n_rb') {
						lt1 = (points.m+points.r)/2;
						lt2 = (points.d+points.c)/2;
						c.lineTo(lt1*size, lt2*size);
					}

				}

			}

			c.strokeStyle = "rgba(84, 192, 255, 0.3)";
			c.lineWidth = Math.abs(Map.tileSize*1.66);
			c.stroke();

		}
	}
}

var XML = {
	console: function (data) {
		if (console) {console.log(data)};
	},
	xhr: function (method, url, success) {
		var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		xhr.open(method, url);
		xhr.onreadystatechange = function() {
		  if (xhr.readyState>3 && xhr.status==200) success(xhr.responseText);
		};
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		return xhr;
	},
	get: function (url, success) {
		var xhr = XML.xhr('GET', url, success);
		xhr.send();
		return xhr;
	},
	post: function (url, data, success) {
		var params = typeof data == 'string' ? data : Object.keys(data).map(
			function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
		).join('&');
		var xhr = XML.xhr('POST', url, success);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		// xhr.setRequestHeader('Content-length', params.length);
		xhr.send(params);
		return xhr;
	}
}

var Path = {
	neighborDirs: [
		[1, 0, -1], // ul
		[1, -1, 0], // ll
		[0, -1, 1], // bl
		[-1, 0, 1], // br
		[-1, 1, 0], // rr
		[0, 1, -1]  // ur
	],
	timer: 'undefined',
	doneHex: [],
	nextHex: undefined,
	considerHex: {},
	startTile: null,
	goalTile: null,
	dirAngle: null,
	foundGoal: false,
	init: function () {
		var goalArrId = Math.floor(Math.random()*Map.tiles.length);
		var startArrId = Math.floor(Math.random()*Map.tiles.length);

		if (goalArrId == startArrId) {
			console.log('FROM and TO are the same tiles');
			return;
		}

		Path.goalTile = Map.tiles[goalArrId];
		Path.startTile = Map.tiles[startArrId];

		Path.startTile.points.m
		Path.drawCircleOnTouchLayer(Path.goalTile.points.m*Map.tileSize, Path.goalTile.points.my*Map.tileSize, 5, '#000000');
		Path.dirAngle = Path.getAngle (Path.startTile.points.m, Path.startTile.points.my, Path.goalTile.points.m, Path.goalTile.points.my);

		Path.nextHex = startArrId;
		Path.progressTile(Path.nextHex);
	},
	getAngle: function (mx1, my1, mx2, my2) {
		var dx = Math.abs(mx1 - mx2);
		var dy = Math.abs(my1 - my2);
		var theta = Math.atan2(dx, dy);
		theta *= 180 / Math.PI;
		theta = Math.round(theta);
		return theta;
	},
	progressTile: function (arrId) {
		var thisTile = Map.tiles[arrId];
		var neighborId = null;
		var i = 0;
		var j = 0;
		var len = 0;
		var len2 = 0;
		var neBo = [];
		var neTile = null;
		var distance = 0;
		var next = null;
		var passDone = true;
		var prevHex = null;

		if (thisTile.n_lb) { neBo.push(thisTile.n_lb); }
		if (thisTile.n_ll) { neBo.push(thisTile.n_ll); }
		if (thisTile.n_lu) { neBo.push(thisTile.n_lu); }
		if (thisTile.n_rb) { neBo.push(thisTile.n_rb); }
		if (thisTile.n_rr) { neBo.push(thisTile.n_rr); }
		if (thisTile.n_ru) { neBo.push(thisTile.n_ru); }

		Path.drawCircleOnTouchLayer(thisTile.points.m*Map.tileSize, thisTile.points.my*Map.tileSize, 5, '#FF9100');

		len = neBo.length;
		for (i; i < len; i++) {
			passDone = true;
			neTile = Map.tiles[neBo[i]-1];
			if (typeof Path.considerHex[neBo[i]-1] == 'undefined') {

				len2 = Path.doneHex.length;
				j = 0;
				for (j; j<len2; j++) {
					if (neTile.id == Path.doneHex[j]) {
						passDone = false;
					}
				}

				if (passDone) {
					distance = Path.tileDistance({x:neTile.points.m,y:neTile.points.my}, {x:Path.goalTile.points.m,y:Path.goalTile.points.my});
					Map.tiles[neBo[i]-1].pathCameFrom = arrId;
					Path.considerHex[neBo[i]-1] = {d:distance};

					if (neTile.id == Path.goalTile.id) {

						prevHex = Path.goalTile.id-1;

						while (Map.tiles[prevHex].pathCameFrom != Path.startTile.id-1) {
							prevHex = Map.tiles[prevHex].pathCameFrom;
							Path.drawCircleOnTouchLayer(Map.tiles[prevHex].points.m*Map.tileSize, Map.tiles[prevHex].points.my*Map.tileSize, 5, '#FF0000');
						}

						Path.foundGoal = true;
					} else {
						Path.drawCircleOnTouchLayer(neTile.points.m*Map.tileSize, neTile.points.my*Map.tileSize, 5, '#FFEA00');
					}
				}

			}
		}

		Path.findPrioHex();
		Path.doneHex.push(thisTile.id);

		if (typeof Path.nextHex == 'undefined') {
			console.log('error. no next tile');
		} else if (Path.foundGoal) {
			console.log('yee');
		} else {
			Path.progressTile(Path.nextHex);
		}

	},
	drawCircleOnTouchLayer: function (x, y, r, c) {
		Map.touchLayer.beginPath();
		Map.touchLayer.arc(x, y, r, 0, 2 * Math.PI, false);
		Map.touchLayer.fillStyle = c;
		Map.touchLayer.fill();
	},
	findPrioHex: function () {
		var len = Path.considerHex.length;
		var i = 0;
		var arr = [];
		var bestPrio = null;
		var conArr = [];
		var thetaArr = [];
		var angle = null;
		var curr = null;
		var choosen = null;
		var diff = null;

		// what is the best distance?
		Object.keys(Path.considerHex).forEach(function(k, i) {
			arr.push(Path.considerHex[k].d);
		});
		bestPrio = Math.min.apply( Math, arr );
		Object.keys(Path.considerHex).forEach(function(k, i) {
			if (Path.considerHex[k].d == bestPrio) {
				conArr.push(k);
			}
		});

		// what is the best angle?
		len = conArr.length;
		i = 0;
		for (i; i<len; i++) {
			angle = Path.getAngle (Map.tiles[conArr[i]].points.m, Map.tiles[conArr[i]].points.my, Path.goalTile.points.m, Path.goalTile.points.my);
			thetaArr.push({hexId: conArr[i], angle: angle});
		}
		curr = thetaArr[0].angle;
		choosen = thetaArr[0].hexId;
		diff = Math.abs (Path.dirAngle - curr);
		i = 0;
		for (i; i < len; i++) {
		  var newdiff = Math.abs (Path.dirAngle - thetaArr[i].angle);
		  if (newdiff < diff) {
		    diff = newdiff;
		    curr = thetaArr[i].angle;
		    choosen = thetaArr[i].hexId;
		  }
		}

		Path.nextHex = choosen;
		delete Path.considerHex[choosen];

	},
	tileDistance: function(a, b) { // euclidean distance
		return Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)));
	}
}
