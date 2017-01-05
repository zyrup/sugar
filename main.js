"use strict";

window.onload = function () {
	Sock.connect2Server();
	// console.log('under maintenance');
}

var Map = {
	init: function (map, tiles) {

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
		Map.drawRiverArr = [];

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
		Map.svgClick = document.getElementById('click');
		Map.svgClick.innerHTML = '';
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
		Map.svgClick.setAttribute('width', mapW);
		Map.svgClick.setAttribute('height', mapH);
		Map.svgClick.setAttribute('viewBox', (mapVPx)+' '+(mapVPy)+' '+mapW+' '+mapH);

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

			var points = points.m*size+','+points.a*size+' '+
									 points.l*size+','+points.b*size+' '+
									 points.l*size+','+points.c*size+' '+
									 points.m*size+','+points.d*size+' '+
									 points.r*size+','+points.c*size+' '+
									 points.r*size+','+points.b*size;

			var svgP = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			svgP.setAttribute('data-tileId', tile.id);
			svgP.setAttribute('points', points);
			svgP.setAttribute('fill-opacity', '0');
			svgP.addEventListener('click', function(e) {
				Path.clickTile(this.getAttribute('data-tileId'));
			});
			Map.svgClick.insertBefore(svgP, Map.svgClick.childNodes[0]);

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
		Map.drawForest();
		Map.drawPortals();

	},
	tileSize: 4,
	tiles: [],
	c: null,
	tileHumidityLvl: [],
	tileHumidityLvl2: [],
	drawForest: function () {
		var i = 0;
		var len = Map.tiles.length;
		var tile = null;
		var points = null;

		for (i; i<len; i++) {
			tile = Map.tiles[i];
			points = tile.points;

			if (tile.type == 1 || tile.height == 5) {
				continue;
			}

			if (tile.trees == 5) {
				Map.draw.onTile.dot(points, 't', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'tl', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'bl', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'b', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'br', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'tr', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'm', 'rect', 'rgba(94, 220, 0, 0.5)');
			} else if (tile.trees == 4) {
				Map.draw.onTile.dot(points, 'ttll', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'ttrr', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'bbll', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'bbrr', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'm', 'rect', 'rgba(94, 220, 0, 0.5)');
			} else if (tile.trees == 3) {
				Map.draw.onTile.dot(points, 'tril', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'trir', 'rect', 'rgba(94, 220, 0, 0.5)');
				Map.draw.onTile.dot(points, 'trib', 'rect', 'rgba(94, 220, 0, 0.5)');
			} else if (tile.trees == 2) {
				Map.draw.onTile.dot(points, 'm', 'rect', 'rgba(94, 220, 0, 0.5)');
			}
		}

		Map.c.fill();

		// set init tiles
		// for (i; i<len; i++) {
		// 	tile = Map.tiles[i];
		// 	if (tile.is_river || tile.type == 1) { //  && tile.type != 1 && tile.height != 5
		// 		// Map.help.drawTileById(tile.id);
		// 		if (tile.height == 2) {
		// 			Map.tileHumidityLvl.push({tile:tile, lvl:5});
		// 		} else if(tile.height == 3) {
		// 			Map.tileHumidityLvl.push({tile:tile, lvl:3});
		// 		} else if(tile.height == 4) {
		// 			Map.tileHumidityLvl.push({tile:tile, lvl:2});
		// 		} else {
		// 			Map.tileHumidityLvl.push({tile:tile, lvl:5});
		// 		}
		// 	}
		// }

		// var neighs = function () {
		// 	i = 0;
		// 	len = Map.tileHumidityLvl.length;		
		// 	for (i; i<len; i++) {
		// 		tile = Map.tileHumidityLvl[i].tile;
		// 		var keys = Object.keys(tile);
		// 		var len2 = keys.length;
		// 		var j = 0;
		// 		var noN = [];
		// 		var parentLvl = Map.tileHumidityLvl[i].lvl;
		// 		for (j = 0; j<len2; j++) {
		// 			if (keys[j].indexOf('n_') > -1 && tile[keys[j]] != null) {
		// 				noN.push(keys[j]);
		// 			}
		// 		}
		// 		len2 = noN.length;
		// 		for (j = 0; j<len2; j++) {
		// 			if (tile[noN[j]] == null) {
		// 				continue;
		// 			}
		// 			// console.log(tile.id, tile[noN[j]], noN[j]); hm
		// 			var id = tile[noN[j]]-1;
		// 			tile = Map.tiles[id];
		// 			if (tile.type == 0) {
		// 				var o = 0;
		// 				var len3 = Map.tileHumidityLvl.length;
		// 				var pass = true;
		// 				for (o = 0; o<len3; o++) {
		// 					if (id == Map.tileHumidityLvl[o].tile.id-1) {
		// 						// update when higher amount of humidity
		// 						pass = false;
		// 					}
		// 				}
		// 				if (pass) {
		// 					Map.tileHumidityLvl.push({tile:tile, lvl:parentLvl-1});
		// 				}

		// 			}
		// 		}
		// 	}
		// }
		// neighs();

		// i = 0;
		// len = Map.tileHumidityLvl.length;
		// for (i; i<len; i++) {
		// 	tile = Map.tileHumidityLvl[i].tile;
		// 	points = tile.points;

		// 	if (tile.type == 1 || tile.height == 5) {
		// 		continue;
		// 	}

		// 	if (Map.tileHumidityLvl[i].lvl == 4 || 5) {
		// 		Map.draw.onTile.dot(points, 't', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'tl', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'bl', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'b', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'br', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'tr', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'm', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 	} else if (Map.tileHumidityLvl[i].lvl == 3) {
		// 		Map.draw.onTile.dot(points, 'ttll', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'ttrr', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'bbll', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'bbrr', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'm', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 	} else if (Map.tileHumidityLvl[i].lvl == 2) {
		// 		Map.draw.onTile.dot(points, 'tril', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'trir', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 		Map.draw.onTile.dot(points, 'trib', 'rect', 'rgba(94, 220, 0, 0.5)');
		// 	}

		// }

		// Map.c.fill();
	},
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
		var unit = Map.tileSize;
		for (i; i<len; i++) {
			if (Map.tiles[i].portal != null) {
				// console.log(Map.tiles[i]);

				points = Map.tiles[Map.tiles[i].id].points;
				c = Map.c;
				size = Map.tileSize;
				c.strokeStyle = 'rgba(0,255,230,0.3)';
				c.lineWidth = Map.tileSize*1.2;

				// draw dir <--
				c.beginPath();
				c.moveTo(points.m*size, points.a*size);
				c.lineTo(points.l*size, points.b*size);
				c.lineTo(points.l*size, points.c*size);
				c.lineTo(points.m*size, points.d*size);
				c.lineTo(points.r*size, points.c*size);
				c.lineTo(points.r*size, points.b*size);
				c.lineTo(points.m*size, points.a*size);

				c.stroke();
				c.closePath();

			}
		}
	},
	drawUnits: function (units, usrpos) {
		var len = units.length;
		var i = 0;
		var tileId = null;
		var points = null;
		var imgXsize = null;
		var imgYsize = null;
		var player = false;

		Map.unitLayer.save();
		Map.unitLayer.setTransform(1, 0, 0, 1, 0, 0);
		Map.unitLayer.clearRect(0,0,Map.unitLayer.canvas.width,Map.unitLayer.canvas.height);
		Map.unitLayer.restore();

		Map.unitLayer.font = (Map.tileSize*8)+"px Arial";

		for (i; i<len; i++) {
			tileId = units[i].tile_pos;
			points = Map.tiles[tileId].points;
			Map.unitLayer.fillStyle = '#000';
			if (tileId == usrpos) {
				Map.unitLayer.fillStyle = '#2487d4';
			}
			Map.unitLayer.fillText('☺',points.m*Map.tileSize-(Map.tileSize*4.1),(points.my)*Map.tileSize+(Map.tileSize*2));
		}

	},
	draw: {
		onTile: {
			dot: function (points, pos, form, color) {
				var size = Map.tileSize;
				var x = null;
				var y = null;
				var c = Map.c;
				c.fillStyle = color;
				if (form == 'rect') {
					var rectSize = Map.tileSize*2;
					if (pos == 't') { // top
						x = points.m;
						y = points.a;
						c.rect(x*size-size, y*size+0.5*size, rectSize, rectSize);
					} else if (pos == 'tl') { // top left
						x = points.l;
						y = points.b;
						c.rect(x*size+0.45*size, y*size+0.25*size, rectSize, rectSize);
					} else if (pos == 'ttll') { // between top and top left
						x = points.l;
						y = points.b;
						c.rect(x*size+1*size, y*size-0.8*size, rectSize, rectSize);
					} else if (pos == 'bl') { // bottom left
						x = points.l;
						y = points.c;
						c.rect(x*size+0.45*size, y*size-2.25*size, rectSize, rectSize);
					} else if (pos == 'bbll') { // between bottom and bottom left
						x = points.l;
						y = points.c;
						c.rect(x*size+1*size, y*size-1.2*size, rectSize, rectSize);
					} else if (pos == 'b') { // bottom
						x = points.m;
						y = points.d;
						c.rect(x*size-size, y*size-2.5*size, rectSize, rectSize);
					} else if (pos == 'br') { // bottom right
						x = points.r;
						y = points.c;
						c.rect(x*size-2.45*size, y*size-2.25*size, rectSize, rectSize);
					} else if (pos == 'bbrr') { // between bottom and bottom right
						x = points.r;
						y = points.c;
						c.rect(x*size-3*size, y*size-1.2*size, rectSize, rectSize);
					} else if (pos == 'tr') { // top right
						x = points.r;
						y = points.b;
						c.rect(x*size-2.45*size, y*size+0.25*size, rectSize, rectSize);
					} else if (pos == 'ttrr') { // between top and top right
						x = points.r;
						y = points.b;
						c.rect(x*size-3*size, y*size-0.8*size, rectSize, rectSize);
					} else if (pos == 'm') { // middle
						x = points.m;
						y = points.my;
						c.rect(x*size-size, y*size-1*size, rectSize, rectSize);
					} else if (pos == 'tril') { // triangle left
						x = points.m;
						y = points.my;
						c.rect(x*size-3*size, y*size-2.2*size, rectSize, rectSize);
					} else if (pos == 'trir') { // triangle right
						x = points.m;
						y = points.my;
						c.rect(x*size+1*size, y*size-2.2*size, rectSize, rectSize);
					} else if (pos == 'trib') { // triangle bottom
						x = points.m;
						y = points.my;
						c.rect(x*size-size, y*size+size, rectSize, rectSize);
					}
				}
			}
		}
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
				if (json.msg == 'NOACCESS') { // wrong credentials
				} else if (json.msg == 'MAP') {
					Map.init(json.map, json.tiles);
					Map.drawUnits(json.units, json.usrpos);
					Path.usrpos = json.usrpos;
					Menu.updateTileMenu();
					document.getElementById('day-display').innerHTML = "It's the day "+json.day+".";
					Path.init();
					Player.playTileSound();
					document.getElementsByClassName('login-menu')[0].style.display = 'none';
				} else if (json.msg == 'TURN') {
					Map.drawUnits(json.units, json.usrpos);
					Path.usrpos = json.usrpos;
					Menu.updateTileMenu();

					document.getElementById('day-display').innerHTML = "It's the day "+json.day+".";
					Map.touchLayer.save();
					Map.touchLayer.setTransform(1, 0, 0, 1, 0, 0);
					Map.touchLayer.clearRect(0,0,Map.touchLayer.canvas.width,Map.touchLayer.canvas.height);
					Map.touchLayer.restore();
					Player.playTileSound();
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

		Menu.initLoginBtn();
		Menu.initSoundIcon();

	}
}

