import 'phaser'
//import { GameObjects, Types, Input } from 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    FLOOR_HEIGHT,
    PLAYER,
    KEYS
} = gameConstants

export default class Demo extends Phaser.Scene
{
    player!: Phaser.GameObjects.Rectangle
    elevator: Phaser.GameObjects.Rectangle
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys
    actionBtn: Phaser.Input.Keyboard.Key

    constructor ()
    {
        super('demo');
    }

    create(): void
    {
        //create player and platforms placeholders
        const platforms: Phaser.Physics.Arcade.StaticGroup = this.physics.add.staticGroup()
        platforms.add(this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT, 0x78563c).setOrigin(0))
	
	//create and init the elevator
	//this.elevator = this.add.rectangle(

	this.player = this.add.rectangle(PLAYER.spawnX, PLAYER.spawnY, PLAYER.width, PLAYER.height, 0xc72614).setOrigin(0)
	//this.player = this.add.triangle(PLAYER.spawnX, PLAYER.spawnY, undefined, undefined, undefined, undefined, undefined, undefined, 0xc72614).setOrigin(0)

        //enable physics on platforms and player objects
        //this.physics.add.existing(platforms, true)
        this.physics.add.existing(this.player)

	this.player.setData({ isGrounded: false, enableAction: false })

        if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
	    this.player.body.deltaMax.x = 200
	    this.player.body.deltaMax.y = 200

            //this.player.body.angle = 1
            this.player.body.setBounceY(0.1)
            this.player.body.setDamping(true)
            this.player.body.setDragX(0.15)
            this.player.body.setCollideWorldBounds()

        }

        this.physics.add.collider(this.player, platforms, () => this.player.setData('isGrounded', true))

        this.player.setInteractive()

        //setup keyboard input
        this.cursorKeys = this.input.keyboard.createCursorKeys()
	this.actionBtn = this.input.keyboard.addKey(KEYS.action)

    }

    //modify the action callback to test different physics api
    //action(): void {
//	if (this.player.body instanceof Phaser.Physics.Arcade.Body)
//		//this.player.body.setAccelerationX(10)
//		this.player.body.setAngularVelocity(6)
  //  }

  //  undoAction(): void {
//	if (this.player.body instanceof Phaser.Physics.Arcade.Body)
//		this.player.body.setAngularVelocity(0)
 //   }

    update(): void {
        if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
            if (this.cursorKeys.left.isDown) 
                this.player.body.setVelocityX(-1 * PLAYER.speedX)
             else if (this.cursorKeys.right.isDown) 
                this.player.body.setVelocityX(PLAYER.speedX)

	  //  if (this.actionBtn.isDown) {
		    //console.log('Action key pressed')
	//	    var action: boolean = this.player.getData('enableAction')
	//	    this.player.setData('enableAction', !action)
	//	    action = !action

	//	    if (action)
	//		    this.action()
	//	    else
	//		    this.undoAction()
	//    }

            if (this.cursorKeys.space.isDown && this.player.getData('isGrounded')) {
                this.player.body.setVelocityY(-1 * PLAYER.jump)
		this.player.setData({ isGrounded: false })
            }

        }
    }
}
