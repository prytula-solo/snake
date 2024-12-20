// Canvas setup - Get the canvas element and its context for drawing
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Set canvas dimensions
canvas.width = 500;
canvas.height = 500;

// Store canvas dimensions for easier access
var width = canvas.width;
var height = canvas.height;

// Game grid configuration
var blockSize = 20;  // Size of each grid block in pixels
var widthInBlocks = Math.floor(width / blockSize);  // Number of blocks horizontally
var heightInBlocks = Math.floor(height / blockSize);  // Number of blocks vertically

// Game state variables
var score = 0;  // Player's current score
var playerName = "";  // Store player's name
var intervalId;  // Store game loop interval ID
var gameSpeed = 40;  // Initial game speed (milliseconds)
var speedIncrease = 3;  // Amount to increase speed by when eating apple
var isPaused = false;  // Track if game is paused

// Handle game over state and display final score
var gameOver = function (name, score) {
    pauseButton.style.display = "none";  // Hide pause button
    clearInterval(intervalId);  // Stop game loop

    // Display "Game Over" text
    ctx.font = "60px Open Sans";
    ctx.fillStyle = "Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", width / 2, height / 3);

    // Save and sort high scores
    var scores = JSON.parse(localStorage.getItem("snakeScores")) || [];
    scores.push({ name: name, score: score });
    scores.sort((a, b) => b.score - a.score); 
    localStorage.setItem("snakeScores", JSON.stringify(scores));

    // Display top winners
    ctx.font = "20px Open Sans";
    ctx.fillText("TOP Winners:", width / 2, height / 2);
    
    // Filter valid scores and show top 3
    let validScores = scores.filter(record => Number.isInteger(record.score));
    if (validScores.length > 3) { 
        validScores = validScores.slice(0, 3);
    }

    // Display each winner's score
    validScores.forEach((record, index) => {
        ctx.fillText(
            `${index + 1}. ${record.name}: ${record.score}`,
            width / 2, 
            (height / 2) + 30 + (index * 25)
        );
    });

    // Create and display restart button
    var restartButton = document.createElement("button");
    restartButton.textContent = "Restart Game";
    restartButton.classList.add("game-button", "restart-button");
    document.body.appendChild(restartButton);

    restartButton.addEventListener("click", function() {
        restartButton.remove();
        startGame();
    });
};

// Draw the game border
var drawBorder = function () {
    ctx.fillStyle = "Grey";
    ctx.fillRect(0, 0, width, blockSize);  // Top border
    ctx.fillRect(0, height - blockSize, width, blockSize);  // Bottom border
    ctx.fillRect(0, 0, blockSize, height);  // Left border
    ctx.fillRect(width - blockSize, 0, blockSize, height);  // Right border
};

// Draw the current score
var drawScore = function () {
    ctx.font = "20px Open Sans";
    ctx.fillStyle = "Black";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score: " + score, blockSize*1.2, blockSize/10);
};

// Helper function to draw circles
var circle = function (x, y, radius, fillCircle) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    if (fillCircle) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
};

// Block class - represents a single grid block
var Block = function (col, row) {
    this.col = col;
    this.row = row;
};

// Methods for Block class
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

// Snake class - represents the snake in the game
var Snake = function () {
    this.segments = [
        new Block(7,5),  // Head
        new Block(6,5),  // Body
        new Block(5,5),  // Tail
    ];
    this.direction = "right";
    this.nextDirection = "right";
};

// Draw the snake
Snake.prototype.draw = function () {
    for (var i = 0; i< this.segments.length; i++) {
        this.segments[i].drawSquare("#00FF00");
    }
};

// Move the snake and handle collisions
Snake.prototype.move = function () {
    var head = this.segments[0];
    var newHead;

    this.direction = this.nextDirection;

    // Calculate new head position based on direction
    if (this.direction === "right") {
        newHead = new Block(head.col + 1, head.row);
        if (newHead.col >= widthInBlocks - 1) {
            newHead = new Block(1, head.row); // Wrap to left side
        }
    } else if (this.direction === "down") {
        newHead = new Block(head.col, head.row + 1);
        if (newHead.row >= heightInBlocks - 1) {
            newHead = new Block(head.col, 1); // Wrap to top
        }
    } else if (this.direction === "left") {
        newHead = new Block(head.col - 1, head.row);
        if (newHead.col <= 0) {
            newHead = new Block(widthInBlocks - 2, head.row); // Wrap to right side
        }
    } else if (this.direction === "up") {
        newHead = new Block(head.col, head.row - 1);
        if (newHead.row <= 0) {
            newHead = new Block(head.col, heightInBlocks - 2); // Wrap to bottom
        }
    }

    // Check for collision with self
    if (this.checkCollision(newHead)) {
        gameOver(playerName, score);
        return;
    }

    this.segments.unshift(newHead);

    // Handle apple collision
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

// Check if snake collides with itself
Snake.prototype.checkCollision = function (head) {
    var selfCollision = false;
    for (var i = 1; i < this.segments.length; i++) {
        if (head.equal(this.segments[i])) {
            selfCollision = true;
        }
    }
    return selfCollision;
};

// Set snake's direction ensuring it can't reverse into itself
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

// Apple class - represents the apple in the game
var Apple = function () {
    this.position = new Block(10,10);
};

// Draw the apple
Apple.prototype.draw = function () {
    this.position.drawCircle("Red");
};

// Move apple to new random position
Apple.prototype.move = function () {
    var randomCol = Math.floor(Math.random() * (widthInBlocks - 2)) + 1;
    var randomRow = Math.floor(Math.random() * (heightInBlocks - 2)) + 1;
    this.position = new Block(randomCol, randomRow);
};

// Create initial snake and apple
var snake = new Snake();
var apple = new Apple();

// Initialize and start the game
var startGame = function() {
    isPaused = false;
    pauseButton.style.display = "block";
    pauseButton.textContent = "Pause";
    
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

// Map keyboard codes to directions
var directions = {
    37: "left",
    38: "up",
    39: "right",
    40: "down"
};

// Track currently pressed keys
var keysPressed = {};

// Handle keydown events for snake movement
$("body").keydown(function (event) {
    keysPressed[event.keyCode] = true;
    
    // Handle each direction independently
    if (keysPressed[38]) { // up
        snake.setDirection("up");
    }
    if (keysPressed[40]) { // down
        snake.setDirection("down");
    }
    if (keysPressed[37]) { // left
        snake.setDirection("left");
    }
    if (keysPressed[39]) { // right
        snake.setDirection("right");
    }
});

// Clear keys when released
$("body").keyup(function (event) {
    delete keysPressed[event.keyCode];
});

// Create and setup start button
var startButton = document.createElement("button");
startButton.textContent = "Start Game";
startButton.classList.add("game-button", "start-button");
document.body.appendChild(startButton);

startButton.addEventListener("click", function() {
    startButton.style.display = "none";
    startGame();
});

// Create and setup pause button
var pauseButton = document.createElement("button");
pauseButton.textContent = "Pause";
pauseButton.classList.add("game-button", "pause-button");
document.body.appendChild(pauseButton);

// Handle pause/resume functionality
pauseButton.addEventListener("click", function() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Continue" : "Pause";
    
    if (!isPaused) {
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
        clearInterval(intervalId);
    }
});

// Initial game board setup
ctx.fillStyle = "rgba(0, 50, 0, 0.5)";
ctx.fillRect(0, 0, width, height);
drawBorder();