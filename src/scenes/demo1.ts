import 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
	CANVAS_BOUNDS_OFFSET,
    FLOOR_HEIGHT,
	PLAYER,
	PLATFORM,
	PROJECTILE
} = gameConstants;

export default class Demo extends Phaser.Scene {
    player: Phaser.GameObjects.Container;
	//tmap: Phaser.Tilemaps.Tilemap
	platforms: Phaser.GameObjects.Group;
	enemies: Phaser.GameObjects.Group;
	projectiles: Phaser.Physics.Arcade.Group;
	platformGenerationConfig: {minY: number, maxY: number, maxTiles: number, minTiles: number};
	
	//platform: Phaser.GameObjects.Rectangle
	cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
	trackPointerKey: Phaser.Input.Keyboard.Key;
	sspeedMultiplier: number;

	constructor() {
		super('demo');
	}

	//only use this if you are importing external files like texture files
	preload(): void {
		this.load.spritesheet('general_ts', 'tilesets/general_tileset_2.png', {frameWidth: 32, frameHeight: 34});
		//this.load.image('beach_ts', 'beach_tileset_2.png');
		this.load.image('projectile', 'laser_projectile.png');

	}

	//used to init the assets and configure the scene at the beginning
	create(): void {
		
        const floor: Phaser.GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT, 0xd1e3ff).setOrigin(0, 0);
		this.platforms = this.add.group();
		this.enemies = this.add.group();
		this.sspeedMultiplier = 1;
	
		this.platforms.classType = Phaser.GameObjects.Image;
		this.enemies.classType = Phaser.GameObjects.Image;

		this.platformGenerationConfig = {minY: 32, maxY: CANVAS_HEIGHT - 32, minTiles: 3, maxTiles: 11};

		this.projectiles = this.physics.add.group();
		this.projectiles.maxSize = PROJECTILE.maxPoolCapacity;
		this.projectiles.classType = Phaser.Physics.Arcade.Image;
		this.projectiles.defaultKey = 'projectile';

        this.player = this.add.container(PLAYER.spawnX, PLAYER.spawnY);
		this.player.width = PLAYER.width;
		this.player.height = PLAYER.height;

				
		const p: Phaser.GameObjects.Rectangle = this.add.rectangle(0, 0, PLAYER.width, PLAYER.height, 0xff5b3b);
		const gun: Phaser.GameObjects.Rectangle = this.add.rectangle(16, -5, 32, 16, 0x32a52);

		this.player.add(p);
		this.player.add(gun);

		this.player.setDataEnabled();
		this.player.setData('isGrounded', false);
		this.player.setData('trackPointer', false);
		this.player.setDepth(3);
		this.player.setInteractive();

