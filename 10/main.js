function addEvent(el, type, handler) {
	if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
}

function getAjax (url, success) {
	let xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
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

let Map = {
	init: function (tiles) {
		Map.tiles = tiles;
		Map.tileSize = document.getElementsByClassName('entry-tilesize')[0].childNodes[1].childNodes[1].innerHTML;
		Map.showCords = document.getElementsByClassName('entry-showcords')[0].childNodes[3].checked;
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
		Map.drawCords();
	},
	enlargeCordBase: function () {
		for (let i = 0; i < 5; i++) {
			Map.cordBase[Object.keys(Map.cordBase)[i]] = Map.cordBase[Object.keys(Map.cordBase)[i]]*Map.tileSize;
		}
	},
	getCords: function () {
		let i = 0;
		let len = Map.tiles.length;
		let tile = null;
		let x = null;
		let y = null;
		let z = null;
		let l = null;
		let m = null;
		let r = null;
		let a = null;
		let b = null;
		let c = null;
		let d = null;
		let pos = null;
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
		let i = 0;
		let len = Map.tiles.length;
		for (i=0; i<len; i++) {
			let tile = Map.tiles[i];

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

			}

		}
	}

}

let App = {
	bind: function () {

		[].forEach.call(document.querySelectorAll('.entry'), function(item) {
			if (item.childNodes[3].type == 'range') {
				addEvent(item.childNodes[3], 'mousemove', function() {
					item.childNodes[1].childNodes[1].innerHTML = item.childNodes[3].value;
				})
			}
		});

		addEvent(document.getElementsByName('send')[0], 'click', function() {
			App.getMap();
		})

	},
	init: function () {
		App.bind();
		App.getMap();
	},
	getMap: function () {
		let tilecap = document.getElementsByClassName('entry-tilecap')[0].childNodes[1].childNodes[1].innerHTML;
		let pow = document.getElementsByClassName('entry-pow')[0].childNodes[1].childNodes[1].innerHTML;

		getAjax (window.location.pathname+'/getmap.php?tilecap='+tilecap+'&pow='+pow+'?_'+new Date().getTime(), function(data) {
			Map.init(JSON.parse(data).tiles);
		});
	}
}

window.onload = function () {
	App.init();
}
