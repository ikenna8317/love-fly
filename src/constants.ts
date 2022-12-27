//In-game constant values
//---------------------
import { Types } from "phaser"

interface BoxDimension {
    width: number,
    height: number
}

interface GameConstants {
    CANVAS_WIDTH: number,
    CANVAS_HEIGHT: number,
    GRAVITY: number,
    PLAYER_DIM: BoxDimension,
    FLOOR_HEIGHT: number,
    PLAYER_SPAWN_POS: Types.Math.Vector2Like

}

const gameConstants: GameConstants = {
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 550,
    GRAVITY: 300,
    PLAYER_DIM: {
        width: 52,
        height: 110
    },
    FLOOR_HEIGHT: 20,
    PLAYER_SPAWN_POS: { x: 32, y: 32 }

}

export default gameConstants