var Menu = {
	initLoginBtn: function () {
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
	},
	initSoundIcon: function () {
		document.getElementById('sound-icon').addEventListener('click', function(e) {
			var className = this.className;
			var audio = null;
			if (className == 'on') {
				this.className = 'off';
				Player.sounds.forEach(function(el) {
					audio = el;
					audio.pause();
				});
				Player.sounds = [];
				Player.audioPlays = false;
				Player.audioStop = true;
			} else {
				this.className = 'on';
				Player.audioStop = false;
			}
		});
	},
	updateTileMenu: function () {
		var html = '';
		var tileId = Path.usrpos-1;
		if (tileId < 0) { tileId = 0; }

		if (Map.tiles[tileId].portal) {
			html += '<ul>';
				html += '<li onclick="Menu.enterPortal('+tileId+')">Enter portal</li>';
				html += '<li onclick="Menu.destroyPortal('+tileId+')">Destroy portal</li>';
			html += '</ul>';
		} else {
			html += '<ul>';
				html += '<li onclick="Menu.createPortal('+tileId+')">Create portal</li>';
			html += '</ul>';
		}

		document.getElementById('click-menu').style.display = 'block';
		document.getElementById('click-menu').innerHTML = html;
	},
	enterPortal: function (tileId) {
		var move = {
			'tileId': tileId+1
		}
		document.getElementById('click-menu').style.display = 'none';
		move = JSON.stringify(move);
		Sock.socket.send('GOTOMAP::'+move);
	},
	gotoTile: function (tileId) {
		var move = {
			'tileId': tileId
		}
		move = JSON.stringify(move);
		Sock.socket.send('GOTOTILE::'+move);
	},
	createPortal: function (tileId) {
		var tile = {
			'tileId': tileId+1
		}
		tile = JSON.stringify(tile);
		Sock.socket.send('CREATEPORTAL::'+tile);
	},
	destroyPortal: function (tileId) {
		var tile = {
			'tileId': tileId+1
		}
		tile = JSON.stringify(tile);
		Sock.socket.send('DESTROYPORTAL::'+tile);
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
	clickedTile: null,
	tiles:[],
	drawTiles: [],
	init: function () {

		Path.open = [];
		Path.closed = [];
		Path.drawTiles = [];
		Path.startTile = null;
		Path.goalTile = null;
		Path.clickedTile = null;

		// Object.keys(data).forEach(function (key) {
		// 	console.log(data[key]);
		// });

	},
	clickTile: function (tileId) {
		tileId--;
		Map.touchLayer.save();
		Map.touchLayer.setTransform(1, 0, 0, 1, 0, 0);
		Map.touchLayer.clearRect(0,0,Map.touchLayer.canvas.width,Map.touchLayer.canvas.height);
		Map.touchLayer.restore();

		Path.drawCircleOnTouchLayer(Map.tiles[tileId].points.m*Map.tileSize, Map.tiles[tileId].points.my*Map.tileSize, Map.tileSize+1, 'rgba(0, 0, 0, 0.4)');

		if (Path.clickedTile == tileId) {
			Path.drawTiles.forEach(function(entry) {
				Path.drawCircleOnTouchLayer(Path.tiles[entry].x*Map.tileSize, Path.tiles[entry].y*Map.tileSize, Map.tileSize+1, '#000000');
				Path.drawCircleOnTouchLayer(Map.tiles[tileId].points.m*Map.tileSize, Map.tiles[tileId].points.my*Map.tileSize, Map.tileSize+1, '#000000');
			});
			Menu.gotoTile(tileId);
		} else {
			Path.drawTiles = [];
			Path.clickedTile = tileId;

			Path.startTile = Path.usrpos;
			Path.goalTile = tileId;
			Path.startPathFinder();
		}

		// if (Path.touchLayerClicked == 1) {
		// 	Path.goalTile = tileId;
		// 	if (Path.startTile == Path.goalTile) {
		// 		Path.goalTile = null;
		// 		Path.touchLayerClicked = 0;
		// 	} else {
		// 		Path.startPathFinder();
		// 	}
		// }

		// if (Path.touchLayerClicked == 2) { // this is 
		// 	console.log(4);
		// 	Path.startTile = Path.goalTile;
		// 	Path.goalTile = tileId;
		// 	if (Path.startTile == Path.goalTile) {
		// 		Path.goalTile = null;
		// 		Path.touchLayerClicked = 0;
		// 		Menu.gotoTile(Path.startTile);

		// 	} else {
		// 		Path.touchLayerClicked = 1;
		// 		Path.startPathFinder();
		// 	}
		// }
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

				// Path.drawCircleOnTouchLayer(Path.tiles[currentNode].x*Map.tileSize, Path.tiles[currentNode].y*Map.tileSize, Map.tileSize+1, 'rgba(0, 0, 0, 0.4)'); // #FF9100 orange

				curr = Path.tiles[currentNode];
				while(typeof curr.parent != 'undefined') {
					Path.drawTiles.push(curr.parent);
					Path.drawCircleOnTouchLayer(Path.tiles[curr.parent].x*Map.tileSize, Path.tiles[curr.parent].y*Map.tileSize, Map.tileSize+1, 'rgba(0, 0, 0, 0.4)'); // #FF9100 orange
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

var Player = {
	audioPlays: null,
	audioStop: false,
	sounds: [],
	playTileSound: function () {
		var tileId = Path.usrpos;
		if (Player.audioPlays != tileId && !Player.audioStop) {
			var audio = null;

			Player.sounds.forEach(function(el) {
				audio = el;
				audio.pause();
			});
			Player.sounds = [];

			var tile = Map.tiles[tileId];

			Player.audioPlays = tileId;

			if ((tile.trees == 1 || tile.trees == 2) && tile.height < 3) {
				audio = new Audio('sound/env1.ogg');
				Player.sounds.push(audio);
			} else if ((tile.trees == 3 || tile.trees == 4 || tile.trees == 5) && tile.height < 3) {
				audio = new Audio('sound/forest.ogg');
				Player.sounds.push(audio);
			}
			if (tile.is_river && tile.height < 4) {
				audio = new Audio('sound/stream.ogg');
				Player.sounds.push(audio);
			}
			if (tile.height >= 3) {
				audio = new Audio('sound/wind.ogg');
				Player.sounds.push(audio);
			}
			if (tile.height < 3) {
				var keys = Object.keys(tile);
				var len = keys.length;
				var i = 0;
				var noN = [];
				var id = null;
				for (i = 0; i<len; i++) {
					if (keys[i].indexOf('n_') > -1 && tile[keys[i]] != null) {
						noN.push(keys[i]);
					}
				}
				len = noN.length;
				for (i = 0; i<len; i++) {
					id = tile[noN[i]]-1;
					if (Map.tiles[id].type == 1) {
						audio = new Audio('sound/shore.ogg');
						Player.sounds.push(audio);	
						i = len;
					}
				}
			}

			if (audio != null) {
				document.getElementById('sound-icon').className = 'on';
				Player.sounds.forEach(function(el) {
					audio = el;
					audio.addEventListener("ended", function() {
						this.play();
					});
					audio.play();
				});
			}

		}
	}
}
