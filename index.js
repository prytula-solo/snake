var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 500;

var width = canvas.width;
var height = canvas.height;

var blockSize = 20;
var widthInBlocks = Math.floor(width / blockSize);
var heightInBlocks = Math.floor(height / blockSize);

var score = 0;
var playerName = "";

var intervalId;
var gameSpeed = 40;
var speedIncrease = 3;

var gameOver = function (name, score) {
    clearInterval(intervalId);

    ctx.font = "60px Open Sans";
    ctx.fillStyle = "Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", width / 2, height / 3);

    var scores = JSON.parse(localStorage.getItem("snakeScores")) || [];
    scores.push({ name: name, score: score });
    scores.sort((a, b) => b.score - a.score); 
    
    localStorage.setItem("snakeScores", JSON.stringify(scores));

    ctx.font = "20px Open Sans";
    ctx.fillText("TOP Winners:", width / 2, height / 2);
    
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

    var restartButton = document.createElement("button");
    restartButton.textContent = "Restart Game";
    restartButton.style.backgroundColor = "grey";
    restartButton.style.borderRadius = "10px";
    restartButton.style.position = "absolute";
    restartButton.style.left = "50%";
    restartButton.style.top = (height / 2) + 200 + "px";
    restartButton.style.transform = "translateX(-50%)";
    restartButton.style.padding = "10px 20px";
    restartButton.style.font = " 20 px Open Sans";
    restartButton.style.cursor = "pointer";
    document.body.appendChild(restartButton);

    restartButton.addEventListener("click", function() {
        restartButton.remove();
        startGame();
    });
};

//////////////////////////
var drawBorder = function () {
    ctx.fillStyle = "Grey";
    ctx.fillRect(0, 0, width, blockSize);
    ctx.fillRect(0, height - blockSize, width, blockSize);
    ctx.fillRect(0, 0, blockSize, height);
    ctx.fillRect(width - blockSize, 0, blockSize, height);
};

var drawScore = function () {
    ctx.font = "20px Open Sans";
    ctx.fillStyle = "Black";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score: " + score, blockSize*1.2, blockSize/10);
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
        this.segments[i].drawSquare("#00FF00");
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
            ctx.fillStyle = "rgba(0, 50, 0, 0.5)";
            ctx.fillRect(0, 0, width, height);
            snake.move();
            snake.draw();
            apple.draw();
            drawBorder();
            drawScore();
        }, gameSpeed);
    } else {
        this.segments.pop();
    }
};
////////////////////////////
Snake.prototype.checkCollision = function (head) {
    var leftCollision = (head.col === 0);
    var topCollision = (head.row === 0);
    var rightCollision = (head.col === widthInBlocks - 1);
    var bottomCollision = (head.row === heightInBlocks - 1);

    var wallCollision = leftCollision || topCollision ||
    rightCollision || bottomCollision;

    var selfCollision = false;

    for (var i = 0; i < this.segments.length; i++) {
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
    this.position.drawCircle("Red");
};

Apple.prototype.move = function () {
    var randomCol = Math.floor(Math.random() * (widthInBlocks - 2)) + 1;
    var randomRow = Math.floor(Math.random() * (heightInBlocks - 2)) + 1;
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
        ctx.fillStyle = "rgba(0, 50, 0, 0.5)";
        ctx.fillRect(0, 0, width, height);
        snake.move();
        snake.draw();
        apple.draw();
        drawBorder();
        drawScore();
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

var startButton = document.createElement("button");
startButton.textContent = "Start Game";
startButton.style.backgroundColor = "grey";
startButton.style.borderRadius = "10px";
startButton.style.position = "absolute";
startButton.style.left = "50%";
startButton.style.top = "50%";
startButton.style.transform = "translate(-50%, -50%)";
startButton.style.padding = "10px 20px";
startButton.style.font = "20px Open Sans";
startButton.style.cursor = "pointer";
document.body.appendChild(startButton);

startButton.addEventListener("click", function() {
    startButton.style.display = "none"; // Hide button when game starts
    startGame();
});

// Initial canvas setup
ctx.fillStyle = "rgba(0, 50, 0, 0.5)";
ctx.fillRect(0, 0, width, height);
drawBorder();