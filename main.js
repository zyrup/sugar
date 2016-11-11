"use strict";

window.onload = function () {
	Sock.connect2Server();
	console.log('build(); corrugate(); irrigate();');
	// console.log('under maintenance');
}

function build () {
	Sock.socket.send('BUILD');
}
function corrugate () {
	Sock.socket.send('CORRUGATE');
}
function irrigate () {
	Sock.socket.send('IRRIGATE');
}

function closestTo (number, set, ignore) {
	var closest = set[0];
	var prev = Math.abs(set[0] - number);

	for (var i = 1; i < set.length; i++) {
		var diff = Math.abs(set[i] - number);

		if (set[i] != ignore) {
			if (diff < prev) {
				prev = diff;
				closest = i; // set[i]
			}
		}
	}

	return closest;
}

var insidePolygon = function (point, vs) {
	// ray-casting algorithm based on
	// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

	var x = point[0], y = point[1];

	var inside = false;
	for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		var xi = vs[i][0], yi = vs[i][1];
		var xj = vs[j][0], yj = vs[j][1];

		var intersect = ((yi > y) != (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
};

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
		Map.mapW = mapW;
		Map.mapH = mapH;

		Map.tiles = [];
		Map.tileCentersObjX = {};
		Map.tileCentersObjY = {};
		Map.tileCentersXE = [];
		Map.tileCentersXO = [];
		Map.tileCentersY = [];

		// hex points
		Map.hp = {
			b: 2 * Map.tileSize,
			m: 4 * Map.tileSize,
			c: 7 * Map.tileSize,
			r: 8 * Map.tileSize,
			d: 9 * Map.tileSize,
			s: 5 * Map.tileSize
		}

		Map.tiles = tiles;

		Map.c = document.getElementById('map').getContext('2d');
		Map.touchLayer = document.getElementById('touch').getContext('2d');
		Map.unitLayer = document.getElementById('units').getContext('2d');
		var c = Map.c;
		c.canvas.width = mapW;
		c.canvas.height = mapH;
		Map.touchLayer.canvas.width = mapW;
		Map.touchLayer.canvas.height = mapH;
		Map.unitLayer.canvas.width = mapW;
		Map.unitLayer.canvas.height = mapH;
		c.translate(-mapVPx, -mapVPy);
		Map.touchLayer.translate(-mapVPx, -mapVPy);
		Map.unitLayer.translate(-mapVPx, -mapVPy);

		var len = tiles.length;
		var i = 0;
		var tile = null;
		var points = null;
		var height = null;
		var cord = null;
		var pxr = null;
		var pxq = null;
		var neighbors = [];
		for (i; i<len; i++) {
			tile = tiles[i];

			points = tile.points;
			height = tile.height;
			cord = tile.cord;
			// cord = cord.match(/.[0-9]+/g);
			// cord = cord.split(/[^\w\s]/gi);
			// "-2".match(/.{1,1}/g)

			// tiles[i].r = cord[2];

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
				y: tiles[i].points.my,
				height: tiles[i].height,
			}
			if (tiles[i].type == 1) {
				Path.tiles[i].water = true;
			}

			pxr = tiles[i].points.m*Map.tileSize;
			pxq = tiles[i].points.my*Map.tileSize;
			var middleX = points.l*size - Map.mapVPx + Map.hp.m;
			var middleY = points.a*size - Map.mapVPy + Map.hp.m;
			pxr = middleY;
			pxq = middleX;
			Map.tileCentersX.push(middleX);
			Map.tileCentersY.push(middleY);

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
			// c.fillText(tile.cord,points.l*size,(points.my-1)*size);

			// c.beginPath();
			// c.rect(points.m*size-2.5,points.my*size-2.5,5,5);
			// c.fill();
			// c.closePath;

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
		Map.drawPortals();

		// console.log(Map.tiles[Map.mapMeasure.idY]);
		// Map.help.drawTileById(Map.mapMeasure.idY);
		// var ooo = Map.tiles[Map.mapMeasure.idY].points.l * Map.tileSize;
		// console.log(ooo, Map.mapW, Map.mapVPx);

		// touching tiles
		// var i = 1;
		// var j = 1;
		// var add = 0;
		// var q = 0;
		// var r = 0;
		// var toX = null;
		// var toY = null;

		// for (i = 0; i <= rc; i++) {
		// 	r = i*Map.hp.c+mapVPy-(2.5*Map.tileSize);

		// 	if (add == 0) {
		// 		add = Map.hp.m;
		// 	} else {
		// 		add = 0;
		// 	}

		// 	for (j = 0; j < qc; j++) {
		// 		q = j*Map.hp.r+mapVPx+add+0.5+Map.hp.m;

		// 		toX = j*Map.hp.r+add+Map.hp.m;
		// 		toY = i*Map.hp.c-2.5*Map.tileSize;

		// 		if (add) {
		// 			if (qc % 1 == 0) { // add even
		// 				Map.tileCentersXE.push(toX);
		// 			} else {  // add odd
		// 				Map.tileCentersXO.push(toX);
		// 			}
		// 		} else {

		// 			if (qc % 1 == 0) { // !add even
		// 				Map.tileCentersXO.push(toX);
		// 			} else { // !add odd
		// 				Map.tileCentersXE.push(toX);
		// 			}
		// 		}
		// 		Map.tileCentersY.push(toY);

		// 		Map.c.beginPath();
		// 		Map.c.rect(toX-2.5,toY-2.5,5,5);
		// 		Map.c.fill();
		// 		Map.c.closePath;
				

		// 	}
		// }
		// Map.touchLayerInit(0);

	},
	touchLayerInit: function (forceNegOnset) {

		var dd = Math.abs(Map.tiles[0].points.m*Map.tileSize);
		var aa = Math.abs(Map.tiles[0].points.my*Map.tileSize);
		var qc = Map.mapW / Map.hp.r;
		var rc = (Map.mapH - Map.hp.b) / Map.hp.c;
		var i = 0;
		var j = 0;
		var add = 0;
		var q = 0;
		var r = 0;
		var toX = null;
		var toY = null;
		var pass = false;

		Map.c.fillStyle = 'red';

		if (forceNegOnset) {
			Map.c.fillStyle = 'blue';
			add = Map.hp.m;
		}
		// add = Map.hp.m;

		Map.tileCentersXO = [];
		Map.tileCentersXE = [];
		Map.tileCentersY = [];

		for (i = 0; i <= rc; i++) {

			if (add == 0) {
				add = Map.hp.m;
			} else {
				add = 0;
			}

			for (j = 0; j <= qc; j++) {

				toX = j*Map.hp.r+add;
				toY = i*Map.hp.c-2.5*Map.tileSize;

				if (dd == toX && aa == toY) { // ugly hack ^^ will be redundant in future
					console.log(8);
					pass = true;
				}

				if (add) {
					Map.tileCentersXE.push(toX);
				} else {
					Map.tileCentersXO.push(toX);
				}

				Map.tileCentersY.push(toY);

				Map.c.beginPath();
				Map.c.rect(toX+Map.mapVPx-2.5,toY+Map.mapVPy-2.5,5,5);
				Map.c.fill();
				Map.c.closePath;
				
			}
		}

		if (!pass) {
			console.log(5);
			Map.negOnpos = false;
			if (forceNegOnset == 1) {
				console.log(4);
				Map.touchLayerInit(1);
			} else {
				console.log(6);
				Map.touchLayerInit(1);
			}
		} else {
			Map.negOnpos = true;
			console.log(9);
			Map.touchLayerInit(1);
		}

		// Map.touchLayerInit(1);
		// return;
	},
	tileSize: 4,
	tiles: [],
	tileCentersObjX: {},
	tileCentersObjY: {},
	tileCentersXE: [],
	tileCentersXO: [],
	tileCentersX: [],
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
	drawPortals: function () {
		var points = null;
		var c = Map.c;
		var size = Map.tileSize;
		var i = 0;
		var len = Map.tiles.length;
		for (i; i<len; i++) {
			if (Map.tiles[i].portal != null) {
				// console.log(Map.tiles[i]);

				points = Map.tiles[Map.tiles[i].id].points;
				c = Map.c;
				size = Map.tileSize;
				c.fillStyle = '#00FFE6';

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
		}
	},
	drawUnits: function (units) {
		var len = units.length;
		var i = 0;
		var tileId = null;
		var points = null;
		var c = null;
		var size = null;
		var imgXsize = null;
		var imgYsize = null;
		var img = new Image();

		Map.unitLayer.save();
		Map.unitLayer.setTransform(1, 0, 0, 1, 0, 0);
		Map.unitLayer.clearRect(0,0,Map.unitLayer.canvas.width,Map.unitLayer.canvas.height);
		Map.unitLayer.restore();

		img.onload = function () {
			for (i; i<len; i++) {
				tileId = units[i].tile_pos;

				if (typeof Map.tiles[tileId] == 'undefined') { continue; }
				
				points = Map.tiles[tileId].points;
				c = Map.c;
				size = Map.tileSize;

				// 1:5 2:4 4:1.4
				imgXsize = 35 / 1.4;
				imgYsize = 46 / 1.4;

				Map.unitLayer.drawImage( img, points.m*size - (imgXsize / 2), points.b*size - (imgYsize / 2), imgXsize, imgYsize );
				
			}
		}
		img.setAttribute('src', 'thug-front.png');

	},
	help: {
		drawTileById: function (id) {

			var points = Map.tiles[id-1].points;
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
	getTileBy2Dcord: function (qm, rm) {
		var xArr = Map.tileCentersObjX[qm];
		var yArr = Map.tileCentersObjY[rm];
		// if (typeof yArr == 'undefined') { return; }
		var i = 0;
		var j = 0;
		var len1 = xArr.length;
		var len2 = yArr.length;
		for (i=0; i<len1; i++) {
			for (j=0; j<len2; j++) {
				if (xArr[i] == yArr[j]) {
					return xArr[i]+1;
				}
			}
		}
		return false;
	}
}

var Sock = {
	// settings
	serverHost: window.location.host, // automatically retrieved from the URL
	serverPort: 63848,
	usernameMaxLength: 18,
	
	// internal variables
	socket: false,
	connected: false,

	connect2Server: function() {
		if (Sock.isConnected()) {
			// already connected to the server, so disconnect from the server
			console.log("already connected to the server, so disconnect from the server");
			Sock.disconnect();
			return;
		}

		console.log('Connecting..');
		Sock.connect();
	},
	
	// server connection
	isConnected: function() {
		return Sock.connected;
	},
	connect: function() {
		var Socket = new WebSocket('ws://'+Sock.serverHost+':'+Sock.serverPort);
		Sock.setEvents(Socket);
		Sock.socket = Socket;
	},
	disconnect: function() {
		Sock.socket.send('QUIT');
		Sock.socket.close();
	},
	
	// socket events
	setEvents: function(Socket) {
		Socket.onopen = function() {
			// now connected to the server
			Sock.connected = true;
			console.log('Connected');
			// retrieve map data
			// Sock.socket.send('MAP');
		}
		
		Socket.onmessage = function(Message) {
			var Data = Message.data;

			var json = JSON.parse(Data);
			
			if (typeof json.msg != 'undefined') {
				if (json.msg == 'NOACCESS') {
					console.log('No Access');
				} else if (json.msg == 'MAP') {
					Map.init(Data);
					Path.init();
				} else if (json.msg == 'TURN') {
					Map.drawUnits(json.units);
					document.getElementById('day-display').innerHTML = "It's the day "+json.day+".";
				} else if (json.msg == 'NOMAPGEN') {
					console.log('A map build is currently in progress. Please wait.');
				}
			}

		}
		
		Socket.onclose = function() {
			if (Sock.connected) {
				// was connected to server before onclose was called
				console.log('Disconnected.');
			} else {
				// was not connected to server before onclose was called
				console.log('Failed to connect.');
			}
			Sock.connected = false;
		}

		document.getElementById('login-btn').addEventListener('click', function(e) {
			var pw = document.getElementById('login-password').value;
			var hashed = MD5(pw);
			var username = document.getElementById('login-username').value;
			var user = {
				'pw': hashed,
				'username': username
			}
			user = JSON.stringify(user);
			Sock.socket.send('USER::'+user);
		});

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
	eventsInitialized: 0,
	init: function () {

		Path.open = [];
		Path.closed = [];
		Path.startTile = null;
		Path.goalTile = null;
		Path.initClick = null;
		Path.touchLayerClicked = 0;

		if (Path.eventsInitialized == 0) {
			Path.eventsInitialized = 1;
		} else { return; }

		document.getElementById('touch').addEventListener('click', function(e) {


			// Object.keys(data).forEach(function (key) {
			// 	console.log(data[key]);
			// });

			var clickedTile = Path.findClickedTile(e);
			return;
			var tileId = clickedTile.tileId;

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

			Path.drawCircleOnTouchLayer(clickedTile.q, clickedTile.r, Map.tileSize+1, '#000000');

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
		document.getElementById('touch').oncontextmenu = function (e) {
			var clickedTile = Path.findClickedTile(e);
			var tileId = clickedTile.tileId;

			e.preventDefault();
			if (!tileId) { return; }

			if (Path.rightClickLastId == tileId) {
				document.getElementById('right-click-menu').style.display = 'none';
				Path.rightClickLastId = undefined;
				return;
			} else if (typeof Path.rightClickLastId == 'undefined' || Path.rightClickLastId != tileId) {
				document.getElementById('right-click-menu').style.display = 'block';
				Path.rightClickLastId = tileId;
			}

			var x = clickedTile.q + Math.abs(Map.mapVPx);
			var y = clickedTile.r + Math.abs(Map.mapVPy);
			var html = '';

			if (Map.tiles[tileId-1].portal) {
				x -= 66.5;
				html += '<ul>';
					html += '<li onclick="Path.enterPortal('+tileId+')">Enter portal</li>';
					html += '<li>Destroy portal</li>';
				html += '</ul>';
			} else {
				x -= 63;
				html += '<ul>';
					html += '<li>Create portal</li>';
				html += '</ul>';
			}

			y += 14;

			document.getElementById('right-click-menu').style.left = x+'px';
			document.getElementById('right-click-menu').style.top = y+'px';
			document.getElementById('right-click-menu').innerHTML = html;

			// Path.drawCircleOnTouchLayer(clickedTile.q, clickedTile.r, Map.tileSize+1, '#000000');

		}

	},
	enterPortal: function (tileId) {
		var move = {
			'tileId': tileId
		}
		document.getElementById('right-click-menu').style.display = 'none';
		Path.rightClickLastId = undefined;
		move = JSON.stringify(move);
		Sock.socket.send('GOTOMAP::'+move);
	},
	findClickedTile: function (e) {
		var rect = document.getElementById('touch').getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		var closeX = null;
		var closeY = null;
		var chosen = null;

		var i = 0;
		var len = Map.tiles.length;

		Map.touchLayer.beginPath();

		for (i=0; i<len; i++) {
			var m = Map.tiles[i].points.m * Map.tileSize - Map.mapVPx;
			var my = Map.tiles[i].points.my * Map.tileSize - Map.mapVPy;

			var points = [
				[m-Map.hp.m, my-(2.5*Map.tileSize)],
				[m, my-(4.5*Map.tileSize)],
				[m+Map.hp.m, my-(2.5*Map.tileSize)],
				[m, my+(4.5*Map.tileSize)],
				[m-Map.hp.m, my+(2.5*Map.tileSize)],
				[m-Map.hp.m, my-(2.5*Map.tileSize)]
			]

			var inside = insidePolygon([x, y], points);
			if (inside) {
				console.log(m, my, (m + Map.mapVPx)-Map.hp.m, (my + Map.mapVPy)-(2.5*Map.tileSize));
				Map.touchLayer.moveTo((m + Map.mapVPx)-Map.hp.m, (my + Map.mapVPy)-(2.5*Map.tileSize));
				Map.touchLayer.lineTo((m + Map.mapVPx), (my + Map.mapVPy)-(4.5*Map.tileSize));
				Map.touchLayer.lineTo((m + Map.mapVPx)+Map.hp.m, (my + Map.mapVPy)-(2.5*Map.tileSize));
				Map.touchLayer.lineTo((m + Map.mapVPx)+Map.hp.m, (my + Map.mapVPy)+(2.5*Map.tileSize));
				Map.touchLayer.lineTo((m + Map.mapVPx), (my + Map.mapVPy)+(4.5*Map.tileSize));
				Map.touchLayer.lineTo((m + Map.mapVPx)-Map.hp.m, (my + Map.mapVPy)+(2.5*Map.tileSize));
				Map.touchLayer.lineTo((m + Map.mapVPx)-Map.hp.m, (my + Map.mapVPy)-(2.5*Map.tileSize));
			}

			console.log(inside);
		}

		Map.touchLayer.fillStyle = 'red';
		Map.touchLayer.fill();
		Map.touchLayer.closePath;

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

		// closeX = closestTo(x, Map.tileCentersX);
		// closeY = closestTo(y, Map.tileCentersY);

		// chosen = Map.getTileBy2Dcord(Map.tileCentersX[closeX], Map.tileCentersY[closeY]);
		// if (!chosen) {
		// 	console.log('no chosen', x, Map.tileCentersX[closeX], Map.tileCentersX[closestTo(x, Map.tileCentersX, Map.tileCentersX[closeX])]);
		// 	closeX = closestTo(x, Map.tileCentersX, Map.tileCentersX[closeX]);
		// 	chosen = Map.getTileBy2Dcord(Map.tileCentersX[closeX], Map.tileCentersY[closeY]);
		// 	return;
		// }
		// var m = Map.tiles[chosen-1].points.m * Map.tileSize - Map.mapVPx;
		// var my = Map.tiles[chosen-1].points.my * Map.tileSize - Map.mapVPy;

		// Map.c.fillStyle = "#"+((1<<24)*Math.random()|0).toString(16);
		// Map.c.beginPath();
		// Map.c.rect((m+Map.mapVPx)-2.5,(my+Map.mapVPy)-2.5,5,5);
		// Map.c.fill();
		// Map.c.closePath;

		// var points = [
		// 	[m-Map.hp.m, my-(2.5*Map.tileSize)],
		// 	[m, my-(4.5*Map.tileSize)],
		// 	[m+Map.hp.m, my-(2.5*Map.tileSize)],
		// 	[m, my+(4.5*Map.tileSize)],
		// 	[m-Map.hp.m, my+(2.5*Map.tileSize)],
		// 	[m-Map.hp.m, my-(2.5*Map.tileSize)]
		// ]

		// var inside = insidePolygon([x, y], points);

		// console.log(inside, x, y, m, my);

		

		// $$$


		return;

		
		
		

		var c = Map.c;
		c.fillStyle = "#"+((1<<24)*Math.random()|0).toString(16);
		c.beginPath();
		c.rect(q+Map.mapVPx-10,r+Map.mapVPy-10,20,20);
		c.fill();
		c.closePath;

		return {q:q, r:r, tileId:tileId}
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
		var height = null;

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
					Path.drawCircleOnTouchLayer(Path.tiles[curr.parent].x*Map.tileSize, Path.tiles[curr.parent].y*Map.tileSize, Map.tileSize+1, '#000000'); // #FF9100 orange
					curr = Path.tiles[curr.parent];
				}

				Path.resetPathfinder();

				return;
			}

			// Normal case -- move currentNode from open to closed, process each of its neighbors
			Path.open.splice(Path.open.indexOf(currentNode), 1);
			Path.closed.push(currentNode);

			if (Path.tiles[currentNode].water || Path.tiles[currentNode].height == '5') {
				continue;
			}

			// Path.drawCircleOnTouchLayer(Path.tiles[currentNode].x*Map.tileSize, Path.tiles[currentNode].y*Map.tileSize, 5, '#FFFF00'); // yellow
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
				// console.log(Path.tiles[currentNode].g + 1, parseInt(Path.tiles[currentNode].height));

				height = parseInt(Path.tiles[currentNode].height);
				if (height == 1) { height = 1; } else
				if (height == 2) { height = 15; } else
				if (height == 3) { height = 40; } else
				if (height == 4) { height = 100; }

				gScore = Path.tiles[currentNode].g + height; // parseInt(Path.tiles[currentNode].height)
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
					Path.tiles[neighborId].g = gScore + height;
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
