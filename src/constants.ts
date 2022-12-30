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
        jump: number
     },
    ELEVATOR: {
	    width: number,
	    height: number,
	       
     },
    FLOOR_HEIGHT: number,
    KEYS: {
	    action: number
    }

}

const gameConstants: GameConstants = {
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 550,
    GRAVITY: 300,
    PLAYER: {

        width: 52,
        height: 59,
        spawnX: 32,
        spawnY: 32,
        speedX: 75,
        jump: 170
    },
    ELEVATOR: {
	width: 255,
	height: 15,
     },
    FLOOR_HEIGHT: 20,
    KEYS: {
	    action: Phaser.Input.Keyboard.KeyCodes.S
    }
}

export default gameConstants
