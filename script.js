import React, { useEffect, useRef, useState } from 'react';

const HopibaraGame = () => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      ANIMATION_INTERVAL: 120,
      BG_COLOR: [251, 210, 149]
    };

    const gameState = {
      score: 0,
      highScore: parseInt(sessionStorage.getItem('highScore') || '0'),
      isPaused: false,
      isGameOver: false,
      currentScene: 'menu',
      playerSprite: 0,
      isJumping: false,
      isWalking: false,
      rotation: 0
    };

    let kaboomInstance;

    const initGame = async () => {
      const k = window.kaboom({
        canvas,
        background: CONFIG.BG_COLOR,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      kaboomInstance = k;

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
      k.loadSprite("tileSprite", "./assets/images/tile.png");
      k.loadSprite("leftIcon", "./assets/images/icons/left.png");
      k.loadSprite("rightIcon", "./assets/images/icons/right.png");
      k.loadSprite("actionIcon", "./assets/images/icons/jump.png");
      k.loadSprite("Lime", "./assets/images/menu/Lime.png");
      k.loadSprite("CapyBaraM", "./assets/images/menu/capybara.png");
      k.loadSprite("hoppibara", "./assets/images/menu/hoppibara.png");
      k.loadSprite("hoppibara2", "./assets/images/menu/hoppibara1.png");
      k.loadSprite("playIcon", "./assets/images/menu/playIcon.png");
      k.loadSprite("retryIcon", "./assets/images/icons/retry.png");

      k.onLoad(() => {
        setIsLoading(false);
        setupScenes(k);
        k.go('menu');
      });
    };

    const setupScenes = (k) => {
      setupMenuScene(k);
      setupGameplayScene(k);
      setupGameOverScene(k);
    };

    const setupMenuScene = (k) => {
      k.scene("menu", () => {
        const isMobile = window.innerWidth <= 768;
        
        const capybara = k.add([
          k.sprite("CapyBaraM"),
          k.scale(0.8),
          k.pos(-50, k.height() / 2 + 170),
          k.anchor("center"),
          k.rotate(8)
        ]);

        k.add([
          k.sprite("Lime"),
          k.pos(capybara.pos.x + 450, capybara.pos.y - 350),
          k.anchor("center"),
        ]);

        const logoSprite = isMobile ? "hoppibara" : "hoppibara2";
        const logoX = isMobile ? k.width() - 300 : k.width() - 650;
        const logoY = isMobile ? k.height() / 2 - 200 : k.height() / 2 - 330;

        k.add([
          k.sprite(logoSprite),
          k.pos(logoX, logoY),
          k.anchor("center"),
        ]);

        const playBtnX = isMobile ? k.width() - 300 : k.width() - 620;
        const playBtnSize = isMobile ? 65 : 80;

        const playBtn = k.add([
          k.rect(playBtnSize, playBtnSize),
          k.pos(playBtnX, k.height() / 2 + 50),
          k.anchor("center"),
          k.color(179, 120, 33),
          k.outline(6),
          k.z(10),
          k.area(),
          "playBtn",
        ]);

        k.add([
          k.sprite("playIcon"),
          k.pos(playBtnX, k.height() / 2 + 50),
          k.anchor("center"),
          k.z(11),
        ]);

        k.add([
          k.text(`High Score: ${gameState.highScore}`, { font: "baifont" }),
          k.pos(playBtnX, k.height() / 2 + 250),
          k.scale(1.3),
          k.anchor("center"),
          k.z(11),
        ]);

        playBtn.onClick(() => k.go("gameplay"));
        k.onKeyPress("space", () => k.go("gameplay"));
        k.onKeyPress("enter", () => k.go("gameplay"));
      });
    };

    const setupGameplayScene = (k) => {
      k.scene("gameplay", () => {
        k.setGravity(CONFIG.GRAVITY);
        gameState.isGameOver = false;
        gameState.score = 0;
        gameState.playerSprite = 0;

        let player = k.add([
          k.sprite("capybara"),
          k.pos(100, 100),
          k.anchor("center"),
          k.area(),
          k.body(),
        ]);

        const floorSegments = createFloor(k);
        const scoreCard = createScoreCard(k);
        const controls = createControls(k, player);

        let scoreTimer = k.loop(CONFIG.SCORE_INTERVAL / 1000, () => {
          if (!gameState.isGameOver && !gameState.isPaused) {
            gameState.score++;
            scoreCard.text = gameState.score;
            updateHighScore();
          }
        });

        k.onUpdate(() => {
          updateFloor(k, floorSegments);
          handlePlayerAnimation(k, player);
          handleControllerInput(k, player);
        });

        setupPlayerControls(k, player);
        spawnHazards(k, player);

        k.play("background", { volume: 0.05, loop: true });
      });
    };

    const setupGameOverScene = (k) => {
      k.scene("gameover", () => {
        k.add([
          k.text("Game Over", { font: "baifont" }),
          k.scale(2.8),
          k.pos(k.width() / 2, k.height() / 2 - 250),
          k.anchor("center"),
          k.color(255, 255, 255),
        ]);

        createScorePanel(k);

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
      });
    };

    const createFloor = (k) => {
      const segments = [];
      
      const createSegment = (xPos) => {
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
      };

      segments.push(createSegment(0));
      segments.push(createSegment(k.width()));
      
      return segments;
    };

    const updateFloor = (k, segments) => {
      segments.forEach((floor, index) => {
        floor.pos.x -= CONFIG.SCROLL_SPEED * k.dt();
        if (floor.pos.x < -floor.width) {
          const lastIndex = (index + segments.length - 1) % segments.length;
          floor.pos.x = segments[lastIndex].pos.x + segments[lastIndex].width;
        }
      });
    };

    const createScoreCard = (k) => {
      return k.add([
        k.text(gameState.score, { font: "baifont" }),
        k.scale(1.8),
        k.pos(k.width() / 2, 80),
        k.anchor("center"),
        k.color(0, 0, 0),
      ]);
    };

    const createScorePanel = (k) => {
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
    };

    const createControls = (k, player) => {
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) return null;

      const leftBtn = k.add([
        k.sprite("leftIcon"),
        k.pos(80, k.height() - 120),
        k.anchor("center"),
        k.area(),
        k.z(99),
        k.opacity(0.5),
      ]);

      const rightBtn = k.add([
        k.sprite("leftIcon"),
        k.pos(250, k.height() - 120),
        k.anchor("center"),
        k.area(),
        k.z(100),
        k.opacity(0.5),
        k.rotate(-180),
      ]);

      const jumpBtn = k.add([
        k.sprite("actionIcon"),
        k.pos(k.width() - 180, k.height() - 120),
        k.anchor("center"),
        k.area(),
        k.z(100),
        k.opacity(0.5),
      ]);

      return { leftBtn, rightBtn, jumpBtn };
    };

    const setupPlayerControls = (k, player) => {
      const performJump = () => {
        if (player.isGrounded() && !gameState.isGameOver) {
          k.play("jump", { volume: 0.6 });
          player.jump(CONFIG.JUMP_STRENGTH);
          gameState.isJumping = true;
          gameState.rotation = 0;
        }
      };

      k.onKeyPress("space", performJump);
      k.onKeyPress("up", performJump);

      k.onKeyDown("left", () => {
        if (player.pos.x > 0 && !gameState.isGameOver) {
          player.move(-CONFIG.PLAYER_SPEED, 0);
          gameState.isWalking = true;
        }
      });

      k.onKeyDown("right", () => {
        if (player.pos.x < k.width() && !gameState.isGameOver) {
          player.move(CONFIG.PLAYER_SPEED, 0);
          gameState.isWalking = true;
        }
      });

      k.onKeyRelease(["left", "right"], () => {
        gameState.isWalking = false;
      });
    };

    const handlePlayerAnimation = (k, player) => {
      if (gameState.isJumping) {
        player.angle += 10;
        gameState.rotation += 10;
        if (gameState.rotation >= 360) {
          player.angle = 0;
          gameState.isJumping = false;
        }
      }

      if ((gameState.isWalking || !player.isGrounded()) && k.time() % 0.24 < 0.12) {
        const newSprite = gameState.playerSprite === 0 ? "capybara2" : "capybara";
        player.use(k.sprite(newSprite));
        gameState.playerSprite = 1 - gameState.playerSprite;
      } else if (!gameState.isWalking && player.isGrounded()) {
        player.use(k.sprite("capybara"));
        gameState.playerSprite = 0;
      }
    };

    const handleControllerInput = (k, player) => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0];
      
      if (!gamepad) return;

      if (gamepad.buttons[0]?.pressed) {
        if (player.isGrounded() && !gameState.isGameOver) {
          k.play("jump", { volume: 0.6 });
          player.jump(CONFIG.JUMP_STRENGTH);
          gameState.isJumping = true;
        }
      }

      const leftStick = gamepad.axes[0];
      if (Math.abs(leftStick) > 0.1) {
        const newX = player.pos.x + leftStick * CONFIG.PLAYER_SPEED * k.dt();
        if (newX >= 0 && newX <= k.width()) {
          player.move(leftStick * CONFIG.PLAYER_SPEED, 0);
          gameState.isWalking = true;
        }
      } else {
        gameState.isWalking = false;
      }
    };

    const spawnHazards = (k, player) => {
      const spawn = () => {
        if (gameState.isGameOver) return;

        const hazardNum = Math.floor(Math.random() * 4) + 1;
        const hazard = k.add([
          k.sprite(`hazard${hazardNum}`),
          k.area(),
          k.pos(k.width(), k.height() - CONFIG.FLOOR_HEIGHT),
          k.move(k.LEFT, CONFIG.HAZARD_SPEED),
          k.anchor("botleft"),
          "hazard"
        ]);

        k.wait(Math.random() * (CONFIG.SPAWN_MAX - CONFIG.SPAWN_MIN) + CONFIG.SPAWN_MIN, spawn);
      };

      player.onCollide("hazard", () => {
        if (!gameState.isGameOver) {
          gameState.isGameOver = true;
          k.play("gameOver", { volume: 0.3 });
          k.wait(0.1, () => k.go("gameover"));
        }
      });

      spawn();
    };

    const updateHighScore = () => {
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        sessionStorage.setItem('highScore', gameState.highScore.toString());
      }
    };

    initGame();

    return () => {
      if (kaboomInstance) {
        kaboomInstance.quit();
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Loading Hopibara...
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};

export default HopibaraGame;
