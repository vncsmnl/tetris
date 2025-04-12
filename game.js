class Tetris {
    constructor() {
        // Game constants
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        this.EMPTY = 'empty';

        // Game variables
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropInterval = null;
        this.dropSpeed = 1000; // Initial speed in ms

        // Tetromino shapes
        this.SHAPES = {
            I: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            J: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            L: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            O: [
                [1, 1],
                [1, 1]
            ],
            S: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            T: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            Z: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ]
        };

        this.COLORS = {
            I: 'tetromino-I',
            J: 'tetromino-J',
            L: 'tetromino-L',
            O: 'tetromino-O',
            S: 'tetromino-S',
            T: 'tetromino-T',
            Z: 'tetromino-Z'
        };

        // DOM elements
        this.gameBoard = document.getElementById('game-board');
        this.nextPieceDisplay = document.getElementById('next-piece');
        this.scoreDisplay = document.getElementById('score');
        this.levelDisplay = document.getElementById('level');
        this.linesDisplay = document.getElementById('lines');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.restartButton = document.getElementById('restart-button');
        this.shareButton = document.getElementById('share-button');
        this.startButton = document.getElementById('start-button');
        this.startOverlay = document.getElementById('start-overlay');

        // Initialize touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.createGameBoard();
        this.createNextPieceDisplay();
        this.resetGameState();
        this.startGameLoop();
        this.hideOverlays();
    }

    createGameBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.COLS}, ${this.BLOCK_SIZE}px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.ROWS}, ${this.BLOCK_SIZE}px)`;

        for (let row = 0; row < this.ROWS; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                this.board[row][col] = this.EMPTY;
                const cell = document.createElement('div');
                cell.id = `cell-${row}-${col}`;
                cell.className = 'cell w-full h-full border border-gray-700';
                this.gameBoard.appendChild(cell);
            }
        }
    }

    createNextPieceDisplay() {
        this.nextPieceDisplay.innerHTML = '';
        this.nextPieceDisplay.style.gridTemplateColumns = `repeat(4, ${this.BLOCK_SIZE / 2}px)`;
        this.nextPieceDisplay.style.gridTemplateRows = `repeat(4, ${this.BLOCK_SIZE / 2}px)`;

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.id = `next-cell-${row}-${col}`;
                cell.className = 'cell w-full h-full border border-gray-700';
                this.nextPieceDisplay.appendChild(cell);
            }
        }
    }

    resetGameState() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropSpeed = 1000;

        this.updateScore();
        this.updateLevel();
        this.updateLines();

        this.currentPiece = this.generateRandomPiece();
        this.nextPiece = this.generateRandomPiece();
        this.updateNextPieceDisplay();
    }

    generateRandomPiece() {
        const types = Object.keys(this.SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            shape: this.SHAPES[type],
            color: this.COLORS[type],
            type: type,
            x: Math.floor(this.COLS / 2) - Math.floor(this.SHAPES[type][0].length / 2),
            y: 0
        };
    }

    startGameLoop() {
        if (this.dropInterval) clearInterval(this.dropInterval);
        this.dropInterval = setInterval(() => this.moveDown(), this.dropSpeed);
    }

    draw() {
        this.clearBoard();
        this.drawLockedPieces();
        this.drawGhostPiece();
        this.drawCurrentPiece();
    }

    clearBoard() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.getElementById(`cell-${row}-${col}`);
                cell.className = 'cell w-full h-full border border-gray-700';
                cell.classList.remove('cell-filled', 'tetromino-I', 'tetromino-J', 'tetromino-L',
                    'tetromino-O', 'tetromino-S', 'tetromino-T', 'tetromino-Z', 'tetromino-ghost');
            }
        }
    }

    drawLockedPieces() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] !== this.EMPTY) {
                    const cell = document.getElementById(`cell-${row}-${col}`);
                    cell.classList.add('cell-filled', this.board[row][col]);
                }
            }
        }
    }

    drawGhostPiece() {
        if (this.currentPiece) {
            const ghostY = this.calculateGhostY();
            this.drawPiece(this.currentPiece.x, ghostY, this.currentPiece.shape, `${this.currentPiece.color}-ghost`);
        }
    }

    drawCurrentPiece() {
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape, this.currentPiece.color);
        }
    }

    drawPiece(x, y, shape, colorClass) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardRow = y + row;
                    const boardCol = x + col;

                    if (boardRow >= 0 && boardRow < this.ROWS && boardCol >= 0 && boardCol < this.COLS) {
                        const cell = document.getElementById(`cell-${boardRow}-${boardCol}`);
                        cell.classList.add('cell-filled', colorClass);
                    }
                }
            }
        }
    }

    calculateGhostY() {
        if (!this.currentPiece) return 0;

        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }
        return ghostY;
    }

    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX] !== this.EMPTY) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    moveLeft() {
        if (!this.gameOver && !this.isPaused && this.currentPiece &&
            !this.checkCollision(this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x--;
            this.draw();
        }
    }

    moveRight() {
        if (!this.gameOver && !this.isPaused && this.currentPiece &&
            !this.checkCollision(this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x++;
            this.draw();
        }
    }

    moveDown() {
        if (!this.gameOver && !this.isPaused && this.currentPiece) {
            if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
                this.currentPiece.y++;
                this.draw();
            } else {
                this.lockPiece();

                if (this.gameOver) {
                    this.endGame();
                } else {
                    this.draw();
                }
            }
        }
    }

    hardDrop() {
        if (!this.gameOver && !this.isPaused && this.currentPiece) {
            while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
                this.currentPiece.y++;
            }

            this.lockPiece();

            if (this.gameOver) {
                this.endGame();
            } else {
                this.draw();
            }
        }
    }

    rotate() {
        if (!this.gameOver && !this.isPaused && this.currentPiece) {
            const originalShape = this.currentPiece.shape;
            const rotated = [];

            // Transpose the matrix
            for (let col = 0; col < originalShape[0].length; col++) {
                rotated[col] = [];
                for (let row = 0; row < originalShape.length; row++) {
                    rotated[col][row] = originalShape[row][col];
                }
            }

            // Reverse each row to get a 90 degree clockwise rotation
            for (let row = 0; row < rotated.length; row++) {
                rotated[row].reverse();
            }

            // Check if rotation is possible
            if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
                this.currentPiece.shape = rotated;
                this.draw();
            } else {
                // Try wall kicks
                const kicks = [-1, 1, -2, 2];
                for (const kick of kicks) {
                    if (!this.checkCollision(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
                        this.currentPiece.x += kick;
                        this.currentPiece.shape = rotated;
                        this.draw();
                        break;
                    }
                }
            }
        }
    }

    lockPiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    const boardX = this.currentPiece.x + col;

                    if (boardY < 0) {
                        this.gameOver = true;
                        return;
                    }

                    this.board[boardY][boardX] = this.currentPiece.color;
                }
            }
        }

        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generateRandomPiece();
        this.updateNextPieceDisplay();

        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = this.ROWS - 1; row >= 0; row--) {
            let isLineComplete = true;

            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    isLineComplete = false;
                    break;
                }
            }

            if (isLineComplete) {
                linesCleared++;

                for (let y = row; y > 0; y--) {
                    for (let col = 0; col < this.COLS; col++) {
                        this.board[y][col] = this.board[y - 1][col];
                    }
                }

                for (let col = 0; col < this.COLS; col++) {
                    this.board[0][col] = this.EMPTY;
                }

                row++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;

            switch (linesCleared) {
                case 1:
                    this.score += 100 * this.level;
                    break;
                case 2:
                    this.score += 300 * this.level;
                    break;
                case 3:
                    this.score += 500 * this.level;
                    break;
                case 4:
                    this.score += 800 * this.level;
                    break;
            }

            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
                this.startGameLoop();
                this.updateLevel();
            }

            this.updateScore();
            this.updateLines();
            this.animateClearedLines();
        }
    }

    animateClearedLines() {
        const flashElements = [];
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] !== this.EMPTY) {
                    const cell = document.getElementById(`cell-${row}-${col}`);
                    flashElements.push(cell);
                }
            }
        }

        flashElements.forEach(cell => cell.classList.add('flash-animation'));
        setTimeout(() => {
            flashElements.forEach(cell => cell.classList.remove('flash-animation'));
        }, 300);
    }

    updateNextPieceDisplay() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.getElementById(`next-cell-${row}-${col}`);
                cell.className = 'cell w-full h-full border border-gray-700';
                cell.classList.remove('cell-filled', 'tetromino-I', 'tetromino-J', 'tetromino-L',
                    'tetromino-O', 'tetromino-S', 'tetromino-T', 'tetromino-Z');
            }
        }

        if (this.nextPiece) {
            const offsetX = Math.floor((4 - this.nextPiece.shape[0].length) / 2);
            const offsetY = Math.floor((4 - this.nextPiece.shape.length) / 2);

            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        const displayRow = row + offsetY;
                        const displayCol = col + offsetX;

                        if (displayRow >= 0 && displayRow < 4 && displayCol >= 0 && displayCol < 4) {
                            const cell = document.getElementById(`next-cell-${displayRow}-${displayCol}`);
                            cell.classList.add('cell-filled', this.nextPiece.color);
                        }
                    }
                }
            }
        }
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
    }

    updateLevel() {
        this.levelDisplay.textContent = this.level;
    }

    updateLines() {
        this.linesDisplay.textContent = this.lines;
    }

    togglePause() {
        if (this.gameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.pauseOverlay.classList.remove('hidden');
            clearInterval(this.dropInterval);
        } else {
            this.pauseOverlay.classList.add('hidden');
            this.startGameLoop();
        }
    }

    endGame() {
        this.gameOver = true;
        clearInterval(this.dropInterval);
        this.gameBoard.classList.add('game-over');
        this.gameOverOverlay.classList.remove('hidden');
    }

    hideOverlays() {
        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        this.gameBoard.classList.remove('game-over');
    }

    showStartScreen() {
        this.startOverlay.classList.remove('hidden');
        this.gameBoard.classList.add('game-over');
    }

    startGame() {
        this.startOverlay.classList.add('hidden');
        this.gameBoard.classList.remove('game-over');
        this.init();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && e.key === ' ') {
                this.init();
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
            }
        });

        this.restartButton.addEventListener('click', () => {
            this.init();
        });

        this.startButton.addEventListener('click', () => {
            this.startGame();
        });

        this.shareButton.addEventListener('click', () => {
            const shareText = `I scored ${this.score} points in Tetris! Can you beat my score? 🎮\n\nPlay at: https://vinicius.is-a.dev/tetris`;
            if (navigator.share) {
                navigator.share({
                    title: 'My Tetris Score',
                    text: shareText,
                    url: 'https://vinicius.is-a.dev/tetris'
                }).catch(console.error);
            } else {
                // Fallback for browsers that don't support Web Share API
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                window.open(twitterUrl, '_blank');
            }
        });

        this.gameBoard.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        this.gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.gameBoard.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - this.touchStartX;
            const diffY = touchEndY - this.touchStartY;

            if (diffX < -30 && Math.abs(diffX) > Math.abs(diffY)) {
                this.moveLeft();
            } else if (diffX > 30 && Math.abs(diffX) > Math.abs(diffY)) {
                this.moveRight();
            } else if (diffY > 30 && Math.abs(diffY) > Math.abs(diffX)) {
                this.hardDrop();
            } else if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
                this.rotate();
            }

            e.preventDefault();
        }, { passive: false });
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
}); 