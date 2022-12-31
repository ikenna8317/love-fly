import 'phaser'
//import { GameObjects, Types, Input } from 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    FLOOR_HEIGHT,
    PLAYER,
    KEYS,
    ELEVATOR
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

	this.initElevator()

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
	this.physics.add.collider(this.player, this.elevator, () => this.player.setData('isGrounded', true))

        this.player.setInteractive()

        //setup keyboard input
        this.cursorKeys = this.input.keyboard.createCursorKeys()
	this.actionBtn = this.input.keyboard.addKey(KEYS.action)

    }

    initElevator(): void {
	
	
	
	//create and init the elevator
	this.elevator = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - (FLOOR_HEIGHT * 2), CANVAS_WIDTH / 4, FLOOR_HEIGHT - 5, 0x717c8f).setOrigin(0.5, 0)
	this.elevator.setData({ firstStopY: CANVAS_HEIGHT - (FLOOR_HEIGHT * 2), secondStopY: PLAYER.height + 5 })
	this.physics.add.existing(this.elevator)

	//make the elevator a semi-static physics object in that it is not affected by gravity and it does not move whenever the player jumps on it
	if (this.elevator.body instanceof Phaser.Physics.Arcade.Body) {
		this.elevator.body.setAllowGravity(false)
		this.elevator.body.setImmovable(true)

	}

    }

   //updates the elevator's vertical displacement 
   updateElevator(): void {
	if (this.elevator.body instanceof Phaser.Physics.Arcade.Body) {
		//if the elevator's vertical position is higher or equal to the upper (second) stop checkpoint then stop it and accelerate it back to the lower checkpoint and vice versa
		if (this.elevator.body.y <= this.elevator.getData('secondStopY')) {
			this.elevator.body.setVelocityY(0)
			this.elevator.body.setAccelerationY(ELEVATOR.acceleration)
			//this.elevator.setData('onFirstStop', false)
		}

		else if (this.elevator.body.y >= this.elevator.getData('firstStopY')) {
			this.elevator.body.setVelocityY(0)
			this.elevator.body.setAccelerationY(-1 * ELEVATOR.acceleration)
			//this.elevator.setData('onFirstStop', false)
  		 }

	}
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
	
	this.updateElevator()

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
