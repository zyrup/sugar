'use strict';

function hasClass(el, className) {
	return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
}

function addClass(el, className) {
	if (el.classList) el.classList.add(className);
	else if (!hasClass(el, className)) el.className += ' ' + className;
}

function removeClass(el, className) {
	if (el.classList) el.classList.remove(className);
	else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
}

function addEvent(el, type, handler) {
	if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
}

function getAjax (url, success) {
	var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
	xhr.open('GET', url);
	xhr.onreadystatechange = function() {
		if (xhr.readyState>3 && xhr.status==200) success(xhr.responseText);
	};
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send();
	return xhr;
}

/*
point coordinates
    ma
lb      rb

lc      rc
    md
*/

var TILE_SIZE = 2.5;

var Map = {
	init: function (data) {
		var canvasWidth  = 0;
		var canvasHeight = 0;

		Map.tiles = data.tiles;
		Map.clickLayer = document.getElementById('clicklayer');
		Map.clickLayer.innerHTML = '';

		Map.c = document.getElementById('map').getContext('2d');

		Map.xVpos = 0;
		Map.xVneg = 0;
		Map.yVpos = 0;
		Map.yVneg = 0;

		Map.cordBase = {};
		Map.cordBase.x1 = 4; // m
		Map.cordBase.x2 = 8; // r
		Map.cordBase.y1 = 2; // b
		Map.cordBase.y2 = 7; // c
		Map.cordBase.y3 = 9; // d
		Map.enlargeCordBase();

		Map.getCords();

		Map.c.canvas.width  = Map.xVpos-Map.xVneg;
		Map.c.canvas.height = Map.yVpos-Map.yVneg;
		Map.c.translate(-Map.xVneg, -Map.yVneg);

		canvasWidth = Map.c.canvas.width;
		canvasHeight = Map.c.canvas.height;

		if (window.devicePixelRatio > 1) {
			Map.c.canvas.width  = canvasWidth * window.devicePixelRatio;
			Map.c.canvas.height = canvasHeight * window.devicePixelRatio;
			document.getElementById('map').style.width = canvasWidth+'px';
			document.getElementById('map').style.height = canvasHeight+'px';

			Map.c.translate(-Map.xVneg*window.devicePixelRatio, -Map.yVneg*window.devicePixelRatio);
			Map.c.scale(window.devicePixelRatio, window.devicePixelRatio);
		}

		Map.clickLayer.setAttribute('width', canvasWidth);
		Map.clickLayer.setAttribute('height', canvasHeight);
		Map.clickLayer.setAttribute('viewBox', (Map.xVneg)+' '+(Map.yVneg)+' '+canvasWidth+' '+canvasHeight);

		if (data.rivers) {
			Map.rivers = data.rivers;
			Map.drawRivers();
		}

		Map.drawCords();

		removeClass(document.querySelectorAll('body')[0], 'loading');

	},
	enlargeCordBase: function () {
		for (var i = 0; i < 5; i++) {
			Map.cordBase[Object.keys(Map.cordBase)[i]] = Map.cordBase[Object.keys(Map.cordBase)[i]]*TILE_SIZE;
		}
	},
	getCords: function () {
		var i = 0;
		var len = Map.tiles.length;
		var tile = null;
		var x = null;
		var y = null;
		var z = null;
		var l = null;
		var m = null;
		var r = null;
		var a = null;
		var b = null;
		var c = null;
		var d = null;
		for (i=0; i<len; i++) {
			tile = Map.tiles[i];
			x = tile.x;
			y = tile.y;
			z = (x + y) - (x + y) * 2;

			l = (y+Math.floor(z/2)-1) * Map.cordBase.x2;
			m = l + Map.cordBase.x1;
			r = l + Map.cordBase.x2;

			if (z % 2) {
				l += Map.cordBase.x1;
				m += Map.cordBase.x1;
				r += Map.cordBase.x1;
			}

			a = z * Map.cordBase.y2;
			b = a + Map.cordBase.y1;
			c = a + Map.cordBase.y2;
			d = a + Map.cordBase.y3;

			if (Map.xVneg > l) {
				Map.xVneg = l;
			}
			if (Map.xVpos < r) {
				Map.xVpos = r;
			}
			if (Map.yVneg > a) {
				Map.yVneg = a;
			}
			if (Map.yVpos < d) {
				Map.yVpos = d;
			}

			tile.pos = {
				'l': l,
				'm': m,
				'r': r,
				'a': a,
				'b': b,
				'c': c,
				'd': d
			}
			tile.pos.my = tile.pos.b + (tile.pos.c - tile.pos.b) / 2;

		}

	},
	drawCords: function () {
		var i = 0;
		var len = Map.tiles.length;
		var tile = null;
		var color = null;
		for (i=0; i<len; i++) {
			tile = Map.tiles[i];

			if (tile.l == 1) {
				color = '#bcddf4';
			} else {
				color = 0.1 + tile.h * 0.1;
				color = 'rgba(0, 0, 0, '+color+')';
			}

			Map.c.fillStyle = color;

			if (tile.pos) {
				Map.c.beginPath();
				Map.c.moveTo(tile.pos.m, tile.pos.a);
				Map.c.lineTo(tile.pos.l, tile.pos.b);
				Map.c.lineTo(tile.pos.l, tile.pos.c);
				Map.c.lineTo(tile.pos.m, tile.pos.d);
				Map.c.lineTo(tile.pos.r, tile.pos.c);
				Map.c.lineTo(tile.pos.r, tile.pos.b);
				Map.c.closePath();
				Map.c.fill();

				// Map.c.font = 2.25*TILE_SIZE+"px Arial";
				// Map.c.fillStyle = '#000';
				// Map.c.fillText(tile.x+'|'+tile.y, tile.pos.l, tile.pos.c);

				var points = tile.pos.m+','+tile.pos.a+' '+
										 tile.pos.l+','+tile.pos.b+' '+
										 tile.pos.l+','+tile.pos.c+' '+
										 tile.pos.m+','+tile.pos.d+' '+
										 tile.pos.r+','+tile.pos.c+' '+
										 tile.pos.r+','+tile.pos.b;

				var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
				polygon.setAttribute('id', 'tileId-'+tile.id);

				polygon.setAttribute('points', points);
				polygon.setAttribute('fill-opacity', '0');
				polygon.addEventListener('mousemove', function(e) {
					// console.log(this.getAttribute('id').replace('tileId-',''));
				});
				Map.clickLayer.insertBefore(polygon, Map.clickLayer.childNodes[0]);
				

			}

		}
	},
	drawRivers: function () {
		var len = Map.rivers.length;
		var i   = 0;
		var x1  = 0;
		var y1  = 0;
		var z1  = 0;
		var x2  = 0;
		var y2  = 0;
		var z2  = 0;
		var mx1 = null;
		var mx2 = null;
		var my1 = null;
		var my2 = null;
		var toTleInt = null;
		Map.c.strokeStyle = 'rgba(188, 221, 244, 0.7)';
		Map.c.lineWidth = TILE_SIZE*2;
		for (i; i<len; i++) {
			// console.log(Map.rivers[i].f, Map.rivers[i].t);

			if (Map.rivers[i].t < 0) { // edge approaching.

				if (Map.tiles[Map.rivers[i].f].l == 1) { // don't draw edge floating when lake.
					continue;
				}

				toTleInt = Map.rivers[i].t;

				mx1 = Map.tiles[Map.rivers[i].f].pos.m;
				my1 = Map.tiles[Map.rivers[i].f].pos.my;

				if (toTleInt == -1) {        // top left
					mx2 = (Map.tiles[Map.rivers[i].f].pos.l + Map.tiles[Map.rivers[i].f].pos.m) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.a + Map.tiles[Map.rivers[i].f].pos.b) / 2;
				} else if (toTleInt == -2) { // left
					mx2 = Map.tiles[Map.rivers[i].f].pos.l;
					my2 = (Map.tiles[Map.rivers[i].f].pos.b + Map.tiles[Map.rivers[i].f].pos.c) / 2;
				} else if (toTleInt == -3) { // left bottom
					mx2 = (Map.tiles[Map.rivers[i].f].pos.l + Map.tiles[Map.rivers[i].f].pos.m) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.c + Map.tiles[Map.rivers[i].f].pos.d) / 2;
				} else if (toTleInt == -4) { // right bottom
					mx2 = (Map.tiles[Map.rivers[i].f].pos.m + Map.tiles[Map.rivers[i].f].pos.r) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.d + Map.tiles[Map.rivers[i].f].pos.c) / 2;
				} else if (toTleInt == -5) { // right
					mx2 = Map.tiles[Map.rivers[i].f].pos.r;
					my2 = (Map.tiles[Map.rivers[i].f].pos.b + Map.tiles[Map.rivers[i].f].pos.c) / 2;
				} else if (toTleInt == -6) { // top right
					mx2 = (Map.tiles[Map.rivers[i].f].pos.m + Map.tiles[Map.rivers[i].f].pos.r) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.a + Map.tiles[Map.rivers[i].f].pos.b) / 2;
				}

			} else {
				mx1 = Map.tiles[Map.rivers[i].f].pos.m;
				mx2 = Map.tiles[Map.rivers[i].t].pos.m;
				my1 = Map.tiles[Map.rivers[i].f].pos.my;
				my2 = Map.tiles[Map.rivers[i].t].pos.my;
			}

			Map.c.beginPath();
			Map.c.moveTo(mx1, my1);
			Map.c.lineTo(mx2, my2);
			Map.c.stroke();
			
		}
	}

}

var App = {
	bind: function () {

	},
	init: function () {
		App.bind();
		App.getMap();
	},
	handleMapgen: function () {
		getAjax (window.location.pathname+'getmap.php', function(data) {

			try {
				data = JSON.parse(data);
				App.failedLoads = 0;
				if (data.tiles.length == 0) {
					console.log('Loading error. A page reload might help.');
					return;
				}
				Map.init(data);
			} catch (e) {
				console.log(e);
				if (App.failedLoads == 15) {
					console.log('Loading error. A page reload might help.');
z
				} else {
					setTimeout(function(){
						App.handleMapgen();
					}, 1000);
				}
				App.failedLoads++;
			}

		});

	},
	getMap: function () {
		App.failedLoads = 0;
		addClass(document.querySelectorAll('body')[0], 'loading');
		App.handleMapgen();
	}
}

window.onload = function () {
	App.init();
}
