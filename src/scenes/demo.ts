import 'phaser'
import { GameObjects, Types } from 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    FLOOR_HEIGHT,
    PLAYER
} = gameConstants

export default class Demo extends Phaser.Scene
{
    player!: GameObjects.Triangle
    cursorKeys: Types.Input.Keyboard.CursorKeys

    constructor ()
    {
        super('demo');
    }

    create(): void
    {
        //create player and floor placeholders
        const floor: GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, 0x4f3d33).setOrigin(0)
       //this.player = this.add.rectangle(PLAYER.spawnX, PLAYER.spawnY, PLAYER.width, PLAYER.height, 0xc72614).setOrigin(0)
	this.player = this.add.triangle(PLAYER.spawnX, PLAYER.spawnY, undefined, undefined, undefined, undefined, undefined, undefined, 0xc72614).setOrigin(0)

        //enable physics on floor and player objects
        this.physics.add.existing(floor, true)
        this.physics.add.existing(this.player)

	this.player.setData({ isGrounded: false })

        if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setBounceY(0.1)
            this.player.body.setDamping(true)
            this.player.body.setDragX(0.15)
            this.player.body.setCollideWorldBounds()
        }

        this.physics.add.collider(this.player, floor, () => this.player.setData({ isGrounded: true }))

        this.player.setInteractive()

        //setup keyboard input
        this.cursorKeys = this.input.keyboard.createCursorKeys()

    }

    update(): void {
        if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
            if (this.cursorKeys.left.isDown) 
                this.player.body.setVelocityX(-1 * PLAYER.speedX)
             else if (this.cursorKeys.right.isDown) 
                this.player.body.setVelocityX(PLAYER.speedX)
            

            if (this.cursorKeys.space.isDown && this.player.getData('isGrounded')) {
                this.player.body.setVelocityY(-1 * PLAYER.jump)
		this.player.setData({ isGrounded: false })
            }

        }
    }
}
