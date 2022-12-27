import 'phaser'
import { GameObjects } from 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    FLOOR_HEIGHT,
    PLAYER_SPAWN_POS,
    PLAYER_DIM
} = gameConstants

export default class Demo extends Phaser.Scene
{
    player!: GameObjects.Rectangle

    constructor ()
    {
        super('demo');
    }

    create ()
    {
        // this.add.rectangle(12, 12, 100, 100, 0xff0000).setOrigin(0)
        const floor: GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, 0x4f3d33).setOrigin(0)
        this.player = this.add.rectangle(PLAYER_SPAWN_POS.x, PLAYER_SPAWN_POS.y, PLAYER_DIM.width, PLAYER_DIM.height, 0xc72614).setOrigin(0)
    }
}