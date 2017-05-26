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
		var canvasWidth  = 0;
		var canvasHeight = 0;

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
	showTileInfo: function (id) {
		var tile = Map.tiles[id-1];
		if (typeof tile == 'undefined') {
			document.querySelectorAll('.tile-info')[0].innerHTML = '';
			return;
		}
		var z = (tile.x + tile.y) - (tile.x + tile.y) * 2;
		document.querySelectorAll('.tile-info')[0].innerHTML = '<div class="inner">ID: '+tile.id+'<br>X: '+tile.x+'<br>Y: '+tile.y+'<br>Z: '+z+'</div>';
	}

}

var Temp = {
	init: function () {
		Temp.toCheck = [];
		Temp.doneCheck = [];
		Temp.rounds = 0;
		Temp.lengthEmptyCells = 0;
		Temp.emptyCells = [];
		Temp.toCheck.push(2);
		Temp.slowRun1 = 0;
		Temp.slowRun2 = 1;
		Temp.slowRun3 = 1;
		Temp.emptyCellGroups = [];
		Temp.fillGaps();
		Temp.groupEmptyCells();
	},
	fillGaps: function () {
		// console.log('start with ', Temp.toCheck[0]);
		var id = Temp.toCheck[0];
		var tile = Map.tiles[id];
		if (typeof tile == 'undefined') {
			return;
		}
		var polygon = document.getElementById('tileId-'+tile.id);
		polygon.setAttribute('fill-opacity', '0.5');

		// if (Temp.rounds == 2) {
		// 	console.log('to check ',Temp.toCheck);
		// 	console.log('done check ',Temp.doneCheck);
		// 	return;
		// }

		var neigh = [
			{
				'x': tile.x-1,
				'y': tile.y
			},
			{
				'x': tile.x+1,
				'y': tile.y
			},
			{
				'x': tile.x,
				'y': tile.y-1
			},
			{
				'x': tile.x,
				'y': tile.y+1
			},
			{
				'x': tile.x+1,
				'y': tile.y-1
			},
			{
				'x': tile.x-1,
				'y': tile.y+1
			}
		];

		Temp.doneCheck.push(Temp.toCheck[0]);
		Temp.toCheck.shift();

		var len2 = Map.tiles.length;
		var j = 0;
		function checkNeigh() {

			function run () {
				var found = false;
				var i = 0;
				for (i; i<len2; i++) {

					if (
						Map.tiles[i].x == neigh[j].x &&
						Map.tiles[i].y == neigh[j].y
					) {

						found = true;

						var len3 = Temp.doneCheck.length;
						var o = 0;
						var ta = false;
						for (o; o<len3; o++) {
							if (Temp.doneCheck[o] == i) {
								// console.log('ta ',i);
								ta = true;
								break;
							}
						}
						if (ta) {
							continue;
						}
						
						var len3 = Temp.toCheck.length;
						var o = 0;
						var tr = false;
						for (o; o<len3; o++) {
							if (Temp.toCheck[o] == i) {
								// console.log('tr', i);
								tr = true;
								break;
							}
						}
						if (tr) {
							continue;
						}

						document.getElementById('tileId-'+Map.tiles[i].id).setAttribute('fill-opacity', '0.5');
						// console.log('push to toCheck', i);
						Temp.toCheck.push(i);
					}
				}

				if (!found) {
					var tile = {x:neigh[j].x, y:neigh[j].y};
					var len = Temp.emptyCells.length;
					var i = 0;
					var ff = false;
					for (i; i<len; i++) {
						if (
							Temp.emptyCells[i].x == neigh[j].x &&
							Temp.emptyCells[i].y == neigh[j].y
						) {
							ff = true;
						}
					}

					if (!ff) {
						Temp.emptyCells.push(tile);
						Temp.lengthEmptyCells++;
						Temp.createCell(tile);
					}

				}

				j++;
				if (j<6) {
					checkNeigh();
				} else {
					polygon.setAttribute('fill-opacity', '1');

					Temp.rounds++;
					Temp.fillGaps();
				}
			}

			if (Temp.slowRun1) {
				setTimeout(function () {
					run();
				}, 0);
			} else {
				run();
			}

		}

		checkNeigh();

	},
	createCell: function (tile) {

		var x = tile.x;
		var y = tile.y;
		var z = (x + y) - (x + y) * 2;

		var l = (y+Math.floor(z/2)-1) * Map.cordBase.x2;
		var m = l + Map.cordBase.x1;
		var r = l + Map.cordBase.x2;

		if (z % 2) {
			l += Map.cordBase.x1;
			m += Map.cordBase.x1;
			r += Map.cordBase.x1;
		}

		var a = z * Map.cordBase.y2;
		var b = a + Map.cordBase.y1;
		var c = a + Map.cordBase.y2;
		var d = a + Map.cordBase.y3;

		var pos = {
			'l': l,
			'm': m,
			'r': r,
			'a': a,
			'b': b,
			'c': c,
			'd': d
		}
		tile.pos = pos;

		if (Map.clickLayerBool) {
			var points = tile.pos.m+','+tile.pos.a+' '+
									 tile.pos.l+','+tile.pos.b+' '+
									 tile.pos.l+','+tile.pos.c+' '+
									 tile.pos.m+','+tile.pos.d+' '+
									 tile.pos.r+','+tile.pos.c+' '+
									 tile.pos.r+','+tile.pos.b;

			var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			polygon.setAttribute('id', 'emptyTileId-'+Temp.lengthEmptyCells);
			polygon.setAttribute('points', points);
			polygon.setAttribute('fill', '#ff0000');
			polygon.setAttribute('fill-opacity', '1');
			polygon.addEventListener('mousemove', function(e) {
				Map.showTileInfo(this.getAttribute('id').replace('tileId-',''));
			});
			Map.clickLayer.insertBefore(polygon, Map.clickLayer.childNodes[0]);
		}


	},
	groupEmptyCells: function () {

		function grouping (id) {
			function checkNeigh (tile) {
				var neigh = [
					{
						'x': tile.x-1,
						'y': tile.y
					},
					{
						'x': tile.x+1,
						'y': tile.y
					},
					{
						'x': tile.x,
						'y': tile.y-1
					},
					{
						'x': tile.x,
						'y': tile.y+1
					},
					{
						'x': tile.x+1,
						'y': tile.y-1
					},
					{
						'x': tile.x-1,
						'y': tile.y+1
					}
				];
				var len2 = Temp.emptyCells.length;
				var j = 0;
				var i = 0;
				var foundNeigh = [];

				for (j=0; j<6; j++) {
					for (i=0; i<len2; i++) {
						if (
							Temp.emptyCells[i].x == neigh[j].x &&
							Temp.emptyCells[i].y == neigh[j].y &&
							Temp.emptyCells[i].hasOwnProperty('processed') == false
						) {
							Temp.emptyCells[i].group = tile.group;
							Temp.emptyCellGroups[tile.group].nr++;
							foundNeigh.push(i);
							break;
						}
					}
				}
				tile.neigh = foundNeigh;

			}

			var tile = Temp.emptyCells[id];

			// does cell belong to a group?
			// no, then create new group and assign cell
			if (tile.hasOwnProperty('group') == false) {
				var groupId = Temp.emptyCellGroups.length;
				var group = {
					'color': "#"+((1<<24)*Math.random()|0).toString(16), // rand color
					'nr': 1 // something is wrong here
				}
				Temp.emptyCellGroups.push(group);
				tile.group = groupId;
			}

			// does cell have neighbors?
			// yes, has neighbor been processed?
			//      yes, assign those neighbors to parent group
			//           and set pointer to neighbors for tile
			checkNeigh(tile);

			// set processed status for tile
			tile.processed = true;

			// recursive function for the neighbors
			var len = tile.neigh.length;
			var i = 0;
			for (i=0; i<len; i++) {
				grouping(tile.neigh[i]);
			}

		}

		function colorizeCells () {
			var len2 = Temp.emptyCells.length;
			var i = 0;
			for (i=0; i<len2; i++) {
				var group = Temp.emptyCells[i].group;
				var color = null;
				var id = i+1;
				document.getElementById('emptyTileId-'+id).setAttribute('fill', Temp.emptyCellGroups[Temp.emptyCells[i].group].color);
			}
		}

		// run through all cells, check whether they have been processed already
		// yes, skip to next
		// no, process cell
		var len2 = Temp.emptyCells.length;
		var i = 0;
		for (i=0; i<len2; i++) {
			if (Temp.emptyCells[i].hasOwnProperty('processed') == false) {
				grouping(i);
			}
		}

		if (Temp.slowRun2) {
			setTimeout(function () {
				colorizeCells();
				setTimeout(function () {
					Temp.removeLargestGroup();
				}, 2000);
			}, 1000);
		} else {
			colorizeCells();
			Temp.removeLargestGroup();
		}

	},
	removeLargestGroup: function () {

		// find largest group
		var len = Temp.emptyCellGroups.length;
		var i = 0;
		var t = 0;
		var nr = 0;
		var biggestGroup = null;
		for (i=0; i<len; i++) {
			var t = Temp.emptyCellGroups[i].nr;
			if (nr < t) {
				biggestGroup = i;
				nr = t;
			}
		}
		
		len = Temp.emptyCells.length;
		var group = [];
		for (i=0; i<len; i++) {
			if (Temp.emptyCells[i].group == biggestGroup) {
				group.push(i);
			}
		}

		len = group.length;
		if (Temp.slowRun2) {
			// let the biggest group blink, for gods sake
			var times = 0;
			var orgColor = Temp.emptyCellGroups[biggestGroup].color;
			var chosenColor = null;
			var toggle = 0;
			function blink () {
				times++;
				var id = null;

				if (toggle == 0) {
					chosenColor = '#ff0000';
					toggle = 1;
				} else {
					chosenColor = orgColor;
					toggle = 0;
				}
				len = group.length;
				for (i=0; i<len; i++) {
					id = group[i]+1;
					document.getElementById('emptyTileId-'+id).setAttribute('fill', chosenColor);
				}

				setTimeout(function () {
					console.log(1);
					if (times < 5) {
						blink ();
					} else {
						len = group.length;
						for (i=0; i<len; i++) {
							id = group[i]+1;
							document.getElementById('emptyTileId-'+id).remove();
						}
						Temp.emptyCellGroups.splice(biggestGroup, 1);
						Temp.fillEmptyGroups();
					}
				}, 500);
			}
			blink ();
		}

		if (!Temp.slowRun2) {
			len = group.length;
			for (i=0; i<len; i++) {
				id = group[i]+1;
				document.getElementById('emptyTileId-'+id).remove();
			}
			Temp.emptyCellGroups.splice(biggestGroup, 1);
			Temp.fillEmptyGroups();
		}

	},
	fillEmptyGroups: function () {
		function run () {
			setTimeout(function () {
				run();
			}, 500);
		}

		if (Temp.slowRun3) {

		}

		var consoleDebug = false;

		function processGroup (groupId) {
			function checkNeigh (tile, id) {
				if (consoleDebug) {
					console.log('---');
				}

				var neigh = [{'x': tile.x-1,'y': tile.y},{'x': tile.x+1,'y': tile.y},{'x': tile.x,'y': tile.y-1},{'x': tile.x,'y': tile.y+1},{'x': tile.x+1,'y': tile.y-1},{'x': tile.x-1,'y': tile.y+1}];
				var len2 = Temp.emptyCells.length;
				var j = 0;
				var i = 0;
				var found = null;
				var found2 = null;
				var sameGroupCells = [];
				// here for non existent cells

				for (j=0; j<6; j++) {
					found = false;
					for (i=0; i<len2; i++) {
						if (
							Temp.emptyCells[i].x == neigh[j].x &&
							Temp.emptyCells[i].y == neigh[j].y
						) {
							found = true;
							break;
						}
					}

					if (found == false) {
						// is that a non existent cell or an existent?
						var len3 = Map.tiles.length;
						var o = 0;
						found2 = false;
						for (o=0; o<len3; o++) {
							if (
								Map.tiles[o].x == neigh[j].x &&
								Map.tiles[o].y == neigh[j].y
							) {
								if (consoleDebug) {
									console.log((id+1), 'exists');
								}
								found2 = true;
								break;
							}
						}
						if (found2 == false) {
							if (consoleDebug) {
								console.log((id+1), 'non existent, create new');
							}

							var newTile = {x:neigh[j].x, y:neigh[j].y, processed: false, group: tile.group};
							Temp.emptyCells.push(newTile);
							Temp.lengthEmptyCells++;
							Temp.createCell(newTile);

							Temp.emptyCells[Temp.lengthEmptyCells-1].processed2 = true;
							cells.push(Temp.lengthEmptyCells-1);
							sameGroupCells.push(Temp.lengthEmptyCells-1);
						}
					} else {
						// is that a cell in the same group?
						len3 = cells.length;
						o = 0;
						found2 = false;
						for (o=0; o<len3; o++) {
							if (
								Temp.emptyCells[i].x == Temp.emptyCells[cells[o]].x &&
								Temp.emptyCells[i].y == Temp.emptyCells[cells[o]].y
							) {
								if (Temp.emptyCells[i].processed == false) {
									if (Temp.emptyCells[i].hasOwnProperty('processed2') == false) {
										if (consoleDebug) { console.log((id+1), 'same group cell, process'); }
										Temp.emptyCells[i].processed2 = true;
										sameGroupCells.push(cells[o]);
									} else {
										if (consoleDebug) { console.log((id+1), 'same group cell, was already marked'); }
									}
									
									found2 = true;
									break;
								} else {
									if (consoleDebug) { console.log((id+1), 'same group cell, old'); }
								}
							}
						}
					}
				}

				// set processed status for tile
				tile.processed = true;
				tile.processed2 = true;
				document.getElementById('emptyTileId-'+(id+1)).setAttribute('fill', Temp.emptyCellGroups[tile.group-1].color);

				// recursive function for the neighbors
				len = sameGroupCells.length;
				i = 0;
				
				var speed = 0;
				if (Temp.slowRun3) {
					speed = 100;
				}

				for (i=0; i<len; i++) {
					setTimeout(function(a, b) {
						checkNeigh(a, b);
					}, speed, Temp.emptyCells[sameGroupCells[i]], sameGroupCells[i]);
				}
			}


			// get all tiles of this group
			var len = Temp.emptyCells.length;
			var cells = [];
			var i = 0;
			for (i=0; i<len; i++) {
				Temp.emptyCells[i].processed = false; // also invoke checked property
				if (Temp.emptyCells[i].group == groupId) {
					cells.push(i);
				}
			}
			
			// start recursive neighbor search
			checkNeigh(Temp.emptyCells[cells[0]], cells[0]);
		}

		function normalize () {
			var len = Temp.emptyCells.length;
			var i = 0;
			for (i=0; i<len; i++) {
				if (document.getElementById('emptyTileId-'+(i+1)) != null) {					
					document.getElementById('emptyTileId-'+(i+1)).removeAttribute('fill');
				}
			}
		}

		var timesChecked = 0;
		var lastLength = Temp.emptyCells.length;
		var gapBetween = 0;
		var gapped = 0;
		var gd = 100;
		if (Temp.slowRun3) {
			gd = 1000;
		}
		function checkProcessing () { // -.-

			gapBetween = Temp.emptyCells.length - lastLength;
			setTimeout(function() {
				timesChecked++;

				if (Temp.emptyCells.length - lastLength == gapBetween) {
					gapped++;
				}
				if (gapped == gd) {
					normalize();
				} else {
					checkProcessing();
				}

			}, 0);
		}

		var len = Temp.emptyCellGroups.length;
		var i = 0;
		for (i=0; i<len; i++) {
			processGroup(i+1);
		}
		checkProcessing();

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
						if (item.childNodes[3].value > 1000) {
							document.getElementsByClassName('entry-fillgaps')[0].childNodes[3].disabled = true;
						} else {
							document.getElementsByClassName('entry-fillgaps')[0].childNodes[3].disabled = false;
						}
					}
				})
			}
		});

		addEvent(document.getElementsByName('send')[0], 'click', function() {
			App.getMap(1);
		})

		addEvent(document.getElementsByName('fillgaps')[0], 'click', function() {
			Temp.init();
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
