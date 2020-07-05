/*

sudo chown -R `whoami` .
gcc -Os -Wall -o mapgen mapgen.c // even better but smaller binary
gcc -O2 -Wall mapgen.c -o mapgen // sometimes O2 is faster though

./mapgen && echo ok // if output should be given to the console
./mapgen 100 100  && echo ok

make
gcc -O2 -Wall -g mapgen.c -o mapgen
lldb -- ./mapgen 500000 0.0005 // segmentation error. too low pow?
run

With fillgaps. This is the way the game will use the script:
tileCap, pow, fillGap, heighProb, irrigateProb
./mapgen 700 1 1 2 40

RESTRICTIONS
# segmentation restriction
./mapgen 10000000 0.00125
# index.php 1024 memory
# javascript canvas restriction http://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element 16,384 x 16,384
with fillGap:
./mapgen 100000 0.00125
javascript with clickLayer only 10000 tiles because of svg slow-down

*/

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <unistd.h>
#include "coord_map.h"

coord_map map;

unsigned long mix(unsigned long a, unsigned long b, unsigned long c) {
	a=a-b;  a=a-c;  a=a^(c >> 13);
	b=b-c;  b=b-a;  b=b^(a << 8);
	c=c-a;  c=c-b;  c=c^(b >> 13);
	a=a-b;  a=a-c;  a=a^(c >> 12);
	b=b-c;  b=b-a;  b=b^(a << 16);
	c=c-a;  c=c-b;  c=c^(b >> 5);
	a=a-b;  a=a-c;  a=a^(c >> 3);
	b=b-c;  b=b-a;  b=b^(a << 10);
	c=c-a;  c=c-b;  c=c^(b >> 15);
	return c;
}

struct getCords_return {
	int x;
	int y;
};

void getCords (int dir, int x, int y, struct getCords_return* result) {
	*result = (struct getCords_return) {0}; // {0} so is guaranteed that all values have 0 in struct in case more values are added to the struct but not in the function here

	switch(dir) {
		case 0: { // top left
			x += 1;
			break;
		}
		case 1: { // left
			x += 1;
			y -= 1;
			break;
		}
		case 2: { // left bottom
			y -= 1;
			break;
		}
		case 3: { // right bottom
			x -= 1;
			break;
		}
		case 4: { // right
			x -= 1;
			y += 1;
			break;
		}
		case 5: { // right up
			y += 1;
			break;
		}
	}

	result->x = x;
	result->y = y;
}

struct Tile {
	int id;
	int parent;
	int generation;
	int x;
	int y;
	int group;
	int height;
	int land;
	int rev; // river exit search visited
};
int tileCount = 1;
int maxTileCount = 0;
int fillGapsBool = 0;
float powProb;
long double heightProb;
long double irrigateProb;
int tilesCap = 500;
struct Tile *tiles;
unsigned char dirs[6] = {0, 1, 2, 3, 4, 5}; // unsigned nur positive nummern

int tileTree() {
	int generation = tiles[tileCount-1].generation;
	int x = tiles[tileCount-1].x;
	int y = tiles[tileCount-1].y;

	if (tileCount >= tilesCap) {
		tilesCap *= 2;
		printf("new tile cap: %d | id: %d\n", tilesCap, tileCount);
		tiles = realloc(tiles, tilesCap*sizeof(struct Tile));
		memset(tiles + tilesCap / 2, 0, tilesCap*sizeof(struct Tile) / 2); // 0 is the byte size
	}

	if (tileCount >= maxTileCount) {
		return 1;
	}

	// printf("%d | %d\n", tileCount, id);

	unsigned short chance = 100-powProb*generation; // pow 1.2 | float * int => float / int * float => int
	unsigned char dirs[6] = {0, 1, 2, 3, 4, 5};
	unsigned char arrLen = 6;
	unsigned char tmp = 0;
	unsigned char dir = 0;
	unsigned char i = 0;

	for (i=0; i<6; i++) {
		if (rand() % 100 < chance) {
			struct getCords_return ret;

			dir = rand() % arrLen;

			tmp = dirs[arrLen-1];
			dirs[arrLen-1] = dirs[dir];
			dirs[dir] = tmp;

			getCords(dirs[arrLen-1], x, y, &ret);

			if (coord_map_get(&map, ret.x, ret.y)) {
				continue;
			}
			coord_map_set(&map, ret.x, ret.y, 1);

			arrLen--;

			struct Tile *tile = &tiles[tileCount];

			tile->x = ret.x;
			tile->y = ret.y;

			// printf("%d | %d\n", tile->x, tile->y);

			// printf("%d", dir);
			// printf("%d | %d | %d\n", generation, chance, rand() % 100);

			tile->id = tileCount+1;
			tile->parent = tileCount;
			tile->generation = generation + 1;

			tileCount += 1;

			// printf("new tile: %d\n", tile->id);

			if (tileTree() != 0) {
				return 1;
			}

		}
	}

	return 0;
}

