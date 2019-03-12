window.onload = function() {
	
	// Cross browser screen size
	const screenWidth = (window.innerWidth
		|| document.documentElement.clientWidth
		|| document.body.clientWidth) - 5;

	const screenHeight = (window.innerHeight
		|| document.documentElement.clientHeight
		|| document.body.clientHeight) - 5;

	
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

	class Item {
		constructor(name, isCraftable, requiredToCraft, description, placesAsTile, canEat, hungerFill) {
			this.name = name;
			this.isCraftable = isCraftable;
			this.requiredToCraft = requiredToCraft;
			this.description = description;
			this.placesAsTile = placesAsTile;
			this.canEat = canEat;
			this.hungerFill = hungerFill;
		}

		getRequiredToCraftString() {
			let string = `${this.name}: `;
			for (let i in Object.keys(this.requiredToCraft)) {
				string += `${Object.keys(this.requiredToCraft)[i]}: ${this.requiredToCraft[Object.keys(this.requiredToCraft)[i]]}, `;
			}
			return string.substring(0, string.length - 2);
		}
	}

	class Screen {
		static clear(canvas) {
			//Clear the canvas to avoid drawing over the last frame
			let context = canvas.getContext('2d');
			context.clearRect(0, 0, canvas.width, canvas.height);
			Screen.drawRect(canvas, canvas.height,canvas.width,0,0,'white');
		}

		static drawImg(canvas, width, height, x, y, image) {
			//Draw an image with the given parameters
			let context = canvas.getContext('2d');
			context.drawImage(image, x, y, width, height);
		}

		static drawRect(canvas, width, height, x , y, color) {
			//Draw function with rotation if provided
			let context = canvas.getContext('2d');
			context.save();
			context.fillStyle = color;
			context.translate(x,y);
			context.rotate(0);
			context.fillRect(0, 0, width, height);
			context.restore();
		}
		
		static drawText(canvas, string, x, y, color = 'black', font = 'Times New Roman', size = 26) {
			//Draw function for text
			let context = canvas.getContext('2d');
			context.save();
			context.fillStyle = color;
			context.font = `${size}px ${font}`;
			context.fillText(string, x, y);
			context.restore();
		}
	}

	class Hud extends Screen {
		draw(canvas) {
			Object.keys(player.inventory).forEach(function(key, index) {
				if (key === Object.keys(player.inventory)[player.selectedItem]) {
					Screen.drawText(canvas, `-> ${key}: ${player.inventory[key]}`, 0, 20 + (index * 20));
				} else {
					Screen.drawText(canvas, `${key}: ${player.inventory[key]}`, 0, 20 + (index * 20));
				}
			});
			Screen.drawText(canvas, `Hunger: ${player.hunger}`, 0, screenHeight - 25);
		}
	}

	class Map extends Screen {
		constructor(xTileNo, yTileNo) {
			super();
			this.xTileNo = xTileNo;
			this.yTileNo = yTileNo;
			this.tileGrid = [];

			// Build the 2d map array and add base grass
			for (let x = 0; x < xTileNo; x++) {
				this.tileGrid.push([]);
				for (let y = 0; y < yTileNo; y++) {
					this.tileGrid[x].push(['grass']);
				}
			}

			// Draw tiles which crop up randomly in the map
			this.drawRandomlyAcrossMap('grassRock', 10);
			this.drawRandomlyAcrossMap('carrot', 0.1);

			// Draw Villages
			this.drawRandomVillages(randBounds(4, 6), 2, 5);

			//Draw random squares on the map, the order is important
			this.drawRandomSquares('dirt', randBounds(4, 10), 1, 15, 70, 100);
			this.drawRandomSquares('water', randBounds(4, 10), 1, 15, 100, 100);
			this.drawRandomSquares('tree', randBounds(4, 10), 1, 15, 30, 50);
			this.drawRandomSquares('rock', randBounds(4, 10), 1, 5, 30, 50);
			this.drawRandomSquares('ironRock', randBounds(4, 6), 1, 5, 30, 50);

			//Draw random lines on the map
			this.drawRandomLines('dirt', randBounds(5, 10), 1, this.xTileNo);
			this.drawRandomLines('water', randBounds(5, 10), 1, this.yTileNo);

			// Remove any tiles behind a tile that is a background tile on the screen
			// Saves memory and number of draw operations per frame when rendered
			for (let x = 0; x < this.xTileNo; x++) {
				for (let y = 0; y < this.yTileNo; y++) {
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

		drawRandomlyAcrossMap(tile, percentChance) {
			for (let x = 0; x < this.xTileNo; x++) {
				for (let y = 0; y < this.yTileNo; y++) {
					if (randBounds(0, 100) <= percentChance) {
						this.addTileAt(x, y, tile);
					}
				}
			}
		}

		drawRandomVillages(number, minRadius, maxRadius) {
			for (let i  = 0; i < number; i++) {
				this.drawVillage(randBounds(0, this.xTileNo), randBounds(0, this.yTileNo), randBounds(minRadius, maxRadius));
			}
		}

		drawVillage(x, y, radius) {
			this.drawSquare(x, y, radius, 'dirt', 100);
			this.addTileAt(x, y, 'campFire');
			this.drawSquare(x, y, radius, 'woodShelter', 10);
		}

		isInBounds(x, y) {
			return (x >= 0 && x <= this.xTileNo && y >= 0 && y <= this.yTileNo) ? true : false;
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
				this.drawSquare(randBounds(0, this.xTileNo), randBounds(0, this.yTileNo), randBounds(minSize, maxSize), tile, randBounds(minPercentCoverage, maxPercentCoverage));
			}
		}

		drawSquare(x, y, radius, tile, percentCoverage) {
			//draw a square to the map at x and y with tile and a radius
			for (let i = x - radius; i < x + radius; i++) {
				for (let j = y - radius; j < y + radius; j++) {
					if ((i < this.xTileNo) && (j < this.yTileNo) && (i >= 0) && (j >= 0) && (randBounds(0, 100) <= percentCoverage)) {
						this.addTileAt(i, j, tile);
					}
				}
			}
		}
		
		drawRandomLines(tile, number, minLength, maxLength) {
			for (let i = 0; i < number; i++) {
				this.drawLine(randBounds(0, this.xTileNo), randBounds(0, this.yTileNo), randBounds(minLength, maxLength), tile, Math.random() >= 0.5);
			}
		}
		
		drawLine(startX, startY, length, tile, horizontal) {
			//Draw a line on the map starting at startX and startY with the selected tile
			//Horizontal line
			if (horizontal) {
				for (let i = startY; i < startY + length; i++) {
					if (i < this.yTileNo) {
						this.addTileAt(startX, i, tile);
					}
				}
			} else {
				//Vertical line
				for (let i = startX; i < startX + length; i++) {
					if (i < this.xTileNo) {
						this.addTileAt(i, startY, tile);
					}
				}
			}
		}

		render(canvas, centerX, centerY) {
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
						Screen.drawImg(canvas, tileWidth, tileHeight, (x - (centerX - viewWidth)) * tileWidth, (y - (centerY - viewHeight)) * tileHeight, tiles[this.tileGrid[x][y][z]].sprite);
					}
				}
			}
			//Draw the player
			Screen.drawImg(canvas, tileWidth, tileHeight, (player.x - (centerX - viewWidth)) * tileWidth, (player.y - (centerY - viewHeight)) * tileHeight, player.sprite);

			// Draw the npcs
			for (let i = 0; i < npcNo; i++) {
				npcs[i].move();
				Screen.drawImg(canvas, tileWidth, tileHeight, (npcs[i].x - (centerX - viewWidth)) * tileWidth, (npcs[i].y - (centerY - viewWidth)) * tileHeight, npcs[i].sprite);
			}
		}
	}

	class CraftScreen extends Screen {
		constructor() {
			super();
			this.selectedItem = 1;
			this._keyBindings = {87: 'up', 83: 'down', 32: 'spaceBar'};
		}

		hasKey(key) {
			return (player.crafting && this._keyBindings[key]) ? true : false;
		}

		handleKey(key) {
			if (this._keyBindings[key] === 'up' && this.selectedItem > 0) {
				this.selectedItem --;
			} else if (this._keyBindings[key] === 'down' && this.selectedItem < (Object.keys(items).length - 1)) {
				this.selectedItem ++;
			} else if (this._keyBindings[key] === 'spaceBar' && player.canCraft(Object.keys(items)[this.selectedItem])) {
				player.craft(Object.keys(items)[this.selectedItem]);
			}
		}

		draw(canvas) {
			let selectedItem = this.selectedItem;
			let index = 0;
			for (let key in items) {
				let color = player.canCraft(key) ? 'green' : 'red';
				let canCraftString = player.canCraft(key)? 'Craft away!' : 'Not enough materials';
				if (index === selectedItem) {
					Screen.drawText(canvas, `-> ${items[key].getRequiredToCraftString()}`, 0, 20 + (index * 20), color);
					Screen.drawText(canvas, canCraftString, screenWidth / 2 - 260, 50);
					Screen.drawText(canvas, `${items[key].description}`, screenWidth / 2 - 260, 100);
				} else {
					Screen.drawText(canvas, items[key].getRequiredToCraftString(), 0, 20 + (index * 20), color);
				}
				index ++;
			}
		}
	}

	class GameObject {
		constructor(x, y, sprite, moveCooldown) {
			this.x = x;
			this.y = y;
			this.sprite = new Image(tileWidth, tileHeight);
			this.sprite.src = sprite;
			this.moveCooldown = moveCooldown;
			this.moveCounter = this.moveCooldown;
		}

		move(x, y) {
			if (this.moveCounter === 0) {
				this.moveCounter = this.moveCooldown;
				if (map.isInBounds(this.x + x, this.y + y) && map.getTopTileAt(this.x + x, this.y + y).canWalkOver) {
					this.x += x;
					this.y += y;
					return true;
				}
			} else {
				this.moveCounter--;
			}
			return false;
		}
	}

	class Player extends GameObject {
		constructor(moveCooldown) {
			super(randBounds(0, map.xTileNo), randBounds(0, map.yTileNo), 'assets/player.png', moveCooldown);
			this.inventory = {};
			this.facing = 'up';
			this._directions = {'up': {dX: 0, dY: -1}, 'right': {dX: 1, dY: 0}, 'left': {dX: -1, dY: 0}, 'down': {dX: 0, dY: 1}};
			this._keyBindings = {87: 'up', 38: 'up', 68: 'right', 39: 'right', 65: 'left', 37: 'left', 83: 'down', 40: 'down'};
			this.crafting = false;
			this.selectedItem = 0;
			this.hunger = 1000;

			this.canCraft = this.canCraft.bind(this);
		}

		move(x, y) {
			if (super.move(x, y)) {
				this.hunger--;
			}
		}

		getTileInFront() {
			return {x: this.x + this._directions[this.facing].dX, y: this.y + this._directions[this.facing].dY};
		}

		placeItem(item) {
			if (this.inventory[item] && this.inventory[item] > 0) {
				this.inventory[item]--;
				map.addTileAt(this.getTileInFront().x, this.getTileInFront().y, items[item].placesAsTile);
			}
		}

		craft(item) {
			this.addToInventory(item, 1);
			for (let i in Object.keys(items[item].requiredToCraft)) {
				this.inventory[Object.keys(items[item].requiredToCraft)[i]] -= items[item].requiredToCraft[Object.keys(items[item].requiredToCraft)[i]];
			}
		}

		canCraft(item) {
			let inventory = this.inventory;
			let craft = true;
			Object.keys(items[item].requiredToCraft).forEach(function(key) {
				if (!inventory[key] || !(inventory[key] >= items[item].requiredToCraft[key])) {
					craft = false;
				}
			});
			return craft;
		}

		hasKey(key) {
			return ((key === 67) || (!this.crafting && (this._keyBindings[key] || key === 69 || key === 67 || key === 81 || key === 188 || key === 190))) ? true : false;
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

		eat(item) {
			if (this.inventory[item] && this.inventory[item] > 0) {
				this.hunger += items[item].hungerFill;
				this.inventory[item]--;
			}
		}

		handleKey(key) {
			if (key === 69) {
				this.destroyTile(this.x + this._directions[this.facing].dX, this.y + this._directions[this.facing].dY);
			} else if (key === 67) {
				this.crafting = !this.crafting;
			} else if (key === 81) {
				if (items[Object.keys(this.inventory)[this.selectedItem]].placesAsTile) {
					this.placeItem(Object.keys(this.inventory)[this.selectedItem]);
				} else if (items[Object.keys(this.inventory)[this.selectedItem]].canEat) {
					this.eat(Object.keys(this.inventory)[this.selectedItem]);
				}
			} else if (key === 188) {
				if (this.selectedItem > 0) {
					this.selectedItem--;
				}
			} else if (key === 190) {
				if (this.selectedItem < Object.keys(this.inventory).length - 1) {
					this.selectedItem++;
				}
			} else {
				if (this.facing === this._keyBindings[key]) {
					this.move(this._directions[this._keyBindings[key]].dX, this._directions[this._keyBindings[key]].dY);
				} else {
					this.facing = this._keyBindings[key];
				}
			}
		}

		addToInventory(item, number) {
			player.inventory[item] ? player.inventory[item] += number : player.inventory[item] = number;
		}
	}

	class Npc extends GameObject {
		constructor(x, y, sprite, moveCooldown) {
			super(x, y, sprite, moveCooldown);
		}

		move() {
			super.move(randBounds(-1, 3), randBounds(-1, 3));
		}
	}

	document.addEventListener('keydown', function(e) {
		//Up
		// Inner if statment checks player is in bounds and the next tile can be walked over
		if (player.hasKey(e.keyCode)) {
			player.handleKey(e.keyCode);
		}
		if (craftScreen.hasKey(e.keyCode)) {
			craftScreen.handleKey(e.keyCode);
		}
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

		tick() {
			Screen.clear(this.canvas);
			if (player.crafting) {
				craftScreen.draw(this.canvas);
			} else {
				map.render(this.canvas, player.x, player.y);
				hud.draw(this.canvas);
			}
		}
	}

	const tiles = {
		dirt: new Tile('dirt', true, 'assets/dirt.png', false, false, false, false, true, true),
		grass: new Tile('grass', true, 'assets/grass.png', false, false, false, false, true, true),
		water: new Tile('water', true, 'assets/water.png', false, false, false, false, true, false),
		tree: new Tile('tree', false, 'assets/tree.png', true, 'halfTree', 'wood', 2, false, false),
		halfTree: new Tile('halfTree', false, 'assets/halfTree.png', true, false, 'wood', 2, false, false),
		halfRock: new Tile('halfRock', false, 'assets/halfRock.png', true, false, 'stone', 2, false, false),
		rock: new Tile('rock', false, 'assets/rock.png', true, 'halfRock', 'stone', 2, false, false),
		ironRock: new Tile('ironRock', false, 'assets/ironRock.png', true, 'rock', 'iron', 1, false, false),
		grassRock: new Tile('grassRock', true, 'assets/grassRock.png', true, 'grass', false, 2, true, true),
		campFire: new Tile('campFire', false, 'assets/campFire.png', false, false, false, false, false, false),
		woodShelter: new Tile('woodShelter', false, 'assets/woodShelter.png', false, false, false, false, false, false),
		carrot: new Tile('carrot', true, 'assets/carrot.png', true, 'grass', 'carrot', 1, false, false),
	};

	const items = {
		campFire: new Item('Camp Fire', true, {wood: 4}, 'A nice cosy campfire', 'campFire', false, false),
		stoneAxe: new Item('Stone Axe', true, {wood: 2, stone: 2}, 'A sharp flint axe', false, false, false),
		stonePickaxe: new Item('Stone Pickaxe', true, {wood:2, stone: 2}, 'A tough stone pickaxe', false, false, false),
		woodShelter: new Item('Wooden Shelter', true, {wood: 10}, 'A shelter... for sheltering in', 'woodShelter', false, false),
		carrot: new Item('Carrot', false, false, 'A tasty carrot', false, true, 10)
	};

	const hud = new Hud();

	const map = new Map(200, 200);

	const craftScreen = new CraftScreen();

	const npcNo = randBounds(100, 101);
	let npcs = [];
	for (let i = 0; i < npcNo; i++) {
		npcs[i] = new Npc(randBounds(0, map.xTileNo), randBounds(0, map.yTileNo), './assets/npc.png', randBounds(100, 200));
	}

	const player = new Player(10);

	const game = new Game();

	function randBounds(min, max) {
		//get a random integer between min and max
		return Math.floor((Math.random() * max) + min);
	}
};
