import 'phaser'
import gameConstants from '../constants'

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    FLOOR_HEIGHT,
	PLAYER
} = gameConstants

export default class Demo extends Phaser.Scene {
    player: Phaser.GameObjects.Container
	//platform: Phaser.GameObjects.Rectangle
	cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys
	trackPointerKey: Phaser.Input.Keyboard.Key

	constructor() {
		super('demo')
	}

	//only use this if you are importing external files like texture files
	preload(): void {

	}

	//used to init the assets and configure the scene at the beginning
	create(): void {
		//const pWidth: number = CANVAS_WIDTH / 5


        const floor: Phaser.GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT, 0xd1e3ff).setOrigin(0, 0)
        this.player = this.add.container(PLAYER.spawnX, PLAYER.spawnY)
		this.player.width = PLAYER.width
		this.player.height = PLAYER.height

		const p: Phaser.GameObjects.Rectangle = this.add.rectangle(0, 0, PLAYER.width, PLAYER.height, 0xff5b3b)
		const gun: Phaser.GameObjects.Rectangle = this.add.rectangle(16, -5, 32, 16, 0x32a852)

		this.player.add(p)
		this.player.add(gun)

		this.player.setDataEnabled()
		this.player.setData('isGrounded', false)
		this.player.setData('trackPointer', false)
		this.player.setInteractive()

		//this.platform = this.add.rectangle((CANVAS_WIDTH / 2) - (pWidth / 2), CANVAS_HEIGHT - (FLOOR_HEIGHT*2), pWidth, FLOOR_HEIGHT, 0x8a8a8a).setOrigin(0, 0)

        this.physics.add.existing(floor, true)
        this.physics.add.existing(this.player)
		//init the player physics
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
			this.player.body.setCollideWorldBounds(true, 0, 0.2)
			this.player.body.setDamping(true)
			this.player.body.setDragX(0.15)
			//this.player.body.syncBounds = true

		}

		this.physics.add.collider(this.player, floor, () => {
			this.player.setData('isGrounded', true)
			this.player.setData('trackPointer', false)
			if (this.player.body instanceof Phaser.Physics.Arcade.Body) 
				this.player.body.rotation = 0

		})

		this.cursorKeys = this.input.keyboard.createCursorKeys()
		this.trackPointerKey = this.input.keyboard.addKey('Q')
		this.input.keyboard.on('p-Q', () => {
		       if (!this.player.getData('isGrounded'))	
				this.player.setData('trackPointer', true)
		})

	}

	//called once per frame
	update(): void {
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {

			//listen for basic movements: move left, right and jump
			if (this.cursorKeys.left.isDown)
				this.player.body.setVelocityX(-1 * PLAYER.speedX)
			else if (this.cursorKeys.right.isDown)
				this.player.body.setVelocityX(PLAYER.speedX)

			if (this.cursorKeys.space.isDown && this.player.getData('isGrounded')) {
				this.player.body.setVelocityY(-1 * PLAYER.jump)
				this.player.setData('isGrounded', false)		
			} 
			if (this.player.getData('trackPointer')) {
				this.trackPointer()
				if (this.cursorKeys.space.isDown) {
					const { rfX, rfY } = this.calcRecoilForce()

					this.player.body.setVelocityX(rfX)
					this.player.body.setVelocityY(rfY)
				}
					
			}
		
		}

		if (this.trackPointerKey.isDown)
			this.input.keyboard.emit('p-Q')

	}

	//makes the player rotate in such a way that it faces the cursor
	trackPointer(): void {
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
			const rotAngleInDegrees: number = Phaser.Math.Angle.Between(this.player.body.x, this.player.body.y, this.input.activePointer.x, this.input.activePointer.y) * 180 / Math.PI

			this.player.body.rotation = rotAngleInDegrees
					
		}
	}

	calcRecoilForce(): { rfX: number, rfY: number } {
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {

			const deltaY: number = this.input.activePointer.y - this.player.body.y 
			const deltaX: number = this.input.activePointer.x - this.player.body.x

			const rfY: number = (-1 * deltaY)/(Math.abs(deltaX) + Math.abs(deltaY)) * PLAYER.recoilForce
			const rfX: number = (-1 * deltaX)/(Math.abs(deltaX) + Math.abs(deltaY)) * PLAYER.recoilForce

			return { rfX, rfY };
		}

	}
}
