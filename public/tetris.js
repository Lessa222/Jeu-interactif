class TetrisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisScene' });
    }

    init() {
        // Configuration du jeu
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = 30;
        
        // Grille de jeu
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        
        // Score et niveau
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        
        // Pièces Tetris
        this.pieces = {
            I: [
                [[1,1,1,1]],
                [[1],[1],[1],[1]]
            ],
            O: [
                [[1,1],[1,1]]
            ],
            T: [
                [[0,1,0],[1,1,1]],
                [[1,0],[1,1],[1,0]],
                [[1,1,1],[0,1,0]],
                [[0,1],[1,1],[0,1]]
            ],
            S: [
                [[0,1,1],[1,1,0]],
                [[1,0],[1,1],[0,1]]
            ],
            Z: [
                [[1,1,0],[0,1,1]],
                [[0,1],[1,1],[1,0]]
            ],
            J: [
                [[1,0,0],[1,1,1]],
                [[1,1],[1,0],[1,0]],
                [[1,1,1],[0,0,1]],
                [[0,1],[0,1],[1,1]]
            ],
            L: [
                [[0,0,1],[1,1,1]],
                [[1,0],[1,0],[1,1]],
                [[1,1,1],[1,0,0]],
                [[1,1],[0,1],[0,1]]
            ]
        };

        this.pieceColors = {
            I: 0x00ffff,
            O: 0xffff00,
            T: 0xff00ff,
            S: 0x00ff00,
            Z: 0xff0000,
            J: 0x0000ff,
            L: 0xffa500
        };

        this.pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        
        // Pièces
        this.currentPiece = null;
        this.nextPiece = null;
        
        // Timing
        this.dropTime = 0;
        this.dropInterval = 1000;
    }

    create() {
        this.createGrid();
        this.setupInput();
        this.spawnPiece();
        this.updateUI();
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        
        // Événements de touches
        this.input.keyboard.on('keydown-LEFT', () => this.movePiece(-1, 0));
        this.input.keyboard.on('keydown-RIGHT', () => this.movePiece(1, 0));
        this.input.keyboard.on('keydown-DOWN', () => this.movePiece(0, 1));
        this.input.keyboard.on('keydown-UP', () => this.rotatePiece());
        this.input.keyboard.on('keydown-SPACE', () => this.hardDrop());
        this.input.keyboard.on('keydown-P', () => this.togglePause());
    }

    createGrid() {
        // Créer un groupe pour les cellules
        this.cells = this.add.group();
        
        // Dessiner la grille vide
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.add.rectangle(
                    x * this.cellSize + this.cellSize / 2,
                    y * this.cellSize + this.cellSize / 2,
                    this.cellSize - 1,
                    this.cellSize - 1,
                    0x000000
                );
                cell.setStrokeStyle(1, 0x333333);
                this.cells.add(cell);
            }
        }
    }

    spawnPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.generateRandomPiece();
        }
        
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generateRandomPiece();
        
        // Position initiale
        this.currentPiece.x = Math.floor(this.gridWidth / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        
        // Vérifier le game over
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
            this.showGameOver();
        }
        
        this.drawNextPiece();
    }

    generateRandomPiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        return {
            type: type,
            shape: JSON.parse(JSON.stringify(this.pieces[type][0])),
            rotation: 0,
            color: this.pieceColors[type]
        };
    }

    movePiece(dx, dy) {
        if (this.gameOver || this.paused) return false;
        
        if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        
        // Si on ne peut pas descendre, verrouiller la pièce
        if (dy > 0) {
            this.lockPiece();
        }
        return false;
    }

    rotatePiece() {
        if (this.gameOver || this.paused) return;
        
        const currentRotation = this.currentPiece.rotation;
        const rotations = this.pieces[this.currentPiece.type];
        const nextRotation = (currentRotation + 1) % rotations.length;
        const newShape = rotations[nextRotation];
        
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, newShape)) {
            this.currentPiece.shape = JSON.parse(JSON.stringify(newShape));
            this.currentPiece.rotation = nextRotation;
        }
    }

    hardDrop() {
        if (this.gameOver || this.paused) return;
        
        while (this.movePiece(0, 1)) {
            // Continue jusqu'à ce que la pièce ne puisse plus descendre
        }
    }

    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.gridWidth || newY >= this.gridHeight) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        // Ajouter la pièce à la grille
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const gridY = this.currentPiece.y + row;
                    const gridX = this.currentPiece.x + col;
                    
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Vérifier les lignes complètes
        this.checkLines();
        
        // Nouvelle pièce
        this.spawnPiece();
    }

    checkLines() {
        let linesCleared = 0;
        
        for (let y = this.gridHeight - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                // Supprimer la ligne
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.gridWidth).fill(0));
                linesCleared++;
                y++; // Re-vérifier la même position
            }
        }
        
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }

    updateScore(linesCleared) {
        const points = [0, 40, 100, 300, 1200];
        this.score += points[linesCleared] * this.level;
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / 10) + 1;
        
        // Augmenter la vitesse
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    drawNextPiece() {
        const canvas = document.getElementById('next-piece');
        const ctx = canvas.getContext('2d');
        const cellSize = 20;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!this.nextPiece) return;
        
        const piece = this.nextPiece;
        const offsetX = (canvas.width - piece.shape[0].length * cellSize) / 2;
        const offsetY = (canvas.height - piece.shape.length * cellSize) / 2;
        
        ctx.fillStyle = this.colorToHex(piece.color);
        
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    ctx.fillRect(
                        offsetX + col * cellSize,
                        offsetY + row * cellSize,
                        cellSize - 1,
                        cellSize - 1
                    );
                }
            }
        }
    }

    colorToHex(color) {
        return '#' + color.toString(16).padStart(6, '0');
    }

    togglePause() {
        if (this.gameOver) return;
        
        this.paused = !this.paused;
        
        if (this.paused) {
            const pauseText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                'PAUSE',
                { fontSize: '32px', fill: '#fff' }
            );
            pauseText.setOrigin(0.5);
            this.pauseText = pauseText;
        } else {
            if (this.pauseText) {
                this.pauseText.destroy();
                this.pauseText = null;
            }
        }
    }

    showGameOver() {
        const gameOverText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 20,
            'GAME OVER',
            { fontSize: '32px', fill: '#ff0000' }
        );
        gameOverText.setOrigin(0.5);
        
        const scoreText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 20,
            'Score: ' + this.score,
            { fontSize: '16px', fill: '#fff' }
        );
        scoreText.setOrigin(0.5);
    }

    update(time, delta) {
        if (this.gameOver || this.paused) return;
        
        this.dropTime += delta;
        
        if (this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = 0;
        }
        
        this.drawGame();
    }

    drawGame() {
        // Effacer toutes les cellules
        this.cells.getChildren().forEach(cell => {
            cell.setFillStyle(0x000000);
        });
        
        // Dessiner les pièces verrouillées
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]) {
                    const cellIndex = y * this.gridWidth + x;
                    const cell = this.cells.getChildren()[cellIndex];
                    cell.setFillStyle(this.grid[y][x]);
                }
            }
        }
        
        // Dessiner la pièce actuelle
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const x = this.currentPiece.x + col;
                        const y = this.currentPiece.y + row;
                        
                        if (y >= 0) {
                            const cellIndex = y * this.gridWidth + x;
                            const cell = this.cells.getChildren()[cellIndex];
                            cell.setFillStyle(this.currentPiece.color);
                        }
                    }
                }
            }
        }
    }
}

// Configuration du jeu
const config = {
    type: Phaser.AUTO,
    width: 300,
    height: 600,
    parent: 'game',
    backgroundColor: '#000000',
    scene: TetrisScene
};

// Créer le jeu
new Phaser.Game(config);