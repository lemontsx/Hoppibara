const CONFIG = {
    GRAVITY: 3000,
    JUMP_STRENGTH: 1500,
    PLAYER_SPEED: 800,
    HAZARD_SPEED: 650,
    SCROLL_SPEED: 600,
    FLOOR_HEIGHT: 250,
    SCORE_INTERVAL: 300,
    SPAWN_MIN: 1,
    SPAWN_MAX: 3,
    BG_COLOR: [251, 210, 149]
};

const gameState = {
    score: 0,
    highScore: parseInt(sessionStorage.getItem('highScore') || '0'),
    isPaused: false,
    isGameOver: false,
    playerSprite: 0,
    isJumping: false,
    isWalking: false,
    rotation: 0,
    walkAnimTimer: 0,
    jumpAnimTimer: 0
};

const appCanvas = document.getElementById("app");
const k = kaboom({
    canvas: appCanvas,
    background: CONFIG.BG_COLOR,
    width: window.innerWidth,
    height: window.innerHeight,
});

k.loadSprite("capybara", "./assets/images/capybara.png");
k.loadSprite("capybara2", "./assets/images/capybara2.png");
k.loadSprite("hazard1", "./assets/images/hazards/hazard1.png");
k.loadSprite("hazard2", "./assets/images/hazards/hazard2.png");
k.loadSprite("hazard3", "./assets/images/hazards/hazard3.png");
k.loadSprite("hazard4", "./assets/images/hazards/hazard4.png");
k.loadSound("jump", "./assets/audio/jump.mp3");
k.loadSound("gameOver", "./assets/audio/loss.mp3");
k.loadSound("background", "./assets/audio/background.mp3");
k.loadFont("baifont", "./assets/fonts/bai.ttf");
k.loadSprite("leftIcon", "./assets/images/icons/left.png");
k.loadSprite("actionIcon", "./assets/images/icons/jump.png");
k.loadSprite("Lime", "./assets/images/menu/Lime.png");
k.loadSprite("CapyBaraM", "./assets/images/menu/capybara.png");
k.loadSprite("hoppibara", "./assets/images/menu/hoppibara.png");
k.loadSprite("hoppibara2", "./assets/images/menu/hoppibara1.png");
k.loadSprite("playIcon", "./assets/images/menu/playIcon.png");
k.loadSprite("retryIcon", "./assets/images/icons/retry.png");

k.onLoad(() => {
    k.go('menu');
});

function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        sessionStorage.setItem('highScore', gameState.highScore.toString());
    }
}

k.scene("menu", () => {
    const isMobile = window.innerWidth <= 768;
    const centerX = k.width() / 2;
    const centerY = k.height() / 2;
    
    k.add([
        k.sprite("hoppibara2"),
        k.pos(centerX, centerY - 200),
        k.anchor("center"),
        k.scale(isMobile ? 0.8 : 1),
    ]);

    const playBtnSize = isMobile ? 80 : 100;
    
    const playBtn = k.add([
        k.rect(playBtnSize, playBtnSize),
        k.pos(centerX, centerY + 100),
        k.anchor("center"),
        k.color(179, 120, 33),
        k.outline(8),
        k.z(10),
        k.area(),
    ]);

    k.add([
        k.sprite("playIcon"),
        k.pos(centerX, centerY + 100),
        k.anchor("center"),
        k.scale(1.2),
        k.z(11),
    ]);

    k.add([
        k.text(`High Score: ${gameState.highScore}`, { font: "baifont" }),
        k.pos(centerX, centerY + 220),
        k.scale(isMobile ? 1.2 : 1.5),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(11),
    ]);

    k.add([
        k.text("Press SPACE or Click to Start", { font: "baifont" }),
        k.pos(centerX, k.height() - 60),
        k.scale(0.8),
        k.anchor("center"),
        k.color(100, 100, 100),
        k.opacity(0.7),
    ]);

    playBtn.onClick(() => k.go("gameplay"));
    k.onKeyPress("space", () => k.go("gameplay"));
    k.onKeyPress("enter", () => k.go("gameplay"));

    let pulseTimer = 0;
    k.onUpdate(() => {
        pulseTimer += k.dt();
        const scale = 1 + Math.sin(pulseTimer * 3) * 0.05;
        playBtn.scale = k.vec2(scale, scale);

        const gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if (gamepad && gamepad.buttons[0]?.pressed) {
            k.go("gameplay");
        }
    });
});

