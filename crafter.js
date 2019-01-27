window.onload = function() {
	
	// Cross browser screen size
	const screenWidth = window.innerWidth
		|| document.documentElement.clientWidth
		|| document.body.clientWidth;

	const screenHeight = window.innerHeight
		|| document.documentElement.clientHeight
		|| document.body.clientHeight;

	
	const mapSize = 100;
	const viewHeight = 6;
	const viewWidth = 8;
	const tileWidth = screenWidth / (1 + (viewWidth * 2));
	const tileHeight = screenHeight / (1 + (viewHeight * 2));
	let lastKey = "up";

	class Tile {
		constructor (name, canWalkOver, sprite) {
			this.name = name;
			this.canWalkOver = canWalkOver;
			this.sprite = new Image(tileWidth, tileHeight);
			this.sprite.src = sprite;
		}
	}

	const tiles = {
		dirt: new Tile("dirt", true, "assets/dirt.png"),
		grass: new Tile("grass", true, "assets/grass.png"),
		water: new Tile("water", true, "assets/water.png"),
		tree: new Tile("tree", false, "assets/tree.png"),
		rock: new Tile("rock", false, "assets/rock.png"),
		grassRock: new Tile("grassRock", true, "assets/grassRock.png")
	};

	class Hud {
		constructor() {

		}

		draw() {
			game.drawText("(1)Tree: 1", 0, 20);
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
						this.tileGrid[i].push("grass");
					} else {
						this.tileGrid[i].push("grassRock");
					}
				}
			}
			//Draw random squares on the map
			this.drawRandomSquares("dirt", randBounds(4, 10), 1, 15)
			this.drawRandomSquares("water", randBounds(4, 10), 1, 15);
			this.drawRandomSquares("tree", randBounds(4, 10), 1, 15);

			//Draw random lines on the map
			this.drawRandomLines("water", randBounds(5, 10), 1, mapSize);
			this.drawRandomLines("dirt", randBounds(5, 10), 1, mapSize);
		}

		drawRandomSquares(tile, number, minSize, maxSize) {
			for (let i = 0; i < number; i++) {
				this.drawSquare(randBounds(0, mapSize), randBounds(0, mapSize), randBounds(minSize, maxSize), tile);
			}
		}

		drawSquare(x, y, radius, tile) {
			//draw a square to the map at x and y with tile and a radius
			for (let i = x - radius; i < x + radius; i++) {
				for (let j = y - radius; j < y + radius; j++) {
					if ((i < mapSize) && (j < mapSize) && (i >= 0) && (j >= 0)) {
						this.tileGrid[i][j] = tile;
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
						this.tileGrid[startX][i] = tile;
					}
				}
			} else {
				//Vertical line
				for (let i = startX; i < startX + length; i++) {
					if (i < mapSize) {
						this.tileGrid[i][startY] = tile;
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
			for (let i = centerX - viewWidth; i < centerX + viewWidth; i++) {
				for (let j = centerY - viewHeight; j < centerY + viewHeight; j++) {
					game.drawImg(tileWidth, tileHeight, (i - (centerX - viewWidth)) * tileWidth, (j - (centerY - viewHeight)) * tileHeight, tiles[this.tileGrid[i][j]].sprite);
				}
			}
			//Draw the player
			game.drawImg(tileWidth, tileHeight, (player.x - (centerX - viewWidth)) * tileWidth, (player.y - (centerY - viewHeight)) * tileHeight, player.getSprite());
		}
	}

	const map = new Map();

	class GameObject {
		constructor(x, y, color) {
			this.x = x;
			this.y = y;
			this.color = color;
		}
	}

	class Player extends GameObject {
		constructor() {
			super(randBounds(0, mapSize), randBounds(0, mapSize), "black");
			this.sprites = [];
			this.addSprite("assets/player.png", tileWidth, tileHeight);
			this.addSprite("assets/playerWater.png", tileWidth, tileHeight);
			this.addSprite("assets/playerDirt.png", tileWidth, tileHeight);
		}

		addSprite(image, width, height) {
			this.sprites.push(new Image(width, height));
			this.sprites[this.sprites.length - 1].src = image;
		}

		getSprite() {
			switch(map.tileGrid[this.x][this.y]) {
				case "water":
					return this.sprites[1];
				case "dirt":
					return this.sprites[2];
				default:
					return this.sprites[0];
			}
		}
	}

	const player = new Player();

	document.addEventListener('keydown', function(e) {
		//Up
		// Inner if statment checks player is in bounds and the next tile can be walked over
		if (e.keyCode == 87 || e.keyCode == 38) {
			if ((player.y > 0) && (tiles[map.tileGrid[player.x][player.y - 1]].canWalkOver)) {
				player.y -= 1;
			}
			lastKey = "up";
		} 
		//Right
		if (e.keyCode == 68 || e.keyCode == 39) {
			if ((player.x < mapSize - 1) && (tiles[map.tileGrid[player.x + 1][player.y]].canWalkOver)) {
				player.x += 1;
			}
			lastKey = "right";
		}
		//Left
		if (e.keyCode == 65 || e.keyCode == 37) {
			if ((player.x > 0) && (tiles[map.tileGrid[player.x - 1][player.y]].canWalkOver)) {
				player.x -= 1;
			}
			lastKey = "left";
		}
		//Down
		if (e.keyCode == 83 || e.keyCode == 40) {
			if ((player.y < mapSize - 1) && (tiles[map.tileGrid[player.x][player.y + 1]].canWalkOver)) {
				player.y += 1;
			}
			lastKey = "down";
		}
		//e (Action key)
		if (e.keyCode == 69) {
			lastKey === "up" ? map.tileGrid[player.x][player.y - 1] = 1 :
			lastKey == "down" ? map.tileGrid[player.x][player.y + 1] = 1 :
			lastKey == "left" ? map.tileGrid[player.x - 1][player.y] = 1 :
			map.tileGrid[player.x + 1][player.y] = 1;
		}
		//1
		if (e.keyCode == 49) {
			if (lastKey == "up" && map.tileGrid[player.x][player.y - 1] == 1) {
				map.tileGrid[player.x][player.y - 1] = 4;
			}
			if (lastKey == "down" && map.tileGrid[player.x][player.y + 1] == 1) {
				map.tileGrid[player.x][player.y + 1] = 4;
			}
			if (lastKey == "left" && map.tileGrid[player.x - 1][player.y] == 1) {
				map.tileGrid[player.x - 1][player.y] = 4;
			}
			if (lastKey == "right" && map.tileGrid[player.x + 1][player.y] == 1) {
				map.tileGrid[player.x + 1][player.y] = 4;
			}
		}
		console.log(player.x);
		console.log(player.y);
		console.log(map.tileGrid[player.x][player.y]);
		console.log(tiles[map.tileGrid[player.x][player.y]]);
	});

	class Game {
		constructor() {
			this.canvas = document.createElement("canvas");
			this.canvas.width = screenWidth - 100;
			this.canvas.height = screenHeight;
			this.context = this.canvas.getContext("2d");
			document.body.insertBefore(this.canvas, document.body.childNodes[0]);
			this.tick = this.tick.bind(this);
			this.interval = setInterval(this.tick, 20);
		}

		clear() {
			//Clear the canvas to avoid drawing over the last frame
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.draw(this.canvas.height,this.canvas.width,0,0,"white");
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
			this.context.font = "16px Verdana";
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
