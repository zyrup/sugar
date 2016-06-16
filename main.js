window.onload = function () {
	XML.get( 'export.php?f', Map.init );
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

function insideTriagle (s, a, b, c) {
	var as_x = s.x-a.x;
	var as_y = s.y-a.y;
	var s_ab = (b.x-a.x)*as_y-(b.y-a.y)*as_x > 0;

	if((c.x-a.x)*as_y-(c.y-a.y)*as_x > 0 == s_ab) return false;
	if((c.x-b.x)*(s.y-b.y)-(c.y-b.y)*(s.x-b.x) > 0 != s_ab) return false;
	return true;
}

function dot (x0,y0,x1,y1,x2,y2) {
	return (x1-x0)*(y2-y1)-(x2-x1)*(y1-y0);
}

function insideHex (px,py,x0,y0,x1,y1,x2,y2,x3,y3,x4,y4,x5,y5) {
	if ( dot(x0,y0,x1,y1,px,py) > 0) {
		if ( dot(x1,y1,x2,y2,px,py) > 0) {
			if ( dot(x2,y2,x3,y3,px,py) > 0) {
				if ( dot(x3,y3,x0,y0,px,py) > 0) {
					if ( dot(x4,y4,x0,y0,px,py) > 0) {
						if ( dot(x5,y5,x0,y0,px,py) > 0) {
							return true;
						}
					}
				}
			}
		}
	}
	return false;
}

function pnpoly (vs, point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    
    var x = point.x, y = point.y;
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
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

Map = {
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

			// if (tile.cord == '+3+4-7') {
			// 	console.log(points.l*size);
			// }

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
			var odd = 0;
			var add = 0;
			var q = 0;
			var r = 0;

			c.lineWidth = 1;

			for (i = 1; i <= rc; i++) {
				r = i*hp.c+mapVPy-(2.5*Map.tileSize);
				// c.strokeStyle = "blue";
				// c.beginPath();
				// c.moveTo(mapVPx, r+0.5);
				// c.lineTo(mapW, r+0.5);
				// c.stroke();
				// c.closePath;

				if (odd == 0) {
					add = hp.m;
					odd = 1;
				} else {
					add = 0;
					odd = 0;
				}

				for (j = 0; j < qc; j++) {
					q = j*hp.r+mapVPx+add+0.5+hp.m;

					c.strokeStyle = "red";

					c.beginPath();
					c.rect(q-5, r-5, 10, 10);
					c.fillStyle = 'red';
					c.fill();

					var toX = j*hp.r+add+hp.m;
					var toY = i*hp.c-2.5*Map.tileSize;

					// console.log(j*hp.r+add, i*hp.c-(2.5*Map.tileSize));
					if (add) { // even
						Map.tileCentersXE.push(toX);
					} else {
						Map.tileCentersXO.push(toX);
					}
					Map.tileCentersY.push(toY);
					// Map.tileCenters.push({x:toX,y:toY});

					// c.lineTo(q+hp.m, r-hp.c);
					// c.lineTo(q+hp.r, r-(hp.c-hp.b));
					// c.lineTo(q+hp.r, r);
					// c.lineTo(q+hp.m, r+hp.b);
					// c.lineTo(q, r);
					
					c.closePath;

				}
			}
		}

		// console.log("rows ",rc,'cols ',qc);
		var oo = 0;
		var ii = 0;
		
		document.getElementById('map').addEventListener('mousemove', function(e) {

			// Object.keys(data).forEach(function (key) {
			// 	console.log(data[key]);
			// });

			var rect = document.getElementById('map').getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;

			// var rc = Math.floor(y / (9*Map.tileSize));
			// var rc = Math.floor((y-Map.tileSize) / (7*Map.tileSize));
			// console.log(rc);

				// c.strokeStyle = "blue";
				// c.beginPath();
				// c.moveTo(Map.mapVPx, rc*(7*Map.tileSize)+Map.mapVPy+0.5+Map.tileSize);
				// c.lineTo(mapW, rc*(7*Map.tileSize)+Map.mapVPy+0.5+Map.tileSize);
				// c.stroke();
				// c.closePath;
			// r = i*hp.c+mapVPy-(2.5*Map.tileSize);
			var closestY = closestTo(y, Map.tileCentersY);
			if (Math.floor(closestY / hp.c) % 2 ) {
				var closestX = closestTo(x, Map.tileCentersXO);
			} else {
				var closestX = closestTo(x, Map.tileCentersXE);
			}

			// y * Math.sqrt(3)
			// console.log(y * Math.sqrt(3));

			c.beginPath();
			c.rect(closestX+Map.mapVPx-5, closestY+Map.mapVPy-5, 10, 10);
			c.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
			c.fill();
			c.closePath;

			// var len = Map.tileCenters.length;
			// var i = 0;
			// var valid = false;
			// for (i; i < len; i++) {
			// 	if (Map.tileCenters[i].x == closestX) {
			// 		if (Map.tileCenters[i].y == closestY) {
			// 			valid = true;
			// 		}
			// 	}
			// 	if (Map.tileCenters[i].y == closestY) {
			// 		if (Map.tileCenters[i].x == closestX) {
			// 			valid = true;
			// 		}
			// 	}
			// 	if (valid) {
			// 		break;
			// 	}
			// }

			// if (valid) {
			// 	c.beginPath();
			// 	c.rect(closestX+Map.mapVPx-5, closestY+Map.mapVPy-5, 10, 10);
			// 	c.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
			// 	c.fill();
			// 	c.closePath;
			// }

			// console.log(closestX,closestY);
			// var a = 

			// var rc = Math.floor(y / hp.c) + 1; // TODO
			// var qc = 0;
			// var add = 0;

			// if (rc % 2) {
			// 	add = hp.m;
			// 	qc = Math.round(x / hp.r)-1;
			// } else {
			// 	qc = Math.floor(x / hp.r);
			// }

			// var q = qc*hp.r+add;
			// var r = rc*hp.c;

			// var points = [];
			// points[0] = {x:q,y:r}; // lc
			// points[1] = {x:q,y:r-(hp.c-hp.b)}; // lb
			// points[2] = {x:q+hp.m,y:r-hp.c}; // ma
			// points[3] = {x:q+hp.r,y:r-(hp.c-hp.b)}; // rb
			// points[4] = {x:q+hp.r,y:r}; // rc
			// points[5] = {x:q+hp.m,y:r+hp.b}; // md

			// if ( pnpoly(points,{x:x,y:y}) ) {

			// 	q = qc*hp.r+mapVPx+add+0.5;
			// 	r = rc*hp.c+mapVPy+0.5;

				// c.beginPath();
				// c.moveTo(q, r);
				// c.lineTo(q, r-(hp.c-hp.b));
				// c.lineTo(q+hp.m, r-hp.c);
				// c.lineTo(q+hp.r, r-(hp.c-hp.b));
				// c.lineTo(q+hp.r, r);
				// c.lineTo(q+hp.m, r+hp.b);
				// c.lineTo(q, r);
				// c.strokeStyle = "red";
				// c.lineWidth = 1;
				// c.stroke();
				// c.closePath;
				// if (oo != q && ii != r) {
				// 	// console.log('new');
				// 	oo = q;
				// 	ii = r;
				// }

					// q = qc*hp.r+mapVPx+add+0.5;
					// r = rc*hp.c+mapVPy+0.5;

					// c.beginPath();
					// c.moveTo(q, r);
					// c.lineTo(q, r-(hp.c-hp.b));
					// c.lineTo(q+hp.m, r-hp.c);
					// c.lineTo(q+hp.r, r-(hp.c-hp.b));
					// c.lineTo(q+hp.r, r);
					// c.lineTo(q+hp.m, r+hp.b);
					// c.lineTo(q, r);
					// c.strokeStyle = "red";
					// c.lineWidth = 1;
					// c.stroke();
					// c.closePath;
				// }
			// }
			// console.log(lc,lb,ma,rb,rc,md);

			// console.log(q,r);

			// var qm = 0;
			// var rm = 0;
			// var Al = 0;
			// var Bl = 0;
			// var Cl = 0;
			// var Ar = 0;
			// var Br = 0;
			// var Cr = 0;

			// if (odd) {
			// 	Al = {x:q * tw, y:r * drw};
			// 	Bl = {x:q * tw, y:r * drw + smd};
			// 	Cl = {x:q * tw + m, y:r * drw};

			// 	Ar = {x:q * tw + m, y:r * drw};
			// 	Br = {x:q * tw + tw, y:r * drw};
			// 	Cr = {x:q * tw + tw, y:r * drw + m};
			// } else {
			// 	Al = {x:q * tw - m, y:r * drw};
			// 	Bl = {x:q * tw, y:r * drw};
			// 	Cl = {x:q * tw - m, y:r * drw + smd};

			// 	Ar = {x:q * tw + m, y:r * drw};
			// 	Br = {x:q * tw, y:r * drw};
			// 	Cr = {x:q * tw + m, y:r * drw + smd};
			// }

			// // left triangle
			// var rm = 0;
			// if ( insideTriagle({x:x,y:y},Al,Bl,Cl) ) {
			// 	q--;
			// 	r--;
			// }
			// // right triangle
			// if ( insideTriagle({x:x,y:y},Ar,Br,Cr) ) {
			// 	if (odd) {
			// 		q++;
			// 	}
			// 	r--;
			// }
			// console.log(q,r);

		});

	},
	tileSize: 6,
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