k.scene("gameplay", () => {
    k.setGravity(CONFIG.GRAVITY);
    gameState.isGameOver = false;
    gameState.score = 0;
    gameState.playerSprite = 0;
    gameState.isJumping = false;
    gameState.rotation = 0;
    gameState.walkAnimTimer = 0;
    gameState.jumpAnimTimer = 0;

    let player = k.add([
        k.sprite("capybara"),
        k.pos(100, 100),
        k.anchor("center"),
        k.area(),
        k.body(),
    ]);

    const floorSegments = [];
    
    function createFloorSegment(xPos) {
        const floor = k.add([
            k.rect(k.width(), CONFIG.FLOOR_HEIGHT),
            k.pos(xPos, k.height() - CONFIG.FLOOR_HEIGHT),
            k.color(255, 255, 255),
            k.area(),
            k.body({ isStatic: true }),
            k.z(98),
        ]);

        k.add([
            k.rect(k.width(), 6),
            k.pos(xPos, k.height() - CONFIG.FLOOR_HEIGHT - 6),
            k.color(0, 0, 0),
        ]);

        return floor;
    }

    floorSegments.push(createFloorSegment(0));
    floorSegments.push(createFloorSegment(k.width()));

    const scoreCard = k.add([
        k.text(gameState.score, { font: "baifont" }),
        k.scale(1.8),
        k.pos(k.width() / 2, 80),
        k.anchor("center"),
        k.color(0, 0, 0),
    ]);

    const isMobile = window.innerWidth <= 768;
    let leftBtn, rightBtn, jumpBtn;

    if (isMobile) {
        leftBtn = k.add([
            k.sprite("leftIcon"),
            k.pos(80, k.height() - 120),
            k.anchor("center"),
            k.area(),
            k.z(99),
            k.opacity(0.5),
        ]);

        rightBtn = k.add([
            k.sprite("leftIcon"),
            k.pos(250, k.height() - 120),
            k.anchor("center"),
            k.area(),
            k.z(100),
            k.opacity(0.5),
            k.rotate(-180),
        ]);

        jumpBtn = k.add([
            k.sprite("actionIcon"),
            k.pos(k.width() - 180, k.height() - 120),
            k.anchor("center"),
            k.area(),
            k.z(100),
            k.opacity(0.5),
        ]);

        k.onClick(() => {
            const pos = k.mousePos();
            if (jumpBtn.hasPoint(pos)) {
                performJump();
                jumpBtn.opacity = 1;
                k.wait(0.1, () => jumpBtn.opacity = 0.5);
            }
        });
    }

    function performJump() {
        if (player.isGrounded() && !gameState.isGameOver) {
            k.play("jump", { volume: 0.6 });
            player.jump(CONFIG.JUMP_STRENGTH);
            gameState.isJumping = true;
            gameState.rotation = 0;
        }
    }

    k.onKeyPress("space", performJump);
    k.onKeyPress("up", performJump);

    const keys = {
        left: false,
        right: false
    };

    k.onKeyDown("left", () => keys.left = true);
    k.onKeyDown("right", () => keys.right = true);
    k.onKeyRelease("left", () => keys.left = false);
    k.onKeyRelease("right", () => keys.right = false);

    let scoreTimer = 0;
    const SCORE_INTERVAL = CONFIG.SCORE_INTERVAL / 1000;

    k.onUpdate(() => {
        floorSegments.forEach((floor, index) => {
            floor.pos.x -= CONFIG.SCROLL_SPEED * k.dt();
            if (floor.pos.x < -floor.width) {
                const lastIndex = (index + floorSegments.length - 1) % floorSegments.length;
                floor.pos.x = floorSegments[lastIndex].pos.x + floorSegments[lastIndex].width;
            }
        });

        if (!gameState.isGameOver && !gameState.isPaused) {
            scoreTimer += k.dt();
            if (scoreTimer >= SCORE_INTERVAL) {
                gameState.score++;
                scoreCard.text = gameState.score;
                updateHighScore();
                scoreTimer = 0;
            }
        }

        if (gameState.isJumping) {
            player.angle += 600 * k.dt();
            gameState.rotation += 600 * k.dt();
            if (gameState.rotation >= 360) {
                player.angle = 0;
                gameState.isJumping = false;
                gameState.rotation = 0;
            }
        }

        const isMoving = keys.left || keys.right || !player.isGrounded();
        
        if (keys.left && player.pos.x > 0 && !gameState.isGameOver) {
            player.move(-CONFIG.PLAYER_SPEED, 0);
        }
        
        if (keys.right && player.pos.x < k.width() && !gameState.isGameOver) {
            player.move(CONFIG.PLAYER_SPEED, 0);
        }

        if (isMobile && leftBtn && rightBtn) {
            const pos = k.mousePos();
            if (k.isMouseDown() && leftBtn.hasPoint(pos)) {
                if (player.pos.x > 0) {
                    player.move(-CONFIG.PLAYER_SPEED, 0);
                    leftBtn.opacity = 1;
                }
            } else {
                leftBtn.opacity = 0.5;
            }

            if (k.isMouseDown() && rightBtn.hasPoint(pos)) {
                if (player.pos.x < k.width()) {
                    player.move(CONFIG.PLAYER_SPEED, 0);
                    rightBtn.opacity = 1;
                }
            } else {
                rightBtn.opacity = 0.5;
            }
        }

        if (isMoving) {
            gameState.walkAnimTimer += k.dt();
            if (gameState.walkAnimTimer >= 0.12) {
                const newSprite = gameState.playerSprite === 0 ? "capybara2" : "capybara";
                player.use(k.sprite(newSprite));
                gameState.playerSprite = 1 - gameState.playerSprite;
                gameState.walkAnimTimer = 0;
            }
        } else if (player.isGrounded()) {
            player.use(k.sprite("capybara"));
            gameState.playerSprite = 0;
            gameState.walkAnimTimer = 0;
        }

        const gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if (gamepad) {
            if (gamepad.buttons[0]?.pressed) {
                performJump();
            }

            const leftStick = gamepad.axes[0];
            if (Math.abs(leftStick) > 0.1) {
                const newX = player.pos.x + leftStick * CONFIG.PLAYER_SPEED * k.dt();
                if (newX >= 0 && newX <= k.width()) {
                    player.move(leftStick * CONFIG.PLAYER_SPEED, 0);
                }
            }
        }
    });

    function spawnHazard() {
        if (gameState.isGameOver) return;

        const hazardNum = Math.floor(Math.random() * 4) + 1;
        k.add([
            k.sprite(`hazard${hazardNum}`),
            k.area(),
            k.pos(k.width(), k.height() - CONFIG.FLOOR_HEIGHT),
            k.move(k.LEFT, CONFIG.HAZARD_SPEED),
            k.anchor("botleft"),
            "hazard",
            k.offscreen({ destroy: true })
        ]);

        k.wait(Math.random() * (CONFIG.SPAWN_MAX - CONFIG.SPAWN_MIN) + CONFIG.SPAWN_MIN, spawnHazard);
    }

    player.onCollide("hazard", () => {
        if (!gameState.isGameOver) {
            gameState.isGameOver = true;
            k.play("gameOver", { volume: 0.3 });
            k.wait(0.1, () => k.go("gameover"));
        }
    });

    spawnHazard();
    k.play("background", { volume: 0.05, loop: true });
});