struct TileGroup {
	int amount;
};
struct Tile *borderTiles;
int borderTileCount = 1;
int borderTilesCap = 500;
struct TileGroup *tile_groups;
int groupCount = 0;
int tile_groups_cap = 100;
int largestGroupId = 0;

int fillGapsOfBorderTiles(int i) {
	unsigned int j = 0;

	// first figure out if there are any missing neighbor-tiles left:
	for (j=0; j<6; j++) {
		struct getCords_return ret;
		getCords(dirs[j], borderTiles[i].x, borderTiles[i].y, &ret);

		if (coord_map_get(&map, ret.x, ret.y) == 0) {
			// printf("not existing tile yet (x: %i, y: %i)\n", ret.x, ret.y);

			if (borderTileCount >= borderTilesCap) {
				borderTilesCap *= 2;
				printf("new borderTile cap: %d | id: %d\n", borderTilesCap, borderTileCount);
				borderTiles = realloc(borderTiles, borderTilesCap*sizeof(struct Tile));
				memset(borderTiles + borderTilesCap / 2, 0, borderTilesCap*sizeof(struct Tile) / 2);
			}

			coord_map_set(&map, ret.x, ret.y, 1);

			struct Tile *borderTile = &borderTiles[borderTileCount-1];
			borderTile->id = borderTileCount;
			borderTile->group = -1;
			borderTile->x = ret.x;
			borderTile->y = ret.y;

			borderTileCount += 1;

		}

	}

	return 0;
}
int groupNeighborBorderTiles(int i) {
	unsigned int j = 0;
	unsigned int o = 0;

	if (borderTiles[i].group == -1) { // set parent's group to a group if -1:

		if (groupCount >= tile_groups_cap) {
			tile_groups_cap *= 2;
			printf("new tile_group cap: %d | id: %d\n", tile_groups_cap, groupCount);
			tile_groups = realloc(tile_groups, tile_groups_cap*sizeof(struct TileGroup));
			memset(tile_groups + tile_groups_cap / 2, 0, tile_groups_cap*sizeof(struct TileGroup) / 2);
		}

		borderTiles[i].group = groupCount;
		tile_groups[groupCount].amount = 1;
		// printf("border-tile %i (x: %i, y: %i) assigned group %i\n", i, borderTiles[i].x, borderTiles[i].y, groupCount);
		groupCount++;
	}

	for (j=0; j<6; j++) {
		struct getCords_return ret;
		getCords(dirs[j], borderTiles[i].x, borderTiles[i].y, &ret);

		for (o=0; o<borderTileCount; o++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if ( // finding neighbors which are border-tiles:
				ret.x == borderTiles[o].x &&
				ret.y == borderTiles[o].y
			) {
				if (borderTiles[o].group == -1) { // set child's group to parent's group if 0:
					borderTiles[o].group = borderTiles[i].group;
					tile_groups[borderTiles[i].group].amount++;
					// printf("border-tile %i (x: %i, y: %i) has now group %i of parent %i\n", o, borderTiles[o].x, borderTiles[o].y, borderTiles[i].group, i);
					groupNeighborBorderTiles(o);
				}
			}

		}

	}
	return 0;
}

