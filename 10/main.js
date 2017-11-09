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

var Map = {
	init: function (data) {
		var canvasWidth  = 0;
		var canvasHeight = 0;

		Map.tiles = data.tiles;
		Map.tileSize = document.getElementsByName('value-tilesize')[0].value;
		Map.clickLayerBool = document.getElementsByName('clicklayer')[0].checked;
		Map.fillGapsBool = document.getElementsByName('fillgaps')[0].checked;
		Map.clickLayer = document.getElementById('clicklayer');
		Map.clickLayer.innerHTML = '';

		if (Map.tiles.length > 10000) {
			Map.clickLayerBool = false;
		}

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

		if (Map.clickLayerBool) {
			Map.clickLayer.setAttribute('width', canvasWidth);
			Map.clickLayer.setAttribute('height', canvasHeight);
			Map.clickLayer.setAttribute('viewBox', (Map.xVneg)+' '+(Map.yVneg)+' '+canvasWidth+' '+canvasHeight);
		}

		Map.drawCords();

		if (data.rivers) {
			Map.rivers = data.rivers;
			Map.drawRivers();
		}

		removeClass(document.querySelectorAll('body')[0], 'loading');

		if (document.getElementById('map').width * document.getElementById('map').height  > 268435456) { // 16,384 x 16,384 = 268'435'456
			document.getElementsByClassName('more-info')[0].innerHTML = 'Map size exceeds maximum pixel canvas amount of 268\'435\'456 pixel. If you decrease the TILE SIZE to 0.25 maximum pixel amount won\'t be reached (very unlikely).';
		}
	},
	enlargeCordBase: function () {
		for (var i = 0; i < 5; i++) {
			Map.cordBase[Object.keys(Map.cordBase)[i]] = Map.cordBase[Object.keys(Map.cordBase)[i]]*Map.tileSize;
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
				color = 'rgba(8, 97, 158, 0.3)';
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

				// Map.c.font = 2.25*Map.tileSize+"px Arial";
				// Map.c.fillStyle = '#000';
				// Map.c.fillText(tile.x+'|'+tile.y, tile.pos.l, tile.pos.c);

				if (Map.clickLayerBool) {
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
						Map.showTileInfo(this.getAttribute('id').replace('tileId-',''));
					});
					Map.clickLayer.insertBefore(polygon, Map.clickLayer.childNodes[0]);
				}

			}

		}
	},
	drawRivers: function () {
		var len = Map.rivers.length;
		var i   = 0;
		var mx1 = null;
		var mx2 = null;
		var my1 = null;
		var my2 = null;
		var tmp = null;
		Map.c.strokeStyle = 'rgba(8, 97, 158, 0.2)';
		Map.c.lineWidth = 4;
		for (i; i<len; i++) {
			// console.log(Map.rivers[i].f, Map.rivers[i].t);

			if ( Map.rivers[i].t < 0 ) { // approaching edge.

				if (Map.tiles[Map.rivers[i].f].l == 1) { // don't draw edge floating.
					continue;
				}

				mx1 = Map.tiles[Map.rivers[i].f].pos.m;
				my1 = Map.tiles[Map.rivers[i].f].pos.my;

				tmp = Map.rivers[i].t;
				if (tmp == -1) {        // top left
					mx2 = (Map.tiles[Map.rivers[i].f].pos.l + Map.tiles[Map.rivers[i].f].pos.m) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.a + Map.tiles[Map.rivers[i].f].pos.b) / 2;
				} else if (tmp == -2) { // left
					mx2 = Map.tiles[Map.rivers[i].f].pos.l;
					my2 = (Map.tiles[Map.rivers[i].f].pos.b + Map.tiles[Map.rivers[i].f].pos.c) / 2;
				} else if (tmp == -3) { // left bottom
					mx2 = (Map.tiles[Map.rivers[i].f].pos.l + Map.tiles[Map.rivers[i].f].pos.m) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.c + Map.tiles[Map.rivers[i].f].pos.d) / 2;
				} else if (tmp == -4) { // right bottom
					mx2 = (Map.tiles[Map.rivers[i].f].pos.m + Map.tiles[Map.rivers[i].f].pos.r) / 2;
					my2 = (Map.tiles[Map.rivers[i].f].pos.d + Map.tiles[Map.rivers[i].f].pos.c) / 2;
				} else if (tmp == -5) { // right
					mx2 = Map.tiles[Map.rivers[i].f].pos.r;
					my2 = (Map.tiles[Map.rivers[i].f].pos.b + Map.tiles[Map.rivers[i].f].pos.c) / 2;
				} else if (tmp == -6) { // top right
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
	},
	showTileInfo: function (id) {
		var tile = Map.tiles[id-1];
		if (typeof tile == 'undefined') {
			document.querySelectorAll('.tile-info')[0].innerHTML = '';
			return;
		}
		var z = (tile.x + tile.y) - (tile.x + tile.y) * 2;
		document.querySelectorAll('.tile-info')[0].innerHTML = '<div class="inner">ID: '+tile.id+'<br>X: '+tile.x+'<br>Y: '+tile.y+'<br>Z: '+z+'<br>H: '+tile.h+'</div>';
	}

}

