$(document).ready(function() {

	var map = [];
	var tileSize = 25;
	var mapSize = 20;
	var tiles = [
		"brown",
		"green",
		"blue",
		"white",
	];

	var player = {
		xPos: 0,
		yPos: 0
	}

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
				gameArea.draw(tileSize,tileSize,i*tileSize,j*tileSize,tiles[map[i][j]]);
			}
		}
		gameArea.draw(tileSize, tileSize, player.xPos * tileSize, player.yPos * tileSize,"black");
	}

	function initiateMap() {
		for (var i = 0; i < mapSize;i++) {
			map.push([]);
			for (var j = 0; j < mapSize;j++) {
				map[i].push(1);
			}
		}
		drawMapSquare(12,10,randBounds(2,5),2);
		drawMapSquare(6,6,3,3);
	}

	function updateGameArea() {
		gameArea.clear();
		drawMap();
	}

	gameArea.start();
	startGame();

});