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
	init: function (tiles) {
		Map.tiles = tiles;
		Map.tileSize = document.getElementsByClassName('entry-tilesize')[0].childNodes[1].childNodes[1].innerHTML;
		Map.clickLayerBool = document.getElementsByClassName('entry-clicklayer')[0].childNodes[3].checked;
		Map.clickLayer = document.getElementById('clicklayer');
		Map.clickLayer.innerHTML = '';
		document.getElementsByClassName('tile-info')[0].innerHTML = '';

		if (Map.tiles.length > 10000) {
			Map.clickLayerBool = false;
		}

		Map.c = document.getElementById('map').getContext('2d');

		Map.xVpos = 0;
		Map.xVneg = 0;
		Map.yVpos = 0;
		Map.yVneg = 0;

		Map.cordBase = {};
		Map.cordBase.x1 = 4;
		Map.cordBase.x2 = 8;
		Map.cordBase.y1 = 2;
		Map.cordBase.y2 = 7;
		Map.cordBase.y3 = 9;
		Map.enlargeCordBase();

		Map.getCords();
		Map.c.canvas.width  = Map.xVpos-Map.xVneg;
		Map.c.canvas.height = Map.yVpos-Map.yVneg;
		Map.c.translate(-Map.xVneg, -Map.yVneg);

		if (Map.clickLayerBool) {
			Map.clickLayer.setAttribute('width', Map.c.canvas.width);
			Map.clickLayer.setAttribute('height', Map.c.canvas.height);
			Map.clickLayer.setAttribute('viewBox', (Map.xVneg)+' '+(Map.yVneg)+' '+Map.c.canvas.width+' '+Map.c.canvas.height);
		}

		Map.drawCords();
		removeClass(document.querySelectorAll('body')[0], 'loading');
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
		var pos = null;
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

			if (y > 0 && Map.xVpos < r) {
				Map.xVpos = r;
			} else if (y < 0 && Map.xVneg > l) {
				Map.xVneg = l;
			}
			if (a < 0 && a < Map.yVneg) {
				Map.yVneg = a;
			} else if (d > 0 && d > Map.yVpos) {
				Map.yVpos = d;
			}

			a = z * Map.cordBase.y2;
			b = a + Map.cordBase.y1;
			c = a + Map.cordBase.y2;
			d = a + Map.cordBase.y3;

			pos = {
				'l': l,
				'm': m,
				'r': r,
				'a': a,
				'b': b,
				'c': c,
				'd': d
			}

			tile.pos = pos;

		}

	},
	drawCords: function () {
		var i = 0;
		var len = Map.tiles.length;
		var tile = null;
		for (i=0; i<len; i++) {
			tile = Map.tiles[i];

			if (tile.pos) {
				Map.c.fillStyle = '#afafaf';
				Map.c.beginPath();
				Map.c.moveTo(tile.pos.m, tile.pos.a);
				Map.c.lineTo(tile.pos.l, tile.pos.b);
				Map.c.lineTo(tile.pos.l, tile.pos.c);
				Map.c.lineTo(tile.pos.m, tile.pos.d);
				Map.c.lineTo(tile.pos.r, tile.pos.c);
				Map.c.lineTo(tile.pos.r, tile.pos.b);
				Map.c.closePath();
				Map.c.fill();

				if (Map.showCords) {
					Map.c.font = 2.25*Map.tileSize+"px Arial";
					Map.c.fillStyle = '#000';
					Map.c.fillText(tile.x+'|'+tile.y, tile.pos.l, tile.pos.c);
				}
				if (Map.clickLayerBool) {
					var points = tile.pos.m+','+tile.pos.a+' '+
											 tile.pos.l+','+tile.pos.b+' '+
											 tile.pos.l+','+tile.pos.c+' '+
											 tile.pos.m+','+tile.pos.d+' '+
											 tile.pos.r+','+tile.pos.c+' '+
											 tile.pos.r+','+tile.pos.b;

					var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
					polygon.setAttribute('data-tileId', tile.id);
					polygon.setAttribute('points', points);
					polygon.setAttribute('fill-opacity', '0');
					polygon.addEventListener('mousemove', function(e) {
						Map.showTileInfo(this.getAttribute('data-tileId'));
					});
					Map.clickLayer.insertBefore(polygon, Map.clickLayer.childNodes[0]);
				}

			}

		}
	},
	showTileInfo: function (id) {
		var tile = Map.tiles[id-1];
		var z = (tile.x + tile.y) - (tile.x + tile.y) * 2;
		document.querySelectorAll('.tile-info')[0].innerHTML = '<div class="inner">ID: '+tile.id+'<br>X: '+tile.x+'<br>Y: '+tile.y+'<br>Z: '+z+'</div>';
	}

}

var App = {
	bind: function () {

		[].forEach.call(document.querySelectorAll('.entry'), function(item) {
			if (item.childNodes[3].type == 'range') {
				addEvent(item.childNodes[3], 'mousemove', function() {
					item.childNodes[1].childNodes[1].innerHTML = item.childNodes[3].value;
					if (hasClass(item, 'entry-tilecap')) {
						if (item.childNodes[3].value > 10000) {
							document.getElementsByClassName('entry-clicklayer')[0].childNodes[3].disabled = true;
						} else {
							document.getElementsByClassName('entry-clicklayer')[0].childNodes[3].disabled = false;
						}
					}
				})
			}
		});

		addEvent(document.getElementsByName('send')[0], 'click', function() {
			App.getMap(1);
		})

	},
	init: function () {
		App.bind();
		App.getMap(0);
	},
	handleMapgen: function () {
		getAjax (window.location.pathname+'getmap.php?_'+new Date().getTime(), function(data) {

			try {
				data = JSON.parse(data);
				App.failedLoads = 0;
				Map.init(data.tiles);
			} catch (e) {
				console.log(e);
				if (App.failedLoads == 5) {
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
			var tilecap = document.getElementsByClassName('entry-tilecap')[0].childNodes[1].childNodes[1].innerHTML;
			var pow = document.getElementsByClassName('entry-pow')[0].childNodes[1].childNodes[1].innerHTML;

			getAjax (window.location.pathname+'getmap.php?tilecap='+tilecap+'&pow='+pow+'?_'+new Date().getTime(), function() {
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
