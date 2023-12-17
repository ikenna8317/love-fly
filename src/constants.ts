//In-game constant values
//---------------------
import 'phaser';

interface GameConstants {
    CANVAS_WIDTH: number,
    CANVAS_HEIGHT: number,
    CANVAS_BOUNDS_OFFSET: number,
    GRAVITY: number,
    PLAYER: { 
        width: number,
        height: number,
        spawnX: number,
        spawnY: number,
        speedX: number,
        jump: number,
	recoilSpeed: number
     },

    ELEVATOR: {
	    acceleration: number
	       
     },
    FLOOR_HEIGHT: number,
    KEYS: {
	    action: number
    },
    PLATFORM: {
	    tileWidth: number,
        maxTilePoolCapacity: number,
        maxEnemyPoolCapacity: number,
	    initScrollSpeedX: number,
	    destroyBoundaryX: number,
	    initEnemySpeedX: number,
	    enemyDim: { width: number, height: number }
    },
    BGD_SCROLL_SPEED: number,
    PROJECTILE: {
        speed: number,
        maxPoolCapacity: number
    }


};

const gameConstants: GameConstants = {
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 512,
    CANVAS_BOUNDS_OFFSET: 32,
    GRAVITY: 300,
    PLAYER: {
        width: 32,
        height: 64,
        spawnX: 132,
        spawnY: 100,
        speedX: 175,
        jump: 170,
        recoilSpeed: 250
    },
    ELEVATOR: {
	acceleration: 15
     },
    FLOOR_HEIGHT: 20,
    KEYS: {
	    action: Phaser.Input.Keyboard.KeyCodes.S
    },
    PLATFORM: {
	    tileWidth: 32,
        maxTilePoolCapacity: 34,
        maxEnemyPoolCapacity: 6,
	    initScrollSpeedX: 2,
	    destroyBoundaryX: -36,
	    initEnemySpeedX: 5,
	    enemyDim: { width: 32, height: 32 }
    },
    BGD_SCROLL_SPEED: 2,
    PROJECTILE: {
        speed: 500,
        maxPoolCapacity: 10
    }
};

export default gameConstants;
