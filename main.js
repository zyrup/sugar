window.onload = function () {
	XML.openXmlRequest(0, "GET", "duo", "export.php", 'f', true, Map.init, 2000, 1);
}

function build () {
	XML.openXmlRequest(0, "GET", "duo", "export.php", 'b', true, Map.init, 2000, 0);
}
function corrugate () {
	XML.openXmlRequest(0, "GET", "duo", "export.php", 'c', true, Map.init, 2000, 0);
}
function irrigate () {
	XML.openXmlRequest(0, "GET", "duo", "export.php", 'w', true, Map.init, 2000, 0);
}
function insideTriagle (s, a, b, c) {
	var as_x = s.x-a.x;
	var as_y = s.y-a.y;
	var s_ab = (b.x-a.x)*as_y-(b.y-a.y)*as_x > 0;

	if((c.x-a.x)*as_y-(c.y-a.y)*as_x > 0 == s_ab) return false;
	if((c.x-b.x)*(s.y-b.y)-(c.y-b.y)*(s.x-b.x) > 0 != s_ab) return false;
	return true;
}

Map = {
	init: function () {
		var exp = JSON.parse(this);
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
		var c = Map.c;
		c.canvas.width = mapW;
		c.canvas.height = mapH;
		c.translate(-mapVPx, -mapVPy);

		var len = map.tiles;
		var i = 0;
		var tile = null;
		var points = null;
		var height = null;
		for (i; i<len; i++) {
			tile = tiles[i];
			points = tile.points;
			height = tile.height;

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

			c.beginPath();
			c.moveTo(points.m*size, points.a*size);
			c.lineTo(points.l*size, points.b*size);
			c.lineTo(points.l*size, points.c*size);
			c.lineTo(points.m*size, points.d*size);
			c.lineTo(points.r*size, points.c*size);
			c.lineTo(points.r*size, points.b*size);
			c.closePath();
			c.fill();

			c.font = "8px Arial";
			c.fillStyle = '#000';
			c.fillText(tile.cord,points.l*size,points.c*size);

			if (tile.is_river) {
				var type = 'full';
				if (tile.river_to) {
					var b2 = tiles[tile.river_to-1].points.b;
					var c2 = tiles[tile.river_to-1].points.c;
					var m2 = tiles[tile.river_to-1].points.m;
				} else {
					var b2 = null;
					var c2 = null;
					var m2 = null;
					type = 'half';
				}

				Map.drawRiverArr.push({
					'id':tile.id-1,
					'type':type,
					'b1':tile.points.b,
					'c1':tile.points.c,
					'm1':tile.points.m,
					'b2':b2,
					'c2':c2,
					'm2':m2
				});

			}
		}
		Map.drawRivers();

		var drawHelpGrid = false;

		c.beginPath();
		c.lineWidth = 1;
		c.fillStyle = 'red';

		var smd = 2 * Map.tileSize;
		var m = 4 * Map.tileSize;
		var mmd = 5 * Map.tileSize;
		var md = 7 * Map.tileSize;
		var tw = 8 * Map.tileSize;
		var lgd = 9 * Map.tileSize;
		var drw = lgd - smd;
		var hdrw = drw/2;
		var drw2 = 0;
		var drw3 = 0;
		var r = (mapH - smd) / drw + 2;
		var oddR = 0;
		var twd = 0;
		var q = mapW / tw;
		var i = 1;
		var j = 1;
		for (i; i < r; i++) {
			drw2 = i*drw+mapVPy+0.5;
			if (drawHelpGrid) {
				c.moveTo(mapVPx, drw2);
				c.lineTo(mapW, drw2);
			}

			if (oddR == 0) {
				twd = 4 * Map.tileSize;
				oddR = 1;
			} else {
				twd = 0;
				oddR = 0;
			}

			for (j = -1; j < q; j++) {
				drw3 = j*tw+mapVPx+twd+0.5;
				
				if (drawHelpGrid) {
					c.moveTo(drw3, drw2-drw-0.5);
					c.lineTo(drw3, drw2-0.5);

					// triangles
					c.moveTo(drw3, drw2-drw);
					c.lineTo(drw3+m, drw2-md);
					c.lineTo(drw3, drw2-mmd);
					c.moveTo(drw3+m, drw2-md);
					c.lineTo(drw3+tw, drw2-md);
					c.lineTo(drw3+tw, drw2-mmd);
				}
			}

		}

		c.fill();
		c.strokeStyle = "red";
		c.stroke();

		console.log("rows ",r,'cols ',q);
		
		document.getElementById('map').addEventListener('mousemove', function(e) {

			// Object.keys(data).forEach(function (key) {
			// 	console.log(data[key]);
			// });

			var rect = document.getElementById('map').getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;

			var r = Math.floor(y / drw);
			var q = 0;
			var odd = false;
			// var q2;
			// var r2 = Math.floor((y+m) / drw);

			if (r % 2) {
				q = Math.floor(x / tw);
				odd = true;
				// q2 = Math.floor((x+hdrw) / tw);

			} else {
				q = Math.round(x / tw);
				// q2 = Math.round((x+hdrw) / tw);
			}

			var qm = 0;
			var rm = 0;
			var Al = 0;
			var Bl = 0;
			var Cl = 0;
			var Ar = 0;
			var Br = 0;
			var Cr = 0;

			if (odd) {
				Al = {x:q * tw, y:r * drw};
				Bl = {x:q * tw, y:r * drw + smd};
				Cl = {x:q * tw + m, y:r * drw};

				Ar = {x:q * tw + m, y:r * drw};
				Br = {x:q * tw + tw, y:r * drw};
				Cr = {x:q * tw + tw, y:r * drw + m};
			} else {
				Al = {x:q * tw - m, y:r * drw};
				Bl = {x:q * tw, y:r * drw};
				Cl = {x:q * tw - m, y:r * drw + smd};

				Ar = {x:q * tw + m, y:r * drw};
				Br = {x:q * tw, y:r * drw};
				Cr = {x:q * tw + m, y:r * drw + smd};
			}

			// left triangle
			var rm = 0;
			if ( insideTriagle({x:x,y:y},Al,Bl,Cl) ) {
				q--;
				r--;
			}
			// right triangle
			if ( insideTriagle({x:x,y:y},Ar,Br,Cr) ) {
				if (odd) {
					q++;
				}
				r--;
			}
			// console.log(q,r);

		});

	},
	tileSize: 4,
	tiles: [],
	c: null,
	drawRiverArr: [],
	drawRivers: function () {
		var len = Map.drawRiverArr.length;
		var i = 0;
		var tile = null;
		var my1 = null;
		var my2 = null;
		var c = Map.c;
		var size = Map.tileSize;
		for (i; i<len; i++) {
			tile = Map.drawRiverArr[i];

			c.beginPath();
			my1 = tile.b1+(tile.c1-tile.b1)/2;
			c.moveTo(tile.m1*size, my1*size);
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

XML = {
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

/*
// http://www.blitzbasic.com/Community/posts.php?topic=25516

function dot (x0,y0,x1,y1,x2,y2) {
	return (x1-x0)*(y2-y1)-(x2-x1)*(y1-y0);
}

function insideHex () {
	if dot(x0,y0,x1,y1,px,py) > 0 {
		if dot(x1,y1,x2,y2,px,py) > 0 {
			if dot(x2,y2,x3,y3,px,py) > 0 {
				if dot(x3,y3,x0,y0,px,py) > 0 {
					if dot(x4,y4,x0,y0,px,py) > 0 {
						if dot(x5,y5,x0,y0,px,py) > 0 {
							return true;
						}
					}
				}
			}
		}
	}
	return false;
}

*/