int fillGaps() {
	printf("fill gaps\n");
	int i = 0;
	unsigned int j = 0;

	tile_groups = calloc(tile_groups_cap, sizeof(struct TileGroup));
	borderTiles = calloc(borderTilesCap, sizeof(struct Tile));

	// create border-tiles:
	for (i=0; i<tileCount; i++) {
		for (j=0; j<6; j++) {

			struct getCords_return ret;
			getCords(dirs[j], tiles[i].x, tiles[i].y, &ret);

			if (coord_map_get(&map, ret.x, ret.y) == 0) {

				if (borderTileCount >= borderTilesCap) {
					borderTilesCap *= 2;
					printf("new borderTile cap: %d | id: %d\n", borderTilesCap, borderTileCount);
					borderTiles = realloc(borderTiles, borderTilesCap*sizeof(struct Tile));
					memset(borderTiles + borderTilesCap / 2, 0, borderTilesCap*sizeof(struct Tile) / 2);
				}

				coord_map_set(&map, ret.x, ret.y, 1);

				struct Tile *borderTile = &borderTiles[borderTileCount-1];
				borderTile->id = borderTileCount;
				borderTile->group = -1;
				borderTile->x = ret.x;
				borderTile->y = ret.y;

				borderTileCount += 1;

			}

		}
	}

	// combine border-tiles into groups recursivelly:
	for (i=0; i<borderTileCount; i++) {
		groupNeighborBorderTiles(i);
	}
	printf("group count: %d\n", groupCount);

	// figure out largest group (largest group is always the outmost one):
	int largest = 0;
	for (i=0; i<groupCount; i++) {
		if (largest < tile_groups[i].amount) {
			largest = tile_groups[i].amount;
			largestGroupId = i;
		}
		// printf("tile-group %i has a tile amount of %i\n", i, tile_groups[i].amount);
	}
	// printf("tile-group %i has the largest amount: %i\n", largestGroupId, largest);

	// fill gaps recursivelly:
	for (i=0; i<borderTileCount; i++) {
		if (borderTiles[i].group == largestGroupId) {
			continue;
		}
		fillGapsOfBorderTiles(i);
	}

	// put borderTiles into tiles:
	for (i=0; i<borderTileCount-1; i++) { // unsure about -1
		if (borderTiles[i].group == largestGroupId) {
			continue;
		}

		if (tileCount >= tilesCap) {
			tilesCap *= 2;
			printf("new tile cap: %d | id: %d\n", tilesCap, tileCount);
			tiles = realloc(tiles, tilesCap*sizeof(struct Tile));
			memset(tiles + tilesCap / 2, 0, tilesCap*sizeof(struct Tile) / 2); // 0 is the byte size
		}

		struct Tile *tile = &tiles[tileCount];

		tile->id = tileCount+1;
		tile->x = borderTiles[i].x;
		tile->y = borderTiles[i].y;

		tileCount += 1;

	}

	return 0;
}

int corrugate(int i, int h) {
	int j = 0;
	int o = 0;

	tiles[i].height = h;

	struct getCords_return ret;

	for (j=0; j<6; j++) {
		getCords(dirs[j], tiles[i].x, tiles[i].y, &ret);

		if (coord_map_get(&map, ret.x, ret.y)) { // TODO: not really needed since fillgaps

			for (o=0; o<tileCount; o++) { // would be nice to do it with coord_map but it does not return id of tile yet.
				if (
					ret.x == tiles[o].x &&
					ret.y == tiles[o].y
				) {

					if (rand() % 100 < 50) { // smaller number means more cliffs.
						if (tiles[o].height < h) { // replace heights of tiles only when neighbors are lower.
							if (rand() % 100 < 50 && h > 0) { // decrease height level by a change of 25%:
								h--;
							}
							if (h > 0) {
								corrugate(o, h);
							}
						}
						// printf(" %d\n", h);
					}

				}

			}

		}


	}

	return 0;
}

int corrugateMap() {

	int tops = 0;
	int i = 0;
	for (i=0; i<tileCount; i++) {
		if (rand() % 100 < heightProb) {
			tops++;
			corrugate(i, (rand() % 4) + 1);
		}
	}

	printf("mountain tops: %d\n", tops);
	return 0;

}

