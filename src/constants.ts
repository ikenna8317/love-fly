//In-game constant values
//---------------------

import 'phaser'

interface GameConstants {
    CANVAS_WIDTH: number,
    CANVAS_HEIGHT: number,
    GRAVITY: number,
    PLAYER: { 
        width: number,
        height: number,
        spawnX: number,
        spawnY: number,
        speedX: number,
        jump: number,
	recoilForce: number
     },

    ELEVATOR: {
	    acceleration: number
	       
     },
    FLOOR_HEIGHT: number,
    KEYS: {
	    action: number
    }

}

const gameConstants: GameConstants = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRAVITY: 300,
    PLAYER: {

        width: 32,
        height: 64,
        spawnX: 132,
        spawnY: 100,
        speedX: 175,
        jump: 170,
	recoilForce: 250
    },
    ELEVATOR: {
	acceleration: 15
     },
    FLOOR_HEIGHT: 20,
    KEYS: {
	    action: Phaser.Input.Keyboard.KeyCodes.S
    }
}

export default gameConstants
