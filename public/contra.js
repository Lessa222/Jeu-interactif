class ContraScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ContraScene' });
    }

    init() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.levelComplete = false;
        this.gameStarted = false;
        
        this.weapons = ['NORMAL', 'LASER', 'SPREAD', 'MACHINE'];
        this.currentWeapon = 0;
        
        this.GRAVITY = 800;
        this.PLAYER_SPEED = 200;
        this.JUMP_FORCE = -400;
        this.BULLET_SPEED = 400;
    }

    preload() {
        this.load.image('player', 'soldat.png');
        this.load.image('enemy', 'deba.png');
        this.load.image('boss', 'boss.png');
        this.load.image('bullet', 'bullet.png');
        this.load.image('laser', 'laser.png');
        this.load.image('ground', 'ground.png');
        this.load.image('platform', 'platform.png');
        this.load.image('power', 'powerup.png');
    } 

    create() {
        // Configuration physique
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // Créer les groupes
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x1a1a4a);
        
        // Créer le niveau
        this.createLevel();
        
        // Créer le joueur
        this.createPlayer();
        this.player.setScale(0.2);
        
        // Configuration des entrées
        this.setupInput();
        
        // Configuration des collisions
        this.setupCollisions();
        
        // Sons
        this.setupAudio();
        
        // UI initiale
        this.updateUI();
    }

    createLevel() {
        // Sol principal
        for (let i = 0; i < 13; i++) {
            this.platforms.create(32 + i * 64, 584, 'ground');
        }
        
        // Plateformes selon le niveau
        if (this.level === 1) {
            this.createLevel1();
        } else {
            this.createLevel2();
        }
        
        // Créer les ennemis
        this.spawnEnemies();
    }

    createLevel1() {;
        this.platforms.create(400, 400, 'platform');
        this.platforms.create(600, 300, 'platform');
        this.platforms.create(300, 200, 'platform');
    }

    createLevel2() {
        this.platforms.create(350, 450, 'platform');
        this.platforms.create(550, 400, 'platform');
        this.platforms.create(650, 300, 'platform');
        this.platforms.create(450, 200, 'platform');
    }

    createPlayer() {
        this.player = this.physics.add.sprite(100, 500, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(this.GRAVITY);
        
        this.player.health = 100;
        this.player.invulnerable = false;
        this.player.facingRight = true;
        this.player.canJump = true;
    }

    spawnEnemies() {
        // Ennemis normaux
        const enemyCount = 3 + this.level;
        for (let i = 0; i < enemyCount; i++) {
            const x = Phaser.Math.Between(200, 700);
            const y = Phaser.Math.Between(100, 300);
            const enemy = this.enemies.create(x, y, 'enemy');
            enemy.setBounce(0.2);
            enemy.setScale(5);
            enemy.setCollideWorldBounds(true);
            enemy.setGravityY(this.GRAVITY);
            enemy.health = 30;
            enemy.lastShot = 0;
            enemy.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
        }
        
        // Boss au niveau 3
        if (this.level >= 3) {
            const boss = this.enemies.create(600, 100, 'boss');
            boss.health = 200;
            boss.lastShot = 0;
        }
        
        // Power-up
        this.spawnPowerUp();
    }

    spawnPowerUp() {
        const x = Phaser.Math.Between(200, 600);
        const y = Phaser.Math.Between(100, 300);
        const power = this.powerUps.create(x, y, 'power');
        power.setBounce(0.5);
        power.setGravityY(this.GRAVITY);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.weaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        // Démarrer le jeu
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.gameStarted) {
                this.gameStarted = true;
                document.getElementById('start-screen').style.display = 'none';
            }
        });
    }

    setupCollisions() {
        // Collisions avec les plateformes
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.powerUps, this.platforms);
        
        // Collisions balles avec plateformes
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            bullet.destroy();
        });
        
        this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => {
            bullet.destroy();
        });
        
        // Collisions joueur avec ennemis
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            this.playerHit();
        });
        
        // Collisions balles avec ennemis
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            bullet.destroy();
            this.hitEnemy(enemy);
        });
        
        // Collisions balles ennemies avec joueur
        this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
            bullet.destroy();
            this.playerHit();
        });
        
        // Collisions avec power-ups
        this.physics.add.overlap(this.player, this.powerUps, (player, power) => {
            power.destroy();
            this.upgradeWeapon();
        });
    }

    setupAudio() {
        // Sons basiques (seraient normalement chargés)
        this.shootSound = { play: () => {} };
        this.explosionSound = { play: () => {} };
        this.powerUpSound = { play: () => {} };
        this.jumpSound = { play: () => {} };
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver || this.levelComplete) return;
        
        this.updatePlayer(time);
        this.updateEnemies(time);
        this.checkLevelCompletion();
    }

    updatePlayer(time) {
        // Mouvement horizontal
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.PLAYER_SPEED);
            this.player.facingRight = false;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.PLAYER_SPEED);
            this.player.facingRight = true;
        } else {
            this.player.setVelocityX(0);
        }
        
        // Sauter
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(this.JUMP_FORCE);
            this.jumpSound.play();
        }
        
        // Tirer
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.shoot();
        }
        
        // Changer d'arme
        if (Phaser.Input.Keyboard.JustDown(this.weaponKey)) {
            this.switchWeapon();
        }
        
        // Redémarrer si game over
        if (Phaser.Input.Keyboard.JustDown(this.restartKey) && this.gameOver) {
            this.scene.restart();
        }
    }

    updateEnemies(time) {
        this.enemies.getChildren().forEach(enemy => {
            // Mouvement aléatoire pour les ennemis normaux
            if (enemy.texture.key === 'enemy') {
                if (Math.random() < 0.01) {
                    enemy.direction *= -1;
                }
                enemy.setVelocityX(enemy.direction * 50);
                
                // Tirer occasionnellement
                if (time > enemy.lastShot + 3000) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = time;
                }
            }
            
            // Comportement du boss
            if (enemy.texture.key === 'boss') {
                // Tir rapide
                if (time > enemy.lastShot + 1000) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = time;
                }
            }
        });
    }

    shoot() {
        this.shootSound.play();
        
        const x = this.player.x + (this.player.facingRight ? 12 : -12);
        const y = this.player.y;
        const velocityX = this.player.facingRight ? this.BULLET_SPEED : -this.BULLET_SPEED;
        
        let bullet;
        
        switch (this.weapons[this.currentWeapon]) {
            case 'NORMAL':
                bullet = this.bullets.create(x, y, 'bullet');
                bullet.setVelocityX(velocityX);
                break;
                
            case 'LASER':
                bullet = this.bullets.create(x, y, 'laser');
                bullet.setVelocityX(velocityX * 1.5);
                break;
                
            case 'SPREAD':
                // Tir triple
                for (let i = -1; i <= 1; i++) {
                    bullet = this.bullets.create(x, y, 'bullet');
                    bullet.setVelocityX(velocityX);
                    bullet.setVelocityY(i * 100);
                }
                break;
                
            case 'MACHINE':
                bullet = this.bullets.create(x, y, 'bullet');
                bullet.setVelocityX(velocityX * 1.2);
                break;
        }
        
        // Supprimer les balles après un délai
        this.time.delayedCall(2000, () => {
            if (bullet && bullet.active) {
                bullet.destroy();
            }
        });
    }

    enemyShoot(enemy) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'bullet');
        
        if (enemy.texture.key === 'boss') {
            // Tir multiple pour le boss
            for (let i = -1; i <= 1; i++) {
                const spreadBullet = this.enemyBullets.create(enemy.x, enemy.y, 'bullet');
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                const spreadAngle = angle + (i * 0.3);
                this.physics.velocityFromRotation(spreadAngle, 200, spreadBullet.body.velocity);
            }
        } else {
            // Tir simple vers le joueur
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            this.physics.velocityFromRotation(angle, 150, bullet.body.velocity);
        }
        
        // Supprimer les balles ennemies après un délai
        this.time.delayedCall(3000, () => {
            if (bullet && bullet.active) {
                bullet.destroy();
            }
        });
    }

    hitEnemy(enemy) {
        this.explosionSound.play();
        enemy.health -= 10;
        
        // Effet visuel
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });
        
        if (enemy.health <= 0) {
            enemy.destroy();
            this.addScore(100);
            
            // Chance de faire apparaître un power-up
            if (Math.random() < 0.3) {
                this.spawnPowerUp();
            }
        }
    }

    playerHit() {
        if (this.player.invulnerable) return;
        
        this.player.health -= 25;
        this.player.invulnerable = true;
        
        // Effet de clignotement
        this.player.setTint(0xff0000);
        this.time.delayedCall(1000, () => {
            this.player.invulnerable = false;
            this.player.clearTint();
        });
        
        if (this.player.health <= 0) {
            this.loseLife();
        }
    }

    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver = true;
            document.getElementById('final-score').textContent = this.score.toString().padStart(6, '0');
            document.getElementById('game-over').style.display = 'block';
        } else {
            // Respawn
            this.player.setPosition(100, 500);
            this.player.health = 100;
            this.player.invulnerable = true;
            this.player.setTint(0x00ff00);
            
            this.time.delayedCall(2000, () => {
                this.player.invulnerable = false;
                this.player.clearTint();
            });
        }
    }

    upgradeWeapon() {
        this.powerUpSound.play();
        this.currentWeapon = Math.min(this.currentWeapon + 1, this.weapons.length - 1);
        this.updateUI();
        this.addScore(500);
    }

    switchWeapon() {
        this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
        this.updateUI();
    }

    addScore(points) {
        this.score += points;
        this.updateUI();
    }

    checkLevelCompletion() {
        if (this.enemies.getLength() === 0 && !this.levelComplete) {
            this.levelComplete = true;
            document.getElementById('level-complete').style.display = 'block';
            
            this.time.delayedCall(2000, () => {
                this.nextLevel();
            });
        }
    }

    nextLevel() {
        this.level++;
        this.levelComplete = false;
        document.getElementById('level-complete').style.display = 'none';
        
        // Nettoyer la scène
        this.platforms.clear(true, true);
        this.enemies.clear(true, true);
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.powerUps.clear(true, true);
        
        // Recréer le niveau
        this.createLevel();
        this.player.setPosition(100, 500);
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('weapon').textContent = this.weapons[this.currentWeapon];
        document.getElementById('level').textContent = this.level;
    }
}

// Configuration du jeu
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: ContraScene
};

// Créer le jeu
const game = new Phaser.Game(config);