struct RiverGroupStruct {
	int begin;
	int end;
};
struct RiverGroupStruct *riverGroups;
int riverGroupCount = 0;
int riverGroupCap = 10;
/*
inflow
	1 = mountain
	2 = lake
outflow
	1 = edge
	2 = lake
*/
struct RiverStruct {
	int id;
	int from;
	int to;
	int class;
	int inflow;
	int outflow;
};
struct RiverStruct *rivers;
int riverCount = 0;
int riverCap = 100;

/*
* x = x of river[x] / the -> from tile
*/
int riverSegmentation(int path, int x, int flow) {
	int j;

	// figure out if this tile is a lake:
	if (path == 1) { // inflow path
		for (j=0; j<tileCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if (j == rivers[x].from) {
				if (tiles[j].land == 1) {
					flow = 2;
				}
			}
		}
	} else { // outflow path
		for (j=0; j<tileCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if (j == rivers[x].to) {
				if (tiles[j].land == 1) {
					flow = 2;
				}
			}
		}
	}

	if (path == 1) { // inflow path
		rivers[x].inflow = flow;

		if (rivers[x].to >= 0) {
			for (j=0; j<riverCount; j++) {
				if (rivers[x].to == rivers[j].from) {

					riverSegmentation(1, j, flow);
					return 0;

				}
			}
		}

	} else { // outflow path
		rivers[x].outflow = flow;

		for (j=0; j<riverCount; j++) {
			if (rivers[x].from == rivers[j].to) {

				riverSegmentation(2, j, flow);
				return 0;

			}
		}

	}

	return 0;
}

int lakeExpander(i) {
	int j;
	int o;

	tiles[i].land = 1;

	struct getCords_return ret;

	for (j=0; j<6; j++) {
		getCords(dirs[j], tiles[i].x, tiles[i].y, &ret);

		for (o=0; o<tileCount; o++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if (
				ret.x == tiles[o].x &&
				ret.y == tiles[o].y &&
				tiles[o].height == 0 &&
				tiles[o].land == 0 &&
				rand() % 100 < irrigateProb
			) {
				lakeExpander(o);
			}
		}
	}

	return 0;
}

int placeLakes() {
	int i;
	int j;
	for (i=0; i<tileCount; i++) {
		for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.

			if (
				i == rivers[j].from ||
				i == rivers[j].to
			) {
				
				// exclude tiles which are not height-level 0 and class -1:
				if (tiles[i].height > 0 || rivers[j].class == -1) {
					continue;
				}

				if (rand() % 100 < (irrigateProb/4)) { // 1/4 prob
					lakeExpander(i);
					// printf("tile %d high %d and river %d class %d\n", rivers[i].from, tiles[i].height, i, rivers[i].class);
				}

			}

		}
	}

	// withdraw rivers which are placed in lakes and float on height 0:
	for (j=0; j<riverCount; j++) {
		for (i=0; i<tileCount; i++) {
			if (
				i == rivers[j].from ||
				i == rivers[j].to
			) {
				if (
					tiles[rivers[j].from].land == 1 &&
					tiles[rivers[j].to].land == 1
				) {
					rivers[j].class = -1;
				}
			}
		}
	}

	return 0;
}

