$(document).ready(function() {

	var map = [];
	var mapSize = 100;
	var tileSize = 25;
	var paused = false;
	var viewHeight = 10;
	var viewWidth = 10;
	var tiles = [
		{color: "brown", canWalkOver: false},
		{color: "green", canWalOver: true},
		{color: "blue", canWalkOver: true},
		{color: "brown", canWalkOver: true},
		{color: false, canWalkOver: false, asset: 0},
		{color: false, canWalOver: false, asset: 1}
	];

	var player = {
		xPos: 0,
		yPos: 0,
		color: "black"
	};

	var images = [];
	
	$(document).keydown(function(e) {
		//Up
		if (e.keyCode == 87 || e.keyCode == 38) {
			if (player.yPos > 0) {
				player.yPos -= 1;
			}
		} 
		//Right
		if (e.keyCode == 68 || e.keyCode == 39) {
			if (player.xPos < mapSize - 1) {
				player.xPos += 1;
			}
		}
		//Left
		if (e.keyCode == 65 || e.keyCode == 37) {
			if (player.xPos > 0) {
				player.xPos -= 1;
			}
		}
		//Down
		if (e.keyCode == 83 || e.keyCode == 40) {
			if (player.yPos < mapSize - 1) {
				player.yPos += 1;
			}
		}
	});

	var gameArea = {
		canvas : document.createElement("canvas"),
		start : function () {
			//Initiate the game area
			this.canvas.width = (viewWidth * 2) * tileSize;
			this.canvas.height = (viewHeight * 2)* tileSize;
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
			this.context.drawImage(image, x, y, width, height);
		}
	};

	function getAssets() {
		images.push(new Image(tileSize, tileSize));
		images[0].src = "assets/tree.png";
		images.push(new Image(tileSize, tileSize));
		images[1].src = "assets/rock.png";
	}

	function initPlayer() {
		//Give the player a random position when the game starts and the function is called
		player.xPos = randBounds(0,mapSize);
		player.yPos = randBounds(0,mapSize);
	}

	function randBounds(min, max) {
		return Math.floor((Math.random() * max) + min);
	}
		
	function startGame() {
		initMap();
		initPlayer();
	}

	function drawMapSquare(x, y, radius, tile) {
		for (var i = x - radius; i < x + radius; i++) {
			for (var j = y - radius; j < y + radius; j++) {
				map[i][j] = tile;
			}
		}
	}

	function drawMap(centerX, centerY) {
		//Go through the map array and draw all the tiles to the canvas
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
				if (tiles[map[i][j]].color != false) {
					gameArea.draw(tileSize,tileSize,(i - (centerX - viewWidth))*tileSize,(j - (centerY - viewHeight))*tileSize,tiles[map[i][j]].color);
				} else {
					gameArea.drawImg(tileSize, tileSize, (i - (centerX - viewWidth))*tileSize,(j - (centerY - viewHeight))*tileSize, images[tiles[map[i][j]].asset]);
				}
			}
		}
		//Draw the player
		gameArea.draw(tileSize, tileSize, (player.xPos - (centerX - viewWidth)) * tileSize, (player.yPos - (centerY - viewWidth)) * tileSize,player.color);
	}

	function initMap() {
		//Fill the map array with grass at tiles[1]
		for (var i = 0; i < mapSize;i++) {
			map.push([]);
			for (var j = 0; j < mapSize;j++) {
				map[i].push(1);
			}
		}
		//Draw random squares on the map
		for (var i = 0; i < randBounds(10,15); i++) {
			drawMapSquare(randBounds(5,mapSize - 5),randBounds(5,mapSize - 5),randBounds(2,5),randBounds(0,tiles.length));
		}
	}

	function updateGameArea() {
		gameArea.clear();
		drawMap(player.xPos,player.yPos);
	}

	//Start the game
	gameArea.start();
	getAssets();
	startGame();

});