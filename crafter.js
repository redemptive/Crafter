$(document).ready(function() {

	var map = [];
	var mapSize = 40;
	var tileSize = 25;
	var slowdownCounter = 0;
	var tiles = [
		{color: "brown", canWalkOver: false},
		{color: "green", canWalOver: true},
		{color: "blue", canWalkOver: true},
		{color: "brown", canWalkOver: true},
	];

	var player = {
		xPos: 0,
		yPos: 0,
		color: "black"
	};

	//87 & 38 = up, 68 & 39 = right, 65 & 40 = down, 83 & 37 = left, 80 = pause
	var keyMap = {87: false, 38: false, 68: false, 39: false, 65: false, 40: false, 83: false, 37: false, 80: false};
	
	$(document).keydown(function(e) {
		if (e.keyCode in keyMap) {
			keyMap[e.keyCode] = true;
			if (paused && e.keyCode == 80) {
				paused = false;
			} else if (!paused && e.keyCode == 80){
				paused = true;
			}
		}
	}).keyup(function(e) {
		if (e.keyCode in keyMap) {
			keyMap[e.keyCode] = false;
		}
	});

	var gameArea = {
			canvas : document.createElement("canvas"),
			start : function () {
				this.canvas.width = mapSize * tileSize;
				this.canvas.height = mapSize * tileSize;
				this.context = this.canvas.getContext("2d");
				document.body.insertBefore(this.canvas,document.body.childNodes[0]);
				this.interval = setInterval(updateGameArea, 20);
			},
			clear : function () {
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
			}
		};

	function initPlayer() {
		player.xPos = randBounds(0,mapSize);
		player.yPos = randBounds(0,mapSize);
	}

	function randBounds(min, max) {
		return Math.floor((Math.random() * max) + min);
	}
		
	function startGame() {
		initiateMap();
		initPlayer();
	}

	function drawMapSquare(x, y, radius, tile) {
		for (var i = x - radius; i < x + radius; i++) {
			for (var j = y - radius; j < y + radius; j++) {
				map[i][j] = tile;
			}
		}
	}

	function drawMap() {
		for (var i = 0; i < map[0].length;i++) {
			for (var j = 0; j < map[1].length;j++) {
				gameArea.draw(tileSize,tileSize,i*tileSize,j*tileSize,tiles[map[i][j]].color);
			}
		}
		gameArea.draw(tileSize, tileSize, player.xPos * tileSize, player.yPos * tileSize,player.color);
	}

	function initiateMap() {
		for (var i = 0; i < mapSize;i++) {
			map.push([]);
			for (var j = 0; j < mapSize;j++) {
				map[i].push(1);
			}
		}
		drawMapSquare(randBounds(5,mapSize - 5),randBounds(5,mapSize - 5),randBounds(2,5),2);
		drawMapSquare(6,6,randBounds(2,5),3);
	}

	function checkMovement() {
		if (keyMap[87] || keyMap[38]) {
			if (player.yPos > 0) {
				player.yPos -= 1;
			}
		} 
		if (keyMap[68] || keyMap[39]) {
			if (player.xPos < mapSize - 1) {
				player.xPos += 1;
			}
		}
		if (keyMap[65] || keyMap[37]) {
			if (player.xPos > 0) {
				player.xPos -= 1;
			}
		}
		if (keyMap[83] || keyMap[40]) {
			if (player.yPos < mapSize - 1) {
				player.yPos += 1;
			}
		}
	}

	function updateGameArea() {
		if (slowdownCounter > 10) {
			checkMovement();
			slowdownCounter = 0;
		} else {
			slowdownCounter ++;
		}
		gameArea.clear();
		drawMap();
	}

	gameArea.start();
	startGame();

});