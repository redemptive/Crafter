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
		constructor (name, canWalkOver, sprite, destructible, destroysTo, dropItem, dropAmount, isBackground, isStackable) {
			this.name = name;
			this.canWalkOver = canWalkOver;
			this.sprite = new Image(tileWidth, tileHeight);
			this.sprite.src = sprite;
			this.dropItem = dropItem;
			this.destroysTo = destroysTo;
			this.destructible = destructible;
			this.dropAmount = dropAmount;
			this.isBackground = isBackground;
			this.isStackable = isStackable;
		}
	}

	const tiles = {
		dirt: new Tile('dirt', true, 'assets/dirt.png', false, false, false, false, true, true),
		grass: new Tile('grass', true, 'assets/grass.png', false, false, false, false, true, true),
		water: new Tile('water', true, 'assets/water.png', false, false, false, false, true, false),
		tree: new Tile('tree', false, 'assets/tree.png', true, 'halfTree', 'wood', 10, false, false),
		halfTree: new Tile('halfTree', false, 'assets/halfTree.png', true, false, 'wood', 10, false, false),
		halfRock: new Tile('halfRock', false, 'assets/halfRock.png', true, false, 'rock', 10, false, false),
		rock: new Tile('rock', false, 'assets/rock.png', true, 'halfRock', 'rock', 10, false, false),
		ironRock: new Tile('ironRock', false, 'assets/ironRock.png', true, 'rock', 'iron', 1, false, false),
		grassRock: new Tile('grassRock', true, 'assets/grassRock.png', true, 'grass', false, 2, true, true)
	};

	class Hud {
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
			//Draw random squares on the map, the order is important
			this.drawRandomSquares('dirt', randBounds(4, 10), 1, 15, 70, 100);
			this.drawRandomSquares('water', randBounds(4, 10), 1, 15, 100, 100);
			this.drawRandomSquares('tree', randBounds(4, 10), 1, 15, 30, 50);
			this.drawRandomSquares('rock', randBounds(4, 10), 1, 5, 30, 50);
			this.drawRandomSquares('ironRock', randBounds(4, 6), 1, 5, 30, 50);

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

		isInBounds(x, y) {
			if (x >= 0 && x <= mapSize && y >= 0 && y <= mapSize) {
				return true;
			} else {
				return false;
			}
		}

		destroyTopTileAt(x, y) {
			let destroyTile = this.getTopTileAt(x, y);
			this.tileGrid[x][y].pop();
			if (destroyTile.destroysTo) {
				this.tileGrid[x][y].push(destroyTile.destroysTo);
			}
			return destroyTile;
		}

		getTopTileAt(x, y) {
			return tiles[this.tileGrid[x][y][this.tileGrid[x][y].length - 1]];
		}

		addTileAt(x, y, tile) {
			if (this.getTopTileAt(x, y).isStackable) {
				this.tileGrid[x][y].push(tile);
			}
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
						this.addTileAt(i, j, tile);
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
						this.addTileAt(startX, i, tile);
					}
				}
			} else {
				//Vertical line
				for (let i = startX; i < startX + length; i++) {
					if (i < mapSize) {
						this.addTileAt(i, startY, tile);
					}
				}
			}
		}

		render(centerX, centerY) {
			// Find where the camera should be centered
			// If the player is near the edge of the map don't move the camera out of map bounds
			if (centerX + viewWidth >= this.tileGrid[0].length) {
				centerX = (this.tileGrid[0].length - 1) - viewWidth;
			} else if (centerX - viewWidth < 0) {
				centerX = viewWidth;
			}
			if (centerY + viewHeight >= this.tileGrid[1].length) {
				centerY = (this.tileGrid[1].length - 1) - viewHeight;
			} else if (centerY - viewHeight < 0) {
				centerY = viewHeight;
			}

			// Loop through the 2d tile grid and draw all the tile sprites
			for (let x = centerX - viewWidth; x <= centerX + viewWidth; x++) {
				for (let y = centerY - viewHeight; y <= centerY + viewHeight; y++) {
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

		move(x, y) {
			if (map.isInBounds(this.x + x, this.y + y) && map.getTopTileAt(this.x + x, this.y + y).canWalkOver) {
				this.x += x;
				this.y += y;
			}
		}
	}

	class Player extends GameObject {
		constructor() {
			super(randBounds(0, mapSize), randBounds(0, mapSize), 'assets/player.png');
			this.inventory = {};
			this.facing = 'up';
			this._directions = {'up': {dX: 0, dY: -1}, 'right': {dX: 1, dY: 0}, 'left': {dX: -1, dY: 0}, 'down': {dX: 0, dY: 1}};
			this._keyBindings = {87: 'up', 38: 'up', 68: 'right', 39: 'right', 65: 'left', 37: 'left', 83: 'down', 40: 'down'};
		}

		hasKey(key) {
			if (this._keyBindings[key] || key === 69) {
				return true;
			} else {
				return false;
			}
		}

		destroyTile(tileX, tileY) {
			let destroyedTile = false;
			if (map.getTopTileAt(tileX, tileY).destructible) {
				destroyedTile = map.destroyTopTileAt(tileX, tileY);
			}
			if (destroyedTile && destroyedTile.dropItem) {
				this.addToInventory(destroyedTile.dropItem, destroyedTile.dropAmount);
			}
		}

		handleKey(key) {
			if (key === 69) {
				this.destroyTile(this.x + this._directions[this.facing].dX, this.y + this._directions[this.facing].dY);
			} else {
				this.move(this._directions[this._keyBindings[key]].dX, this._directions[this._keyBindings[key]].dY);
				this.facing = this._keyBindings[key];
			}
		}

		addToInventory(item, number) {
			player.inventory[item] ? player.inventory[item] += number : player.inventory[item] = number;
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
		if (player.hasKey(e.keyCode)) {
			player.handleKey(e.keyCode);
		}
		console.log(player.x);
		console.log(player.y);
		console.log(map.tileGrid[player.x][player.y]);
		console.log(tiles[map.tileGrid[player.x][player.y]]);
	});

	class Game {
		constructor() {
			this.canvas = document.createElement('canvas');
			this.canvas.width = screenWidth;
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
