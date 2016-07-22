"use strict";

window.onload = function () {
	XML.get( 'export.php?f', App.init );
	console.log('build(); corrugate(); irrigate();');
	console.log('under maintenance');
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

function closestTo (number, set) {
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

function stringifyCord (px) {
	var way = null;
	if (px < 0) {
		way = 'm';
		px = Math.abs(px);
	} else {
		way = 'p';
	}
	if (px % 1 != 0) {
		px = px.toString().replace('.', 'd');
	}
	return way+px;
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

		// hex points
		Map.hp = {
			b: 2 * Map.tileSize,
			m: 4 * Map.tileSize,
			c: 7 * Map.tileSize,
			r: 8 * Map.tileSize,
			d: 9 * Map.tileSize
		}

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
		var pxr = null;
		var pxq = null;
		var neighbors = [];
		for (i; i<len; i++) {
			tile = tiles[i];

			points = tile.points;
			height = tile.height;

			tiles[i].points.my = points.b+(points.c-points.b)/2;

			neighbors = [];
			if (tiles[i].n_lb) { neighbors.push(tiles[i].n_lb-1); }
			if (tiles[i].n_ll) { neighbors.push(tiles[i].n_ll-1); }
			if (tiles[i].n_lu) { neighbors.push(tiles[i].n_lu-1); }
			if (tiles[i].n_rb) { neighbors.push(tiles[i].n_rb-1); }
			if (tiles[i].n_rr) { neighbors.push(tiles[i].n_rr-1); }
			if (tiles[i].n_ru) { neighbors.push(tiles[i].n_ru-1); }
			Path.tiles[i] = {
				neighbors: neighbors,
				x: tiles[i].points.m,
				y: tiles[i].points.my
			}

			pxr = stringifyCord(tiles[i].points.m*Map.tileSize);
			pxq = stringifyCord(tiles[i].points.my*Map.tileSize);

			if(Map.tileCentersObjY.hasOwnProperty(pxr)){
				Map.tileCentersObjY[pxr].push(i);
			} else {
				Map.tileCentersObjY[pxr] = [];
				Map.tileCentersObjY[pxr].push(i);
			}
			if(Map.tileCentersObjX.hasOwnProperty(pxq)){
				Map.tileCentersObjX[pxq].push(i);
			} else {
				Map.tileCentersObjX[pxq] = [];
				Map.tileCentersObjX[pxq].push(i);
			}

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

		var qc = mapW / Map.hp.r;
		var rc = (mapH - Map.hp.b) / Map.hp.c;

		// touching tiles
		var i = 1;
		var j = 1;
		var add = 0;
		var q = 0;
		var r = 0;
		var toX = null;
		var toY = null;

		for (i = 1; i <= rc; i++) {
			r = i*Map.hp.c+mapVPy-(2.5*Map.tileSize);

			if (add == 0) {
				add = Map.hp.m;
			} else {
				add = 0;
			}

			for (j = 0; j < qc; j++) {
				q = j*Map.hp.r+mapVPx+add+0.5+Map.hp.m;

				toX = j*Map.hp.r+add+Map.hp.m;
				toY = i*Map.hp.c-2.5*Map.tileSize;

				if (add) { // even
					Map.tileCentersXE.push(toX);
				} else {
					Map.tileCentersXO.push(toX);
				}
				Map.tileCentersY.push(toY);
				

			}
		}

	},
	tileSize: 3,
	tiles: [],
	tileCentersObjX: {},
	tileCentersObjY: {},
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
	},
	help: {
		drawTileById: function (id) {

			var points = Map.tiles[id].points;
			var c = Map.c;
			var size = Map.tileSize;
			c.fillStyle = 'red';

			c.beginPath();
			c.moveTo(points.m*size, points.a*size);
			c.lineTo(points.l*size, points.b*size);
			c.lineTo(points.l*size, points.c*size);
			c.lineTo(points.m*size, points.d*size);
			c.lineTo(points.r*size, points.c*size);
			c.lineTo(points.r*size, points.b*size);
			c.closePath();
			c.fill();

		}
	},
	getTileBy2Dcord: function (pxr, pxq) {
		var xArr = Map.tileCentersObjX[pxr];
		var yArr = Map.tileCentersObjY[pxq];
		var i = 0;
		var j = 0;
		var len1 = xArr.length;
		var len2 = yArr.length;
		for (i=0; i<len1; i++) {
			for (j=0; j<len2; j++) {
				if (xArr[i] == yArr[j]) {
					return xArr[i];
				}
			}
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
	open: [],
	closed: [],
	startTile: null,
	goalTile: null,
	initClick: null,
	tiles:[],
	touchLayerClicked: 0,
	init: function () {

		document.getElementById('touch').addEventListener('click', function(e) {
			// Object.keys(data).forEach(function (key) {
			// 	console.log(data[key]);
			// });

			var rect = document.getElementById('touch').getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;

			var closestY = closestTo(y, Map.tileCentersY);
			if (Math.floor(closestY / Map.hp.c) % 2 ) { // TODO something does sometimes not work out here
				var closestX = closestTo(x, Map.tileCentersXO);
			} else {
				var closestX = closestTo(x, Map.tileCentersXE);
			}

			var q = closestX+Map.mapVPx;
			var r = closestY+Map.mapVPy;

			var tileId = Map.getTileBy2Dcord(stringifyCord(r), stringifyCord(q));

			Map.touchLayer.save();
			Map.touchLayer.setTransform(1, 0, 0, 1, 0, 0);
			Map.touchLayer.clearRect(0,0,Map.touchLayer.canvas.width,Map.touchLayer.canvas.height);
			Map.touchLayer.restore();

			if (typeof tileId == 'undefined') {
				Path.startTile = null;
				Path.goalTile = null;
				Path.touchLayerClicked = 0;
				Path.initClick = false;
				return;
			}

			Path.drawCircleOnTouchLayer(q, r, 5, '#000000');

			Path.touchLayerClicked++;
			if (Path.touchLayerClicked == 1) {
				Path.startTile = tileId;
				Path.initClick = true;
			}

			if (Path.touchLayerClicked == 2 && Path.initClick) {
				Path.goalTile = tileId;
				if (Path.startTile == Path.goalTile) {
					Path.goalTile = null;
					Path.touchLayerClicked = 1;
				} else {
					Path.startPathFinder();
				}
			}

			if (Path.touchLayerClicked == 3) {
				Path.startTile = Path.goalTile;
				Path.goalTile = tileId;
				if (Path.startTile == Path.goalTile) {
					Path.goalTile = null;
					Path.touchLayerClicked = 1;
				} else {
					Path.touchLayerClicked = 2;
					Path.startPathFinder();
				}
			}

			// Map.touchLayer.beginPath();
			// Map.touchLayer.moveTo(q-Map.hp.m, r-(2.5*Map.tileSize));
			// Map.touchLayer.lineTo(q, r-(4.5*Map.tileSize));
			// Map.touchLayer.lineTo(q+Map.hp.m, r-(2.5*Map.tileSize));
			// Map.touchLayer.lineTo(q+Map.hp.m, r+(2.5*Map.tileSize));
			// Map.touchLayer.lineTo(q, r+(4.5*Map.tileSize));
			// Map.touchLayer.lineTo(q-Map.hp.m, r+(2.5*Map.tileSize));
			// Map.touchLayer.lineTo(q-Map.hp.m, r-(2.5*Map.tileSize));
			// Map.touchLayer.fillStyle = 'red';
			// Map.touchLayer.fill();
			// Map.touchLayer.closePath;
		});

	},
	startPathFinder: function () { // http://www.briangrinstead.com/blog/astar-search-algorithm-in-javascript
		// Path.tiles includes objects with data neighbors, x, y, g, d
		// Path.open and Path.closed include ids to Path.tiles
		var d = null;
		var lowInd = 0;
		var len = 0;
		var len2 = 0;
		var i = 0;
		var j = 0;
		var currentNode = null;
		var curr = null;
		var neighborId = null;
		var pass = null;
		var gScore = 0;
		var gScoreIsBest = null;

		d = Path.tileDistance({x:Map.tiles[Path.startTile].points.m,y:Map.tiles[Path.startTile].points.my}, {x:Map.tiles[Path.goalTile].points.m,y:Map.tiles[Path.goalTile].points.my});
		Path.tiles[Path.startTile].g = 0;
		Path.tiles[Path.startTile].d = d;
		Path.open.push(Path.startTile);

		while(Path.open.length > 0) {

			// Grab the lowest f(x) to process next
			lowInd = 0;
			len = Path.open.length;
			for (i=0; i<len; i++) {
				if(Path.tiles[Path.open[i]].f < Path.tiles[Path.open[lowInd]].f) { lowInd = i; }
			}
			currentNode = Path.open[lowInd];

			// End case -- result has been found, return the traced path
			if (currentNode == Path.goalTile) {

				curr = Path.tiles[currentNode];
				while(typeof curr.parent != 'undefined') {
					Path.drawCircleOnTouchLayer(Path.tiles[curr.parent].x*Map.tileSize, Path.tiles[curr.parent].y*Map.tileSize, 5, '#FF9100'); // orange
					curr = Path.tiles[curr.parent];
				}

				Path.resetPathfinder();

				return;
			}

			// Normal case -- move currentNode from open to closed, process each of its neighbors
			Path.open.splice(Path.open.indexOf(currentNode), 1);
			Path.closed.push(currentNode);
			Path.drawCircleOnTouchLayer(Path.tiles[currentNode].x*Map.tileSize, Path.tiles[currentNode].y*Map.tileSize, 5, '#FFFF00'); // yellow
			len = Path.tiles[currentNode].neighbors.length;
			neighborId = null;

			for (i=0; i<len;i++) {
				neighborId = Path.tiles[currentNode].neighbors[i];

				// don't rerun closed
				len2 = Path.closed.length;
				pass = true;
				for (j = 0; j<len2; j++) {
					if (neighborId == Path.closed[j]) {
						pass = false;
					}
				}
				if (pass == false) {
					continue;
				}

				// g score is the shortest distance from start to current node, we need to check if
				//	 the path we have arrived at this neighbor is the shortest one we have seen yet
				gScore = Path.tiles[currentNode].g + 1; // 1 is the distance from a node to it's neighbor
				gScoreIsBest = false;

				len2 = Path.open.length;
				pass = false;
				for (j=0; j<len2; j++) {
					if (neighborId == Path.open[j]) {
						pass = true;
					}
				}
				if (pass == false) {
					gScoreIsBest = true;
					d = Path.tileDistance({x:Path.tiles[neighborId].x,y:Path.tiles[neighborId].y}, {x:Map.tiles[Path.goalTile].points.m,y:Map.tiles[Path.goalTile].points.my});
					Path.tiles[neighborId].d = d;
					Path.open.push(neighborId);
				} else if (gScore < Path.tiles[neighborId].g) {
					// We have already seen the node, but last time it had a worse g (distance from start)
					gScoreIsBest = true;
				}
				if (gScoreIsBest) {
					// Found an optimal (so far) path to this node
					Path.tiles[neighborId].parent = currentNode;
					Path.tiles[neighborId].g = gScore;
					Path.tiles[neighborId].f = Path.tiles[neighborId].g + Path.tiles[neighborId].d;
				}
			}

		}

	},
	resetPathfinder: function () {
		var i = 0;
		var len = Path.tiles.length;
		for (i=0; i<len; i++) {
			delete Path.tiles[i]['g'];
			delete Path.tiles[i]['d'];
			delete Path.tiles[i]['f'];
			delete Path.tiles[i]['parent'];
		}
		// Path.initClick = false;
		Path.open = [];
		Path.closed = [];
	},
	drawCircleOnTouchLayer: function (x, y, r, c) {
		Map.touchLayer.beginPath();
		Map.touchLayer.arc(x, y, r, 0, 2 * Math.PI, false);
		Map.touchLayer.fillStyle = c;
		Map.touchLayer.fill();
	},
	tileDistance: function(a, b) { // euclidean distance
		return Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)));
	}
}
