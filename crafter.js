$(document).ready(function() {

	const map = [];
	const mapSize = 100;
	const tileSize = 30;
	const viewHeight = 10;
	const viewWidth = 10;
	const playerImg = [];
	var lastKey = "up";
	const tiles = [
		{color: "brown", canWalkOver: true},
		{color: "green", canWalkOver: true},
		{color: "blue", canWalkOver: true},
		{color: "brown", canWalkOver: true},
		{color: false, canWalkOver: false, asset: 0},
		{color: false, canWalkOver: false, asset: 1},
		{color: false, canWalkOver: true, asset: 2}
	];

	class Player {
		constructor() {
			this.xPos = 0;
			this.yPos = 0;
			this.color = "black";
		}

		getSprite() {
			switch(map[this.xPos][this.yPos]) {
				case 0:
					return playerImg[2];
					break;
				case 2:
					return playerImg[1];
					break;
				default:
					return playerImg[0];
			}
		}
	}

	const player = new Player();

	const images = [];
	
	$(document).keydown(function(e) {
		//Up
		if (e.keyCode == 87 || e.keyCode == 38) {
			if (player.yPos > 0) {
				if (tiles[map[player.xPos][player.yPos - 1]].canWalkOver) {
					player.yPos -= 1;
				}
			}
			lastKey = "up";
		} 
		//Right
		if (e.keyCode == 68 || e.keyCode == 39) {
			if (player.xPos < mapSize - 1) {
				if (tiles[map[player.xPos + 1][player.yPos]].canWalkOver) {
					player.xPos += 1;
				}
			}
			lastKey = "right";
		}
		//Left
		if (e.keyCode == 65 || e.keyCode == 37) {
			if (player.xPos > 0) {
				if (tiles[map[player.xPos - 1][player.yPos]].canWalkOver) {
					player.xPos -= 1;
				}
			}
			lastKey = "left";
		}
		//Down
		if (e.keyCode == 83 || e.keyCode == 40) {
			if (player.yPos < mapSize - 1) {
				if (tiles[map[player.xPos][player.yPos + 1]].canWalkOver) {
					player.yPos += 1;
				}
			}
			lastKey = "down";
		}
		//e
		if (e.keyCode == 69) {
			if (lastKey == "up") {
				map[player.xPos][player.yPos - 1] = 1;
			}
			if (lastKey == "down") {
				map[player.xPos][player.yPos + 1] = 1;
			}
			if (lastKey == "left") {
				map[player.xPos - 1][player.yPos] = 1;
			}
			if (lastKey == "right") {
				map[player.xPos + 1][player.yPos] = 1;
			}
		}
		//1
		if (e.keyCode == 49) {
			if (lastKey == "up" && map[player.xPos][player.yPos - 1] == 1) {
				map[player.xPos][player.yPos - 1] = 4;
			}
			if (lastKey == "down" && map[player.xPos][player.yPos + 1] == 1) {
				map[player.xPos][player.yPos + 1] = 4;
			}
			if (lastKey == "left" && map[player.xPos - 1][player.yPos] == 1) {
				map[player.xPos - 1][player.yPos] = 4;
			}
			if (lastKey == "right" && map[player.xPos + 1][player.yPos] == 1) {
				map[player.xPos + 1][player.yPos] = 4;
			}
		}
		console.log(player.xPos);
		console.log(player.yPos);
		console.log(map[player.xPos][player.yPos]);
		console.log(tiles[map[player.xPos][player.yPos]]);
	});

	const gameArea = {
		canvas : document.createElement("canvas"),
		start : function () {
			//Initiate the game area
			this.canvas.width = (viewWidth * 2) * tileSize;
			this.canvas.height = (viewHeight * 2) * tileSize;
			this.context = this.canvas.getContext("2d");
			document.body.insertBefore(this.canvas,document.body.childNodes[0]);
			this.interval = setInterval(updateGameArea, 20);
		},
		clear : function () {
			//Clear the canvas to avoid drawing over the last frame
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.draw(this.canvas.height,this.canvas.width,0,0,"white");
		},
		draw : function (height,width,x,y,color,rotation = 0) {
			//Draw function with rotation if provided
			this.context.save();
			this.context.fillStyle = color;
			this.context.translate(x,y);
			this.context.rotate(rotation);
			this.context.fillRect(0, 0, width, height);
			this.context.restore();
		},
		drawText : function (theString, x, y, size = 16) {
			//Draw function for text
			this.context.save();
			this.context.font = size + "px Verdana";
			this.context.fillText(theString, x, y);
			this.context.restore();
		},
		drawImg : function (width, height, x, y, image) {
			//Draw an image with the given parameters
			this.context.drawImage(image, x, y, width, height);
		}
	};

	function getAssets() {
		//Get all the images from the assets folder
		playerImg.push(new Image(tileSize, tileSize));
		playerImg[0].src = "assets/player.png";
		playerImg.push(new Image(tileSize, tileSize));
		playerImg[1].src = "assets/playerWater.png";
		playerImg.push(new Image(tileSize, tileSize));
		playerImg[2].src = "assets/playerDirt.png";
		images.push(new Image(tileSize, tileSize));
		images[0].src = "assets/tree.png";
		images.push(new Image(tileSize, tileSize));
		images[1].src = "assets/rock.png";
		images.push(new Image(tileSize, tileSize));
		images[2].src = "assets/grassRock.png";
	}

	function initPlayer() {
		//Give the player a random position when the game starts and the function is called
		player.xPos = randBounds(0,mapSize);
		player.yPos = randBounds(0,mapSize);
	}

	function randBounds(min, max) {
		//get a random integer between min and max
		return Math.floor((Math.random() * max) + min);
	}
		
	function startGame() {
		initMap();
		initPlayer();
	}

	function drawMapSquare(x, y, radius, tile) {
		//draw a square to the map at x and y with tile and a radius
		for (var i = x - radius; i < x + radius; i++) {
			for (var j = y - radius; j < y + radius; j++) {
				map[i][j] = tile;
			}
		}
	}

	function drawRiver(startX, startY, endX, endY) {
		var currentX = startX;
		var currentY = startY;
		for (var i = startX; i < endX; i++) {
			// if (startY)
			// map[i][j] = 2;
		}
	}

	function drawMapLine(startX, startY, tile, horizontal) {
		//Draw a line on the map starting at startX and startY with the selected tile
		//Horizontal line
		if (horizontal) {
			for (var i = startY; i < map[0].length; i++) {
				map[startX][i] = tile;
			}
		} else {
			//Vertical line
			for (var i = startX; i < map[0].length; i++) {
				map[i][startY] = tile;
			}
		}
	}

	function renderMap(centerX, centerY) {
		//Go through the map array and draw all the tiles to the canvas
		//make sure the camera doesn't go out of bounds for drawing the map array
		if (centerX + viewWidth > map[0].length) {
			centerX = map[0].length - viewWidth;
		} else if (centerX - viewWidth < 0) {
			centerX = viewWidth;
		}
		if (centerY + viewHeight > map[1].length) {
			centerY = map[1].length - viewHeight;
		} else if (centerY - viewHeight < 0) {
			centerY = viewHeight;
		}
		for (var i = centerX - viewWidth; i < centerX + viewWidth;i++) {
			for (var j = centerY - viewHeight; j < centerY + viewHeight;j++) {
				//if the tile is a plain colour tile
				if (tiles[map[i][j]].color != false) {
					gameArea.draw(tileSize,tileSize,(i - (centerX - viewWidth))*tileSize,(j - (centerY - viewHeight))*tileSize,tiles[map[i][j]].color);
				} else {
					//If the tile is an image asset draw with draw image
					gameArea.drawImg(tileSize, tileSize, (i - (centerX - viewWidth))*tileSize,(j - (centerY - viewHeight))*tileSize, images[tiles[map[i][j]].asset]);
				}
			}
		}
		//Draw the player
		gameArea.drawImg(tileSize, tileSize, (player.xPos - (centerX - viewWidth)) * tileSize, (player.yPos - (centerY - viewWidth)) * tileSize, player.getSprite());
		gameArea.drawText("(1)Tree: 1", 0, 20);
	}

	function initMap() {
		//Fill the map array with grass at tiles[1]
		for (var i = 0; i < mapSize;i++) {
			map.push([]);
			for (var j = 0; j < mapSize;j++) {
				if (randBounds(0,10) > 1) {
					map[i].push(1);
				} else {
					map[i].push(6);
				}
			}
		}
		//Draw random squares on the map
		for (var i = 0; i < randBounds(10,15); i++) {
			drawMapSquare(randBounds(5,mapSize - 6),randBounds(5,mapSize - 6),randBounds(2,5),randBounds(0,tiles.length));
		}
		//Draw random lines on the map
		for (var i = 0; i < randBounds(2,4); i ++) {
			drawMapLine(randBounds(0,10),randBounds(0,10),randBounds(0,tiles.length),Math.random() >= 0.5);
		}
	}

	function updateGameArea() {
		gameArea.clear();
		renderMap(player.xPos,player.yPos);
	}

	//Start the game
	gameArea.start();
	getAssets();
	startGame();
});