var App = {
	bind: function () {

		[].forEach.call(document.querySelectorAll('.entry'), function(item) {
			if (typeof item.childNodes[3] != 'undefined') {
				addEvent(item.childNodes[3].childNodes[1], 'input', function() {
					this.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[3].value = this.value;
					App.checkTileCap();
				})
			}

			if (typeof item.childNodes[1].childNodes[1] != 'undefined') {
				addEvent(item.childNodes[1].childNodes[1].childNodes[3], 'input', function() {
					this.parentNode.parentNode.parentNode.childNodes[3].childNodes[1].value = this.value;
					App.checkTileCap();
				})
			}
			
		});

		addEvent(document.getElementsByName('send')[0], 'click', function() {
			document.getElementsByClassName('tile-info')[0].innerHTML = '';
			document.getElementsByClassName('more-info')[0].innerHTML = '';
			App.getMap(1);
		})

		addEvent(document.getElementsByName('fillgaps')[0], 'click', function() {
			Map.fillGapsBool = this.checked;
		})

	},
	checkTileCap: function () {
		if (document.getElementsByName('value-tilecap')[0].value > 100000) {
			Map.fillGapsBool = false;
			document.getElementsByName('fillgaps')[0].disabled = true;
			document.getElementsByName('fillgaps')[0].checked = false;
		} else {
			Map.fillGapsBool = true;
			document.getElementsByName('fillgaps')[0].checked = true;
			document.getElementsByName('fillgaps')[0].disabled = false;
		}
		if (document.getElementsByName('value-tilecap')[0].value > 10000) {
			document.getElementsByName('clicklayer')[0].checked = false;
			document.getElementsByName('clicklayer')[0].disabled = true;
		} else {
			document.getElementsByName('clicklayer')[0].checked = true;
			document.getElementsByName('clicklayer')[0].disabled = false;
		}
	},
	init: function () {
		App.bind();
		App.getMap(0);
	},
	handleMapgen: function () {
		getAjax (window.location.pathname+'getmap.php', function(data) {

			try {
				data = JSON.parse(data);
				App.failedLoads = 0;
				if (data.tiles.length == 0) {
					document.getElementsByClassName('more-info')[0].innerHTML = 'Loading error. A page reload might help.';
					return;
				}
				Map.init(data);
			} catch (e) {
				console.log(e);
				if (App.failedLoads == 15) {
					document.getElementsByClassName('more-info')[0].innerHTML = 'Loading error. A page reload might help.';
					console.log('loading error');
				} else {
					setTimeout(function(){
						App.handleMapgen();
					}, 1000);
				}
				App.failedLoads++;
			}

		});

	},
	getMap: function (n) {
		App.failedLoads = 0;
		addClass(document.querySelectorAll('body')[0], 'loading');
		if (n) {
			var tilecap = document.getElementsByName('value-tilecap')[0].value;
			var pow     = document.getElementsByName('value-pow')[0].value;
			var fillgap = (Map.fillGapsBool ? '&fillgap=1' : '');

			var corrugation = '&h=' + document.getElementsByName('value-corrugation')[0].value;

			getAjax (window.location.pathname+'getmap.php?tilecap='+tilecap+'&pow='+pow+fillgap+corrugation, function() {
				App.handleMapgen();
			});
		} else {
			App.handleMapgen();
		}
	}
}

window.onload = function () {
	App.init();
}