k.scene("gameover", () => {
    k.add([
        k.text("Game Over", { font: "baifont" }),
        k.scale(2.8),
        k.pos(k.width() / 2, k.height() / 2 - 250),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    const rectWidth = 400;
    const rectHeight = 200;
    const outlineThickness = 10;

    k.add([
        k.rect(rectWidth + outlineThickness * 2, rectHeight + outlineThickness * 2),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(107, 64, 1),
    ]);

    k.add([
        k.rect(rectWidth, rectHeight),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(179, 120, 33),
    ]);

    k.add([
        k.text(`Your Score: ${gameState.score}`, { font: "baifont" }),
        k.scale(1.2),
        k.pos(k.width() / 2, k.height() / 2 - 20),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    k.add([
        k.text(`Best Score: ${gameState.highScore}`, { font: "baifont" }),
        k.scale(1.2),
        k.pos(k.width() / 2, k.height() / 2 + 40),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);

    const retryBtn = k.add([
        k.rect(80, 80),
        k.outline(7),
        k.pos(k.width() / 2, k.height() / 2 + 180),
        k.anchor("center"),
        k.color(179, 120, 33),
        k.z(10),
        k.area(),
    ]);

    k.add([
        k.sprite("retryIcon"),
        k.pos(k.width() / 2, k.height() / 2 + 180),
        k.anchor("center"),
        k.z(20),
    ]);

    retryBtn.onClick(() => k.go("gameplay"));
    k.onKeyPress("space", () => k.go("gameplay"));
    k.onKeyPress("enter", () => k.go("gameplay"));

    k.onUpdate(() => {
        const gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if (gamepad && gamepad.buttons[0]?.pressed) {
            k.go("gameplay");
        }
    });
});