/*
	i            = tile-id from which river is supposed to originate.
	riverId      = or class. river-tiles belong to a river-class.
	reri         = reached river. stop expanding when reached another river-class than itself.
	
*/
int irrigate(int i, int riverId, int reri, int tl, int ll, int lb, int rb, int rr, int tr, int stopped, int parent, int parentCameFrom) {

	int j = 0;

	if (reri) { // if neighbor-tile is another river-class, merge (TODO transfer all rivers to same river-class):
		printf("merge %d => %d\n", riverId, reri);

		struct RiverGroupStruct *riverGroup = &riverGroups[riverGroupCount];
		riverGroup->end = i;

		for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if (
				rivers[j].class == riverId
			) {
				rivers[j].class = reri;
				continue;
			}
		}

		return 0;
	}

	int reachedRiver = 0;

	char chooseDirs[6] = {-1, -1, -1, -1, -1, -1};
	unsigned int randLen = 6;
	unsigned int arrLen = 0;

	if (tl == 0) {
		randLen--;
	} else {
		chooseDirs[arrLen] = dirs[0];
		arrLen++;
	}
	if (ll == 0) {
		randLen--;
	} else {
		chooseDirs[arrLen] = dirs[1];
		arrLen++;
	}
	if (lb == 0) {
		randLen--;
	} else {
		chooseDirs[arrLen] = dirs[2];
		arrLen++;
	}
	if (rb == 0) {
		randLen--;
	} else {
		chooseDirs[arrLen] = dirs[3];
		arrLen++;
	}
	if (rr == 0) {
		randLen--;
	} else {
		chooseDirs[arrLen] = dirs[4];
		arrLen++;
	}
	if (tr == 0) {
		randLen--;
	} else {
		chooseDirs[arrLen] = dirs[5];
		arrLen++;
	}


	// if no dir left:
	if (tl == 0 && ll == 0 && lb == 0 && rb == 0 && rr == 0 && tr == 0) {
		// check if height-level touches the exit or a tile with lower height:

		if (parentCameFrom == 0) {
			tl = 0;
		} else if (parentCameFrom == 1) {
			ll = 0;
		} else if (parentCameFrom == 2) {
			lb = 0;
		} else if (parentCameFrom == 3) {
			rb = 0;
		} else if (parentCameFrom == 4) {
			rr = 0;
		} else if (parentCameFrom == 5) {
			tr = 0;
		}

		printf("could not find path. river withdrawn %d\n", riverId);

		// exclude rivers with -1 which will not be printed out
		for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if (
				rivers[j].class == riverId
			) {
				rivers[j].class = -1;
				continue;
			}
		}

		return 0;
	}

	int o = 0;
	int randNeigh = chooseDirs[rand() % randLen];
	// printf("randNeigh: %d\n", randNeigh);
	int to;

	struct getCords_return ret;
	getCords(randNeigh, tiles[i].x, tiles[i].y, &ret);

	to = randNeigh * -1;

	for (j=0; j<tileCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
		if (
			ret.x == tiles[j].x &&
			ret.y == tiles[j].y
		) {
			to = tiles[j].id;
		}
	}

	// choose other direction if to-tile height is higher than from-tile:
	if (to >= 1 && tiles[i].height < tiles[to-1].height) {
		// printf("parentH: %d sonH: %d\n", tiles[i].height, tiles[to-1].height);
		if (randNeigh == 0) {
			tl = 0;
		} else if (randNeigh == 1) {
			ll = 0;
		} else if (randNeigh == 2) {
			lb = 0;
		} else if (randNeigh == 3) {
			rb = 0;
		} else if (randNeigh == 4) {
			rr = 0;
		} else if (randNeigh == 5) {
			tr = 0;
		}
		irrigate(i, riverId, reachedRiver, tl, ll, lb, rb, rr, tr, 1, tiles[i].id, randNeigh);
		return 0;
	}

	// printf("parent:%d => tile ID: %d => to %d (RN %d / RL %d) | stopped %d | tl:%d ll:%d lb:%d rb:%d rr:%d tr:%d\n", parent, tiles[i].id, to, randNeigh, randLen, stopped, tl, ll, lb, rb, rr, tr);
	// printf("tl:%d ll:%d lb:%d rb:%d rr:%d tr:%d\n", chooseDirs[0], chooseDirs[1], chooseDirs[2], chooseDirs[3], chooseDirs[4], chooseDirs[5]);
	// if neighbor-tile has already a river:
	for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
		if (
			to-1 == rivers[j].from ||
			to-1 == rivers[j].to
		) {
			if (riverId == rivers[j].class) { // if neighbor-tile is same river-class, try another direction:
				// printf("loop river prevention riverId:%d, class:%d, dir:%d\n", riverId, rivers[j].class, dirs[randNeigh]);

				for (o=0; o<6; o++) {
					if (o == randNeigh) {
						if (o == 0) {
							tl = 0;
						} else if (o == 1) {
							ll = 0;
						} else if (o == 2) {
							lb = 0;
						} else if (o == 3) {
							rb = 0;
						} else if (o == 4) {
							rr = 0;
						} else if (o == 5) {
							tr = 0;
						}
					}
				}

				irrigate(i, riverId, reachedRiver, tl, ll, lb, rb, rr, tr, 1, tiles[i].id, randNeigh);
				return 0;
			}
			reachedRiver = rivers[j].class;
			// printf("class1:%d, class2:%d\n", riverId, rivers[j].class);
			// printf("already river to:%d, f:%d, t:%d, class:%d\n", to, rivers[j].from, rivers[j].to, rivers[j].class);
		}
	}
	
	if (riverCount >= riverCap) {
		riverCap *= 2;
		printf("new river cap: %d | id: %d\n", riverCap, riverCount);
		rivers = realloc(rivers, riverCap*sizeof(struct RiverStruct));
		memset(rivers + riverCap / 2, 0, riverCap*sizeof(struct RiverStruct) / 2); // 0 is the byte size.
	}

	struct RiverStruct *river = &rivers[riverCount];
	river->id = riverCount;
	river->from = tiles[i].id;
	river->class = riverId;
	if (tiles[i].id != 0) { // so strange, this should not happen.
		river->from--;
	}
	river->to = to -1; // -1 important here. 0 can be a tile ID. Everything below 0 indicates direction.

	riverCount += 1;

	if (to >= 1) {
		tl = 1;
		ll = 1;
		lb = 1;
		rb = 1;
		rr = 1;
		tr = 1;
		irrigate(to-1, riverId, reachedRiver, tl, ll, lb, rb, rr, tr, 0, tiles[i].id, randNeigh);
	} else { // end reached?

		struct RiverGroupStruct *riverGroup = &riverGroups[riverGroupCount];
		riverGroup->end = i;


	}

	return 0;
}

