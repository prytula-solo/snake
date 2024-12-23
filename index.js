var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

//Задала розміри field для змійки
canvas.width = 500;
canvas.height = 500;

var width = canvas.width;
var height = canvas.height;

//Ігрова сітка
var blockSize = 20;
var widthInBlocks = Math.floor(width / blockSize);
var heightInBlocks = Math.floor(height / blockSize);

var score = 0;
var playerName = "";
var intervalId;
var gameSpeed = 40;  //швидкість змійки
var speedIncrease = 3; //зміна швидкості з кожним з'їденим яблуком
var isPaused = false;

var gameMusic = document.getElementById("gameMusic");

var gameOver = function (name, score) {
    gameMusic.pause();
    gameMusic.currentTime = 0;
    
    pauseButton.style.display = "none";
    clearInterval(intervalId);

    //текст game over
    ctx.font = "60px Open Sans";
    ctx.fillStyle = "Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", width / 2, height / 3);

    //зберегти рекорди
    var scores = JSON.parse(localStorage.getItem("snakeScores")) || [];
    scores.push({ name: name, score: score });
    scores.sort((a, b) => b.score - a.score); 
    localStorage.setItem("snakeScores", JSON.stringify(scores));

    //текст топ переможців
    ctx.font = "20px Open Sans";
    ctx.fillText("TOP Winners:", width / 2, height / 2);
    
    //показати топ 3 переможців
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

    //кнопка почати спочатку
    var restartButton = document.createElement("button");
    restartButton.textContent = "Restart Game";
    restartButton.classList.add("game-button", "restart-button");
    document.body.appendChild(restartButton);

    restartButton.addEventListener("click", function() {
        restartButton.remove();
        startGame();
    });
};

//розміри сірого field для змійки
var drawBorder = function () {
    ctx.fillStyle = "Grey";
    ctx.fillRect(0, 0, width, blockSize); //верх
    ctx.fillRect(0, height - blockSize, width, blockSize);  //низ
    ctx.fillRect(0, 0, blockSize, height);  //зліва
    ctx.fillRect(width - blockSize, 0, blockSize, height);  //справа
};

//score зліва зверху
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

//змійка
var Snake = function () {
    this.segments = [
        new Block(7,5),  //голова
        new Block(6,5),  //тіло
        new Block(5,5),  //хвіст
    ];
    this.direction = "right";
    this.nextDirection = "right";
};

Snake.prototype.draw = function () {
    for (var i = 0; i< this.segments.length; i++) {
        this.segments[i].drawSquare("#00FF00");
    }
};

//рухи змійки
Snake.prototype.move = function () {
    var head = this.segments[0];
    var newHead;

    this.direction = this.nextDirection;

    //рухи голови
    if (this.direction === "right") {
        newHead = new Block(head.col + 1, head.row);
        if (newHead.col >= widthInBlocks - 1) {
            newHead = new Block(1, head.row); //наліво
        }
    } else if (this.direction === "down") {
        newHead = new Block(head.col, head.row + 1);
        if (newHead.row >= heightInBlocks - 1) {
            newHead = new Block(head.col, 1); //наверх
        }
    } else if (this.direction === "left") {
        newHead = new Block(head.col - 1, head.row);
        if (newHead.col <= 0) {
            newHead = new Block(widthInBlocks - 2, head.row); //направо
        }
    } else if (this.direction === "up") {
        newHead = new Block(head.col, head.row - 1);
        if (newHead.row <= 0) {
            newHead = new Block(head.col, heightInBlocks - 2); //вниз
        }
    }

    if (this.checkCollision(newHead)) {
        gameOver(playerName, score);
        return;
    }

    this.segments.unshift(newHead);

    //удар об яблуко
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

//удар об себе
Snake.prototype.checkCollision = function (head) {
    var selfCollision = false;
    for (var i = 1; i < this.segments.length; i++) {
        if (head.equal(this.segments[i])) {
            selfCollision = true;
        }
    }
    return selfCollision;
};

//щоб не повернулась сама в себе
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

//поява яблука в рандомному місці
Apple.prototype.move = function () {
    var randomCol = Math.floor(Math.random() * (widthInBlocks - 2)) + 1;
    var randomRow = Math.floor(Math.random() * (heightInBlocks - 2)) + 1;
    this.position = new Block(randomCol, randomRow);
};

var snake = new Snake();
var apple = new Apple();

var startGame = function() {
    isPaused = false;
    pauseButton.style.display = "block";
    pauseButton.textContent = "Pause";
    
    gameMusic.play();
    
    if (!playerName) {
        playerName = prompt("Enter your name:", "Player") || "Player";
    }
    
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

//клавіатура
var directions = {
    37: "left",
    38: "up",
    39: "right",
    40: "down"
};

var keysPressed = {};

//рухи змійки завдяки клавішам
$("body").keydown(function (event) {
    keysPressed[event.keyCode] = true;
    
    if (keysPressed[38]) {
        snake.setDirection("up");
    }
    if (keysPressed[40]) {
        snake.setDirection("down");
    }
    if (keysPressed[37]) {
        snake.setDirection("left");
    }
    if (keysPressed[39]) {
        snake.setDirection("right");
    }
});

$("body").keyup(function (event) {
    delete keysPressed[event.keyCode];
});

//почати гру
var startButton = document.createElement("button");
startButton.textContent = "Start Game";
startButton.classList.add("game-button", "start-button");
document.body.appendChild(startButton);

startButton.addEventListener("click", function() {
    startButton.style.display = "none";
    startGame();
});

//зупинити гру
var pauseButton = document.createElement("button");
pauseButton.textContent = "Pause";
pauseButton.classList.add("game-button", "pause-button");
document.body.appendChild(pauseButton);

pauseButton.addEventListener("click", function() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Continue" : "Pause";
    
    if (!isPaused) {
        gameMusic.play();
        
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
        gameMusic.pause();
        
        clearInterval(intervalId);
    }
});

ctx.fillStyle = "rgba(0, 50, 0, 0.5)";
ctx.fillRect(0, 0, width, height);
drawBorder();