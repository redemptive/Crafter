window.onload = function() {
	
	// Cross browser screen size
	const screenWidth = window.innerWidth
		|| document.documentElement.clientWidth
		|| document.body.clientWidth;

	const screenHeight = window.innerHeight
		|| document.documentElement.clientHeight
		|| document.body.clientHeight;

	
	const mapSize = 100;
	const viewHeight = 5;
	const viewWidth = 7;
	const tileWidth = screenWidth / (1 + (viewWidth * 2));
	const tileHeight = screenHeight / (1 + (viewHeight * 2));

	class Tile {
		constructor (name, canWalkOver, sprite, destructible, destroysTo, dropItem, dropAmount, isBackground) {
			this.name = name;
			this.canWalkOver = canWalkOver;
			this.sprite = new Image(tileWidth, tileHeight);
			this.sprite.src = sprite;
			this.dropItem = dropItem;
			this.destroysTo = destroysTo;
			this.destructible = destructible;
			this.dropAmount = dropAmount;
			this.isBackground = isBackground;
		}
	}

	const tiles = {
		dirt: new Tile('dirt', true, 'assets/dirt.png', false, false, false, false, true),
		grass: new Tile('grass', true, 'assets/grass.png', false, false, false, false, true),
		water: new Tile('water', true, 'assets/water.png', false, false, false, false, true),
		tree: new Tile('tree', false, 'assets/tree.png', true, 'halfTree', 'wood', 10, false),
		halfTree: new Tile('halfTree', false, 'assets/halfTree.png', true, 'grass', 'wood', 10, false),
		rock: new Tile('rock', false, 'assets/rock.png', true, 'grass', 'rock', 10, false),
		grassRock: new Tile('grassRock', true, 'assets/grassRock.png', true, 'grass', 2, true)
	};

	class Hud {
		constructor() {

		}

		draw() {
			Object.keys(player.inventory).forEach(function(key, index) {
				game.drawText(`${key}: ${player.inventory[key]}`, 0, 20 + (index * 20));
			});
		}
	}

	const hud = new Hud();

	class Map {
		constructor() {
			this.height = 100;
			this.width = 100;
			this.tileGrid = [];

			// Build the 2d map array and add base grass and grassRock
			for (let i = 0; i < mapSize; i++) {
				this.tileGrid.push([]);
				for (let j = 0; j < mapSize; j++) {
					if (randBounds(0, 10) > 1) {
						this.tileGrid[i].push(['grass']);
					} else {
						this.tileGrid[i].push(['grassRock']);
					}
				}
			}
			//Draw random squares on the map
			this.drawRandomSquares('dirt', randBounds(4, 10), 1, 15, 70, 100);
			this.drawRandomSquares('water', randBounds(4, 10), 1, 15, 100, 100);
			this.drawRandomSquares('tree', randBounds(4, 10), 1, 15, 30, 50);
			this.drawRandomSquares('rock', randBounds(4, 10), 1, 5, 30, 50);

			//Draw random lines on the map
			this.drawRandomLines('dirt', randBounds(5, 10), 1, mapSize);
			this.drawRandomLines('water', randBounds(5, 10), 1, mapSize);

			// Remove any tiles behind a tile that is a background tile on the screen
			// Saves memory and number of draw operations per frame when rendered
			for (let x = 0; x < mapSize; x++) {
				for (let y = 0; y < mapSize; y++) {
					let lowestBackground = 0;
					for (let z = 0; z < this.tileGrid[x][y].length; z++) {
						if (tiles[this.tileGrid[x][y][z]].isBackground) {
							lowestBackground = z;
						}
					}
					this.tileGrid[x][y] = this.tileGrid[x][y].splice(lowestBackground, this.tileGrid[x][y].length);
				}
			}

		}

		getTopTileAt(x, y) {
			return this.tileGrid[x][y][this.tileGrid[x][y].length - 1];
		}

		drawRandomSquares(tile, number, minSize, maxSize, minPercentCoverage, maxPercentCoverage) {
			for (let i = 0; i < number; i++) {
				this.drawSquare(randBounds(0, mapSize), randBounds(0, mapSize), randBounds(minSize, maxSize), tile, randBounds(minPercentCoverage, maxPercentCoverage));
			}
		}

		drawSquare(x, y, radius, tile, percentCoverage) {
			//draw a square to the map at x and y with tile and a radius
			for (let i = x - radius; i < x + radius; i++) {
				for (let j = y - radius; j < y + radius; j++) {
					if ((i < mapSize) && (j < mapSize) && (i >= 0) && (j >= 0) && (randBounds(0, 100) <= percentCoverage)) {
						this.tileGrid[i][j].push(tile);
					}
				}
			}
		}
		
		drawRandomLines(tile, number, minLength, maxLength) {
			for (let i = 0; i < number; i++) {
				this.drawLine(randBounds(0, mapSize), randBounds(0, mapSize), randBounds(minLength, maxLength), tile, Math.random() >= 0.5);
			}
		}
		
		drawLine(startX, startY, length, tile, horizontal) {
			//Draw a line on the map starting at startX and startY with the selected tile
			//Horizontal line
			if (horizontal) {
				for (let i = startY; i < startY + length; i++) {
					if (i < mapSize) {
						this.tileGrid[startX][i].push(tile);
					}
				}
			} else {
				//Vertical line
				for (let i = startX; i < startX + length; i++) {
					if (i < mapSize) {
						this.tileGrid[i][startY].push(tile);
					}
				}
			}
		}

		render(centerX, centerY) {
			// Find where the camera should be centered
			// If the player is near the edge of the map don't move the camera out of map bounds
			if (centerX + viewWidth > this.tileGrid[0].length) {
				centerX = this.tileGrid[0].length - viewWidth;
			} else if (centerX - viewWidth < 0) {
				centerX = viewWidth;
			}
			if (centerY + viewHeight > this.tileGrid[1].length) {
				centerY = this.tileGrid[1].length - viewHeight;
			} else if (centerY - viewHeight < 0) {
				centerY = viewHeight;
			}

			// Loop through the 2d tile grid and draw all the tile sprites
			for (let x = centerX - viewWidth; x < centerX + viewWidth; x++) {
				for (let y = centerY - viewHeight; y < centerY + viewHeight; y++) {
					for (let z in this.tileGrid[x][y]) {
						game.drawImg(tileWidth, tileHeight, (x - (centerX - viewWidth)) * tileWidth, (y - (centerY - viewHeight)) * tileHeight, tiles[this.tileGrid[x][y][z]].sprite);
					}
				}
			}
			//Draw the player
			game.drawImg(tileWidth, tileHeight, (player.x - (centerX - viewWidth)) * tileWidth, (player.y - (centerY - viewHeight)) * tileHeight, player.sprite);

			// Draw the npcs
			for (let i = 0; i < npcNo; i++) {
				game.drawImg(tileWidth, tileHeight, (npcs[i].x - (centerX - viewWidth)) * tileWidth, (npcs[i].y - (centerY - viewWidth)) * tileHeight, npcs[i].sprite);
			}
		}
	}

	const map = new Map();

	class GameObject {
		constructor(x, y, sprite) {
			this.x = x;
			this.y = y;
			this.sprite = new Image(tileWidth, tileHeight);
			this.sprite.src = sprite;
		}
	}

	class Player extends GameObject {
		constructor() {
			super(randBounds(0, mapSize), randBounds(0, mapSize), 'assets/player.png');
			this.inventory = {};
			this.facing = 'up';
		}

		addToInventory(item, number) {
			if (player.inventory[item]) {
				player.inventory[item] += number;
			} else {
				player.inventory[item] = number;
			}
		}
	}

	class Npc extends GameObject {
		constructor(x, y, sprite) {
			super(x, y, sprite);
		}
	}

	const npcNo = randBounds(5, 10);
	let npcs = [];
	for (let i = 0; i < npcNo; i++) {
		npcs[i] = new Npc(randBounds(0, mapSize), randBounds(0, mapSize), './assets/npc.png');
	}

	const player = new Player();

	document.addEventListener('keydown', function(e) {
		//Up
		// Inner if statment checks player is in bounds and the next tile can be walked over
		if (e.keyCode == 87 || e.keyCode == 38) {
			if ((player.y > 0) && (tiles[map.getTopTileAt(player.x, player.y - 1)].canWalkOver)) {
				player.y -= 1;
			}
			player.facing = 'up';
		} 
		//Right
		if (e.keyCode == 68 || e.keyCode == 39) {
			if ((player.x < mapSize - 1) && (tiles[map.getTopTileAt(player.x + 1, player.y)].canWalkOver)) {
				player.x += 1;
			}
			player.facing = 'right';
		}
		//Left
		if (e.keyCode == 65 || e.keyCode == 37) {
			if ((player.x > 0) && (tiles[map.getTopTileAt(player.x - 1, player.y)].canWalkOver)) {
				player.x -= 1;
			}
			player.facing = 'left';
		}
		//Down
		if (e.keyCode == 83 || e.keyCode == 40) {
			if ((player.y < mapSize - 1) && (tiles[map.getTopTileAt(player.x, player.y + 1)].canWalkOver)) {
				player.y += 1;
			}
			player.facing = 'down';
		}
		//e (Action key)
		if (e.keyCode == 69) {
			let targetTile = false;
			if (player.facing == 'up' && tiles[map.getTopTileAt(player.x, player.y - 1)].destructible) {
				targetTile = tiles[map.getTopTileAt(player.x, player.y - 1)];
				map.tileGrid[player.x][player.y - 1].push(targetTile.destroysTo);
			}
			if (player.facing == 'down' && tiles[map.getTopTileAt(player.x, player.y + 1)].destructible) {
				targetTile = tiles[map.getTopTileAt(player.x, player.y + 1)];
				map.tileGrid[player.x][player.y + 1].push(targetTile.destroysTo);
			}
			if (player.facing == 'left' && tiles[map.getTopTileAt(player.x - 1, player.y)].destructible) {
				targetTile = tiles[map.getTopTileAt(player.x - 1, player.y)];
				map.tileGrid[player.x - 1][player.y].push(targetTile.destroysTo);
			}
			if (player.facing == 'right' && tiles[map.getTopTileAt(player.x + 1, player.y)].destructible) {
				targetTile = tiles[map.getTopTileAt(player.x + 1, player.y)];
				map.tileGrid[player.x + 1][player.y].push(targetTile.destroysTo);
			}
			if (targetTile && targetTile.dropItem) {
				player.addToInventory(targetTile.dropItem, targetTile.dropAmount);
			}
		}
		console.log(player.x);
		console.log(player.y);
		console.log(map.tileGrid[player.x][player.y]);
		console.log(tiles[map.tileGrid[player.x][player.y]]);
	});

	class Game {
		constructor() {
			this.canvas = document.createElement('canvas');
			this.canvas.width = screenWidth - 100;
			this.canvas.height = screenHeight;
			this.context = this.canvas.getContext('2d');
			document.body.insertBefore(this.canvas, document.body.childNodes[0]);
			this.tick = this.tick.bind(this);
			this.interval = setInterval(this.tick, 20);
		}

		clear() {
			//Clear the canvas to avoid drawing over the last frame
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.draw(this.canvas.height,this.canvas.width,0,0,'white');
		}

		draw(width, height, x , y, color) {
			//Draw function with rotation if provided
			this.context.save();
			this.context.fillStyle = color;
			this.context.translate(x,y);
			this.context.rotate(0);
			this.context.fillRect(0, 0, width, height);
			this.context.restore();
		}

		drawText(theString, x, y) {
			//Draw function for text
			this.context.save();
			this.context.font = '16px Verdana';
			this.context.fillText(theString, x, y);
			this.context.restore();
		}

		drawImg(width, height, x, y, image) {
			//Draw an image with the given parameters
			this.context.drawImage(image, x, y, width, height);
		}

		tick() {
			this.clear();
			map.render(player.x, player.y);
			hud.draw();
		}
	}

	const game = new Game();

	function randBounds(min, max) {
		//get a random integer between min and max
		return Math.floor((Math.random() * max) + min);
	}
};