int irrigateMap() {

	rivers = calloc(riverCap, sizeof(struct RiverStruct));
	riverGroups = calloc(riverGroupCap, sizeof(struct RiverGroupStruct));

	int i = 0;
	int j = 0;
	int cont;
	int riverId = 1;
	for (i=0; i<tileCount; i++) {

		// exclude tiles which are not height-level 3:
		if (tiles[i].height != 3) {
			// printf("tile %d was not high enough: %d\n", i, tiles[i].height);
			continue;
		}

		cont = 1;
		if (rand() % 100 < irrigateProb) {

			// do not plant rivers on tiles which have already one:
			for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
				if (
					i == rivers[j].from ||
					i == rivers[j].to
				) {
					cont = 0;
					// printf("do not plant rivers on tiles which have already one:%d\n", i);
					continue;
				}
			}

			if (cont) {
				printf("placed river %d\n", riverId);

				if (riverGroupCount >= riverGroupCap) {
					riverGroupCap *= 2;
					printf("new riverGroup cap 2: %d | id: %d\n", riverGroupCap, riverGroupCount);
					riverGroups = realloc(riverGroups, riverGroupCap*sizeof(struct RiverGroupStruct));
					memset(riverGroups + riverGroupCap / 2, 0, riverGroupCap*sizeof(struct RiverGroupStruct) / 2); // 0 is the byte size.
				}

				struct RiverGroupStruct *riverGroup = &riverGroups[riverGroupCount];
				riverGroup->begin = i;

				irrigate(i, riverId, 0, 1, 1, 1, 1, 1, 1, 0, -1, -1);
				riverId++;

				riverGroupCount += 1;
			}

		}
	}

	// withdraw all one or two or three-tile rivers
	int count;
	for (i=1; i<riverId; i++) {
		count = 0;
		for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if ( rivers[j].class == i ) {
				count++;
			}
		}
		if (count <= 3) {
			printf("river %d has %d tiles. withdraw\n", i, count);
			for (j=0; j<riverCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
				if (
					rivers[j].class == i
				) {
					rivers[j].class = -1;
					continue;
				}
			}
		}
	}

	placeLakes();

	// segmentation of river-units:
	/*
	inflow
		1 = mountain
		2 = lake
	outflow
		1 = edge
		2 = lake
	*/
	for (i=0; i<riverGroupCount; i++) {

		for (j=0; j<riverCount; j++) {
			if (rivers[j].from == riverGroups[i].begin) {
				riverSegmentation(1, j, 1);
			}
		}

		for (j=0; j<riverCount; j++) {
			if (rivers[j].from == riverGroups[i].end) {
				// printf("+++ riverGroups end %d\n", riverGroups[i].end+1);
				riverSegmentation(2, j, 1);
			}
		}

	}
	// for (i=0; i<riverGroupCount; i++) {
	// 	printf("+++ +++ riverGroups begin %d | riverGroups end %d\n", riverGroups[i].begin+1, riverGroups[i].end+1);
	// }
	// for (i=0; i<riverCount; i++) {
	// 	printf("--- --- tile %d | inflow %d | outflow %d\n", rivers[i].from+1, rivers[i].inflow, rivers[i].outflow);
	// }
	for (i=0; i<riverCount; i++) {
		for (j=0; j<tileCount; j++) { // would be nice to do it with coord_map but it does not return id of tile yet.
			if (
				rivers[i].from == j &&
				rivers[i].class >= 0 &&
				rivers[i].inflow == 2 &&
				rivers[i].outflow == 2
			) {
				// printf("--- --- tile %d to be lake | inflow %d | outflow %d\n", j+1, rivers[i].inflow, rivers[i].outflow);
				tiles[j].land = 1;
				rivers[i].class = -1;
			}
		}
	}


	FILE *f;
	fopen("rivers.json", "w"); // clear file
	f = fopen("rivers.json", "w+");

	int realRiverCount = 0;
	for (i=0; i<riverCount; i++) {
		if (rivers[i].class == -1) {
			continue;
		}
		realRiverCount++;
		fprintf(f, "{\"f\":%d, \"t\":%d},\n", rivers[i].from, rivers[i].to);
	}

	fseek(f, -2, SEEK_CUR); // remove commas
	fprintf(f, "\n\n");

	fclose(f);

	printf("river-tiles: %d\n", realRiverCount);
	return 0;
}

