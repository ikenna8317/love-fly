import 'phaser'
import { GameObjects, Types } from 'phaser';
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
    cursorKeys: Types.Input.Keyboard.CursorKeys

    constructor ()
    {
        super('demo');
    }

    create(): void
    {
        //create player and floor placeholders
        const floor: GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, 0x4f3d33).setOrigin(0)
        this.player = this.add.rectangle(PLAYER_SPAWN_POS.x, PLAYER_SPAWN_POS.y, PLAYER_DIM.width, PLAYER_DIM.height, 0xc72614).setOrigin(0)

        //enable physics on floor and player objects
        this.physics.add.existing(floor, true)
        this.physics.add.existing(this.player)

        if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setBounceY(0.1)
            this.player.body.setDamping(true)
            this.player.body.setDragX(0.35)
            this.player.body.setCollideWorldBounds()
        }

        this.physics.add.collider(this.player, floor)

        this.player.setInteractive()

        //setup keyboard input
        this.cursorKeys = this.input.keyboard.createCursorKeys()

    }

    update(): void {

    }
}