        this.physics.add.existing(floor, true);
        this.physics.add.existing(this.player);
		//init the player physics
		
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
			this.player.body.setCollideWorldBounds(true, 0, 0.2);
			this.player.body.setDamping(true);
			this.player.body.setDragX(0.15);

		}
	   

		this.physics.add.collider(this.player, floor, () => {
			this.player.setData('isGrounded', true);
			this.player.setData('trackPointer', false);
			if (this.player.body instanceof Phaser.Physics.Arcade.Body) 
				this.player.body.rotation = 0;

		});

		//NOTE: add this later
		// this.physics.add.collider(this.projectiles, this.enemies, () => {

		// });

		this.cursorKeys = this.input.keyboard.createCursorKeys();

		this.cursorKeys.left.setEmitOnRepeat(true);
		this.cursorKeys.left.on('down', event => {
			if (this.player.body instanceof Phaser.Physics.Arcade.Body)
				this.player.body.setVelocityX(-1 * PLAYER.speedX);
		});

		this.cursorKeys.right.setEmitOnRepeat(true);
		this.cursorKeys.right.on('down', event => {
			if (this.player.body instanceof Phaser.Physics.Arcade.Body)
				this.player.body.setVelocityX(PLAYER.speedX);
		});

		//enable air mode when you press the space button. Air mode enables the player to 
		this.cursorKeys.space.on('down', event => this.enableAirMode());

		//the track pointer key, when pressed enables 'track pointer' mode which enables the player to rotate while
		//in mid air to continually face the pointer
		this.trackPointerKey = this.input.keyboard.addKey('Q');
		this.trackPointerKey.on('down', event => {
			if (!this.player.getData('isGrounded'))	
				this.player.setData('trackPointer', true);
		});

		//create 2 simple platforms with patrolling 'enemies'
		this.createPlatforms();
		this.createPlatforms();
	   
	}

	createPlatforms(): void {
		//choose a random height to create the new platform 
		const posY: number = Phaser.Math.RND.between(this.platformGenerationConfig.minY, this.platformGenerationConfig.maxY);
		//choose a random number of tiles to build the platform with
		const numOfTiles: number = Phaser.Math.RND.between(this.platformGenerationConfig.minTiles, this.platformGenerationConfig.maxTiles); 

		//create the platforms
		this.platforms.createFromConfig({
			key: 'general_ts',
			frame: 1,
			setXY: {x: CANVAS_WIDTH+10, y: posY, stepX: PLATFORM.tileWidth},
			quantity: numOfTiles
		});

		
		const enemy: Phaser.GameObjects.Image = this.add.image(CANVAS_WIDTH+12, posY-PLATFORM.enemyDim.height, 'enemy');
		enemy.setDataEnabled();
		enemy.setData({left: CANVAS_WIDTH+10, right: (CANVAS_WIDTH + 10) + numOfTiles*PLATFORM.tileWidth - PLATFORM.enemyDim.width, direction: 1});
		this.enemies.add(enemy,true);
	}

	updatePlatforms(): void {
		//exit if there are no active platforms in game
		if (this.platforms.getLength() === 0)
			return;

		//move the platform by this amount at each frame
		const deltaX: number =	-PLATFORM.initScrollSpeedX * this.sspeedMultiplier;
		this.platforms.incX(deltaX);

		if (this.enemies.getLength() != 0) {
			//for each enemy object
			Phaser.Actions.Call(this.enemies.getChildren(), enemy => {
				if (enemy instanceof Phaser.GameObjects.Image) {
					//if enemy goes past the destroy boundary then destroy the enemy
					if (enemy.x < PLATFORM.destroyBoundaryX) { 
						this.enemies.remove(enemy,true,true);
						return;
					}
					
					//if the enemy goes past its left stop boundary then change its directon to right
					//else change its direction to left
					if (enemy.x < enemy.getData('left'))
						enemy.setData('direction', 1);
					else if (enemy.x > enemy.getData('right'))
						enemy.setData('direction', -1);

					//manually move the enemys current x position and its left and right boundary left
					enemy.setX(enemy.x + PLATFORM.initEnemySpeedX * this.sspeedMultiplier * enemy.getData('direction'));
					enemy.incData('left', deltaX);
					enemy.incData('right', deltaX);

				}},this);
			
		}

		//optimized removal of tiles, instead of checking every single tile per frame which is bad for performance,
		// only check the very first platform tile in the platforms container
		//and destroy it if it goes past the destroy boundary
		const tile = this.platforms.getFirstAlive();
		if (tile != null && tile.x < PLATFORM.destroyBoundaryX)
			this.platforms.remove(tile, true, true);
	}

	//for every frame, for all projectiles, update position of projectile 
	//and check if a projectile is out of bounds and destroys them if so
	updateProjectiles(): void {
		//exit if there are no active projectiles 
		if (this.projectiles.getLength() === 0)
			return;

		//for each laser projectile
		Phaser.Actions.Call(this.projectiles.getChildren(), projectile => {
			if (projectile.body instanceof Phaser.Physics.Arcade.Body)
				//update the angle of the projectile
				projectile.body.rotation = projectile.state as number;
				
			//destroy projectile if it goes out of bounds
			if (projectile instanceof Phaser.Physics.Arcade.Image && !this.isInBounds(projectile)) 
				// this.projectiles.remove(projectile,true,true);
				this.projectiles.killAndHide(projectile)

		}, this);
	}

	//update loop: called once per frame
	update(): void {

		//update the scrolling platforms
		this.updatePlatforms();

		//continue to update the rotation of the player to face the cursor/pointer while in 'track pointer' mode
		if (this.player.getData('trackPointer')) {
			const rotAngleInDegrees: number = this.updatePlayerAngle();
				if (this.player.body instanceof Phaser.Physics.Arcade.Body && rotAngleInDegrees != -1)
					this.player.body.rotation = rotAngleInDegrees;
		}

		//update the projectiles fired by the player
		this.updateProjectiles();

	}

	//returns true if an image or sprite is within the allowable bounds of the game (which is within the canvas dimensions plus an offset)
	isInBounds(obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite): boolean {
		return obj.x > -CANVAS_BOUNDS_OFFSET && obj.x < (CANVAS_WIDTH + CANVAS_BOUNDS_OFFSET) && obj.y > -CANVAS_BOUNDS_OFFSET && obj.y < (CANVAS_HEIGHT + CANVAS_BOUNDS_OFFSET);
	}

	//returns the new angle that makes the player faces the pointer
	updatePlayerAngle(): number {
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
			const rotAngleInDegrees: number = Phaser.Math.Angle.Between(this.player.body.x, this.player.body.y, this.input.activePointer.x, this.input.activePointer.y) * 180 / Math.PI;
			return rotAngleInDegrees;
		}
		return -1;
	}

	//calculates the player x and y recoil force and direction based on the position of player with respect to mouse coursor
	calcRecoilForce(): { rfX: number, rfY: number } {
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {

			const deltaY: number = this.input.activePointer.y - this.player.body.y; 
			const deltaX: number = this.input.activePointer.x - this.player.body.x;

			const rfY: number = (-1 * deltaY)/(Math.abs(deltaX) + Math.abs(deltaY));
			const rfX: number = (-1 * deltaX)/(Math.abs(deltaX) + Math.abs(deltaY));

			return { rfX, rfY };
		}

	}

	//handles the player jump and midair firing of projectiles
	enableAirMode(): void {
		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {

			//if player is grounded i.e. not in midair then make the player jump
			if (this.player.getData('isGrounded')) {
				this.player.body.setVelocityY(-1 * PLAYER.jump);
				this.player.setData('isGrounded', false);		
			} 

			//fires projectile when 'SPACE' button is pressed while in 'track pointer' mode
			if (this.player.getData('trackPointer')) {
					
					//get the recoil force/direction based on the orientation of the player with the mouse pointer
					const { rfX, rfY }: { rfX: number, rfY: number } = this.calcRecoilForce();
					
					//set the x and y velocity of the player to the product of the recoil direction and recoil speed
					this.player.body.setVelocityX(rfX * PLAYER.recoilSpeed);
					this.player.body.setVelocityY(rfY * PLAYER.recoilSpeed);

					//create a new projectile at the position of the player
					// const projectile: Phaser.Physics.Arcade.Image = this.projectiles.create(this.player.body.x, this.player.body.y, 'projectile');
					const projectile: Phaser.Physics.Arcade.Image = this.projectiles.get(this.player.body.x, this.player.body.y);
					if (!projectile)
						return;

					projectile.setVisible(true);
					projectile.setActive(true);

					if (projectile.body instanceof Phaser.Physics.Arcade.Body) {
						//store the current angle of the player in state of projectile so we can set it in update loop
						projectile.setState(this.player.body.rotation);

						//we don't want the projectile affected by gravity at all
						projectile.body.setAllowGravity(false);
					}

					//since the projectile goes in an opposite direction to the player we set the recoil components to negative
					projectile.setVelocityX(-rfX * PROJECTILE.speed);
					projectile.setVelocityY(-rfY * PROJECTILE.speed);
					
				}
					
			}
	}

	
}