int main(int argc, char *argv[]) {

	if (argc >= 3 && argv[1] && argv[2]) {
		sscanf (argv[1], "%d", &maxTileCount);
		sscanf (argv[2], "%f", &powProb);
		if (argv[3]) {
			sscanf (argv[3], "%d", &fillGapsBool);
		}
		if (argv[4]) {
			sscanf (argv[4], "%Lf", &heightProb);
		}
		if (argv[5]) {
			sscanf (argv[5], "%Lf", &irrigateProb);
		}
	} else {
		return 1;
	}

	coord_map_init(&map);

	unsigned long seed = mix(clock(), time(NULL), getpid());
	srand(seed);

	tiles = calloc(tilesCap, sizeof(struct Tile));

	// this is the root node
	tiles[0].id = 1;
	tiles[0].parent = 0;
	tiles[0].generation = 0;
	tiles[0].x = 0;
	tiles[0].y = 0;
	coord_map_set(&map, 0, 0, 1);
	// root node end

	if (tileTree() != 0) {
		printf("stop enforced\n");
	}

	printf("tile count: %d\n", tileCount);

	if (fillGapsBool == 1) {
		fillGaps();
	}

	if (fillGapsBool == 1 && argv[4]) {
		corrugateMap();
	}

	int d;
	char filename[] = "rivers.json";
	fopen(filename, "w");
	d = remove("rivers.json");

	if (fillGapsBool == 1 && argv[4] && argv[5]) {
		irrigateMap();
	}

	FILE *f;

	fopen("tiles.json", "w"); // clear file
	f = fopen("tiles.json", "w+");

	int i = 0;
	for (i=0; i<tileCount; i++) {
		fprintf(f, "{\"x\":%d, \"y\":%d, \"h\":%d, \"l\":%d},\n", tiles[i].x, tiles[i].y, tiles[i].height, tiles[i].land);
	}

	fseek(f, -2, SEEK_CUR); // remove commas
	fprintf(f, "\n\n");

	fclose(f);

	free( tiles );
	free( rivers );
	free( borderTiles );
	return 0;

}