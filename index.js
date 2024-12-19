var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

var width = canvas.width;
var height = canvas.height;

var blockSize = 20;
var widthInBlocks = width / blockSize;
var heightInBlocks = height / blockSize;

var score = 0;
var playerName = "";

var intervalId;
var gameSpeed = 60;
var speedIncrease = 4;

var gameOver = function (name, score) {
    clearInterval(intervalId);

    ctx.font = "60px Courier";
    ctx.fillStyle = "Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", width / 2, height / 3);

var scores = JSON.parse(localStorage.getItem("snakeScores")) || [];
scores.push({ name: name, score: score });
scores.sort((a, b) => b.score - a.score); 
    
    localStorage.setItem("snakeScores", JSON.stringify(scores));

    ctx.font = "20px Courier";
    ctx.fillText("Winner:", width / 2, height / 2);
    
    let validScores = scores.filter(record => Number.isInteger(record.score));

    if (validScores.length > 3) { 
        validScores = validScores.slice(0, 3);
    }

    validScores.forEach((record, index) => {
        ctx.fillText(
            `${index + 1}. ${record.name}: ${record.score}`,
            width / 2, 
            (height / 2) + 30 + (index * 25)
        );
    });
};


var drawBorder = function () {
    ctx.fillStyle = "Gray";
    ctx.fillRect(0,0, width, blockSize);
    ctx.fillRect(0, height - blockSize, width, blockSize);
    ctx.fillRect(0,0, blockSize, height);
    ctx.fillRect(width - blockSize, 0, blockSize, height);
};

var drawScore = function () {
    ctx.font = "20px Courier";
    ctx.fillStyle = "Black";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score:" + score, blockSize, blockSize);
};

var circle = function (x, y, radius, fillCircle) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    if (fillCircle) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
};

var Block = function (col, row) {
    this.col = col;
    this.row = row;
};

Block.prototype.drawSquare = function (color) {
    var x = this.col * blockSize;
    var y = this.row * blockSize;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockSize, blockSize);
};

Block.prototype.drawCircle = function (color) {
    var centerX = this.col * blockSize + blockSize / 2;
    var centerY = this.row * blockSize + blockSize / 2;
    ctx.fillStyle = color;
    circle(centerX, centerY, blockSize / 2, true);
};

Block.prototype.equal = function (otherBlock) {
    return this.col === otherBlock.col && this.row === otherBlock.row;
};

var Snake = function () {
    this.segments = [
        new Block(7,5),
        new Block(6,5),
        new Block(5,5),
    ];

    this.direction = "right";
    this.nextDirection = "right";
};

Snake.prototype.draw = function () {
    for (var i = 0; i< this.segments.length; i++) {
        this.segments[i].drawSquare("Blue");
    }
};

Snake.prototype.move = function () {
    var head = this.segments[0];
    var newHead;

    this.direction = this.nextDirection;

    if (this.direction === "right") {
        newHead = new Block(head.col + 1, head.row);
    } else if (this.direction === "down") {
        newHead = new Block(head.col, head.row +1);
    } else if (this.direction === "left") {
        newHead = new Block(head.col -1, head.row);
    } else if (this.direction === "up") {
        newHead = new Block(head.col, head.row -1);
    }
    
    if (this.checkCollision(newHead)) {
        gameOver(playerName, score);
        return;
    }

    this.segments.unshift(newHead);

    if (newHead.equal(apple.position)) {
        score++;
        apple.move();
        gameSpeed = Math.max(40, gameSpeed - speedIncrease);
        clearInterval(intervalId);
        intervalId = setInterval(function () {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            drawScore();
            snake.move();
            snake.draw();
            apple.draw();
            drawBorder();
        }, gameSpeed);
    } else {
        this.segments.pop();
    }
};

Snake.prototype.checkCollision = function (head) {
    var leftCollision = (head.col === 0);
    var topCollision = (head.row === 0);
    var rightCollision = (head.col === widthInBlocks -1);
    var bottomCollision = (head.row === heightInBlocks -1);

    var wallCollision = leftCollision || topCollision ||
    rightCollision || bottomCollision;

    var selfCollision = false;

    for (var i = 0; i< this.segments.length; i++) {
        if (head.equal(this.segments[i])) {
            selfCollision = true;
        }
    }

    return wallCollision || selfCollision;
};

Snake.prototype.setDirection = function (newDirection) {
    if (this.direction === "up" && newDirection === "down") {
        return;
    } else if (this.direction === "right" && newDirection === "left") {
        return;
    } else if (this.direction === "down" && newDirection === "up") {
        return;
    } else if (this.direction === "left" && newDirection === "right") {
        return;
    }

    this.nextDirection = newDirection;
};

var Apple = function () {
    this.position = new Block(10,10);
};

Apple.prototype.draw = function () {
    this.position.drawCircle("LimeGreen");
};

Apple.prototype.move = function () {
    var randomCol = Math.floor(Math.random() *
(widthInBlocks - 2)) +1;
    var randomRow = Math.floor(Math.random() *
(heightInBlocks - 2)) +1;
this.position = new Block(randomCol, randomRow);
};

var snake = new Snake();
var apple = new Apple();


var startGame = function() {
    playerName = prompt("Enter your name:", "Player") || "Player";
    snake = new Snake();
    apple = new Apple();
    score = 0;
    gameSpeed = 100;
    
    intervalId = setInterval(function () {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        drawScore();
        snake.move();
        snake.draw();
        apple.draw();
        drawBorder();
    }, gameSpeed);
};

var directions = {
    37: "left",
    38: "up",
    39: "right",
    40: "down"
};

$("body").keydown(function (event) {
    var newDirection = directions[event.keyCode];
    if (newDirection !== undefined) {
        snake.setDirection(newDirection);
    }
});

startGame();