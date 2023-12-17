import 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
	CANVAS_BOUNDS_OFFSET,
    FLOOR_HEIGHT,
	PLAYER,
	PLATFORM,
	BGD_SCROLL_SPEED,
	PROJECTILE
} = gameConstants;

export default class Demo extends Phaser.Scene {
    // player: Phaser.GameObjects.Container;	//player state
	player: Phaser.GameObjects.Sprite;
	platforms: Phaser.GameObjects.Group;	//platform tiles pool
	bgd: Phaser.GameObjects.TileSprite;
	enemies: Phaser.GameObjects.Group;		//enemies pool 
	projectiles: Phaser.Physics.Arcade.Group;	//player single projectiles pool
	platformGenerationConfig: {minY: number, maxY: number, maxTiles: number, minTiles: number};		//config data to set the bounds when dynamically creating platforms
	//counter: {platforms: number};
	cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;		//cursor keys i.e. up, down, left, right, space, shift
	trackPointerKey: Phaser.Input.Keyboard.Key;		//track pointer key is the key that when pressed enables the player to enter 'track pointer' mode
	sspeedMultiplier: number;	//used to increase the scrolling speed of the platforms and enemies (and maybe later) over time

	constructor() {
		super('demo');
	}

	//load the necessary game files like images and spritesheets
	preload(): void {
		this.load.spritesheet('general_ts', 'tilesets/general_tileset_2.png', {frameWidth: 32, frameHeight: 34});
		//this.load.image('beach_ts', 'beach_tileset_2.png');
		this.load.image('projectile', 'laser_projectile.png');
		this.load.image('bgd', 'bgd/beach_bgd.png');
		this.load.spritesheet('player', 'run-ssheet-v3.png', {
			frameWidth: 45,
			frameHeight: 74,
			startFrame: 0,
			endFrame: 4
		});
		this.load.spritesheet('cykrab', 'cykrab_ssheet.png', {
			frameWidth: 75,
			frameHeight: 55,
			startFrame: 0,
			endFrame: 2
		});

	}

	//init the assets and configure the scene at the beginning
	create(): void {
		this.bgd = this.add.tileSprite(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'bgd').setOrigin(0,0);

		//A rectangular object with physics later enabled to prevent player from falling through
        const floor: Phaser.GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT, 0xd1e3ff).setOrigin(0, 0);
		
		//create the platforms and enemies group
		this.platforms = this.add.group();
		this.enemies = this.add.group();

		//init the scroll speed multiplier
		this.sspeedMultiplier = 1;
	
		//init the platforms group state
		this.platforms.classType = Phaser.GameObjects.Image;
		this.platforms.defaultKey = 'general_ts';
		this.platforms.defaultFrame = 1;
		this.platforms.maxSize = PLATFORM.maxTilePoolCapacity;

		//init the enemies group state
		this.enemies.classType = Phaser.GameObjects.Sprite;
		this.enemies.defaultKey = 'cykrab';
		this.enemies.defaultFrame = 1;

		//this is the max number of enemies that can be in the pool (active or inactive) at a time
		this.enemies.maxSize = PLATFORM.maxEnemyPoolCapacity;

		//init the config data (TODO: later i will move this to the main constants file)
		this.platformGenerationConfig = {minY: 32, maxY: CANVAS_HEIGHT - 32, minTiles: 3, maxTiles: 11};

		//set the number of present platforms to 0
		//this.counter = {platforms: 0};

		//init the enemies group state
		this.projectiles = this.physics.add.group();

		//this is the max number of projectiles that can be in the pool (active or inactive) at a time
		this.projectiles.maxSize = PROJECTILE.maxPoolCapacity;

		this.projectiles.classType = Phaser.Physics.Arcade.Image;
		this.projectiles.defaultKey = 'projectile';

		//create the player container which will be composed of the player body and a gun
        // this.player = this.add.container(PLAYER.spawnX, PLAYER.spawnY);
		this.player = this.add.sprite(PLAYER.spawnX, PLAYER.spawnY, 'player', 0);
		// this.player.width = PLAYER.width;
		// this.player.height = PLAYER.height;

		//in this case, we will use plain rectangles as placeholders for "player" and "gun"

		// const p: Phaser.GameObjects.Rectangle = this.add.rectangle(0, 0, PLAYER.width, PLAYER.height, 0xff5b3b);
		// const gun: Phaser.GameObjects.Rectangle = this.add.rectangle(16, -5, 32, 16, 0x32a52);
		// this.player.add(p);
		// this.player.add(gun);

		//set the initial player state data
		this.player.setDataEnabled();
		this.player.setData('isGrounded', false);	//tracks if the player is touching the ground or not
		this.player.setData('trackPointer', false);		//tracks if the player is in "track pointer" mode

		//set the depth of the player to highest so it can render over the background and platforms
		this.player.setDepth(3);	

		//make the player responsive to user input such as left, right
		this.player.setInteractive();

		//init the physics body of the floor and player
        this.physics.add.existing(floor, true);
        this.physics.add.existing(this.player);

		if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
			//make the player unable to go beyond the screen
			this.player.body.setCollideWorldBounds(true, 0, 0.2);

			//set the horizontal drag of the player for a smoother horizontal movement
			this.player.body.setDamping(true);
			this.player.body.setDragX(0.15);

		}
	   
		//a collider between the player and the floor
		this.physics.add.collider(this.player, floor, () => {
			//don't bother rerunning the collider script while the player is already grounded to improve performance
			if (this.player.getData('isGrounded'))
				return;

		    //if player was in 'track pointer' mode then play the move animation from beginning, otherwise resume the move animation	
			if (this.player.getData('trackPointer'))
				this.player.anims.play('player_move');
			else
				this.player.anims.resume();

			//let the game know that the player is currently grounded and not in track pointer mode
			this.player.setData('isGrounded', true);
			this.player.setData('trackPointer', false);

			//reset the rotation of the player to 0
			if (this.player.body instanceof Phaser.Physics.Arcade.Body) 
				this.player.body.rotation = 0;

		});

		//NOTE: add this later
		// this.physics.add.collider(this.projectiles, this.enemies, () => {

		// });

		//create the cursor keys we will use to control the player
		this.cursorKeys = this.input.keyboard.createCursorKeys();

		this.cursorKeys.left.setEmitOnRepeat(true);		//we want the left button to keep running even while it is pressed down
		//as long as the left button is pressed down, flip the player and move the player leftward
		this.cursorKeys.left.on('down', event => {
			if (this.player.body instanceof Phaser.Physics.Arcade.Body)
				this.player.body.setVelocityX(-1 * PLAYER.speedX);
		});

		this.cursorKeys.right.setEmitOnRepeat(true);	//we want the right button to keep running even while it is pressed down
		//as long as the right button is pressed down, move the player rightward
		this.cursorKeys.right.on('down', event => {
			if (this.player.body instanceof Phaser.Physics.Arcade.Body)
				this.player.body.setVelocityX(PLAYER.speedX);
		});

		//enable air mode when you press the space button. Air mode enables the player to fire projectiles while in midair
		this.cursorKeys.space.on('down', event => this.enableAirMode());

		//the track pointer key, when pressed enables 'track pointer' mode which enables the player to rotate while
		//in mid air to continually face the pointer
		this.trackPointerKey = this.input.keyboard.addKey('Q');
		this.trackPointerKey.on('down', event => {
			if (!this.player.getData('isGrounded'))	
				this.player.setData('trackPointer', true);
		});

		//setup the game animations
		////-----------------------
		this.player.anims.create({key: 'player_move', frames: this.anims.generateFrameNumbers('player', {start: 0, end: 3}), repeat: -1, frameRate: 16});
		this.player.anims.create({key: 'player_stagger', frames: this.anims.generateFrameNumbers('player', {frames: [4]}), frameRate: 1});
		this.anims.create({key: 'cykrab_move', frames: this.anims.generateFrameNumbers('cykrab', {start: 0, end: 2}), repeat: -1, frameRate: 10});
		//this.anims.create({key: 'player_jump', frames: this.anims.generateFrameNumbers('player', {frames: [2]})});
		//this.player.anims.chain(['player_move', 'player_stagger']);
		this.player.anims.play('player_move');
		//this.anims.play('cykrab_move', this.enemies.getChildren());

		//create a repeating timed loop that dynamically creates new platforms
		this.time.addEvent({delay: 2500, loop: true, callback: () => this.createPlatforms()});
	   
	}

	createPlatforms(): void {
		//choose a random height to create the new platform 
		const posY: number = Phaser.Math.RND.between(this.platformGenerationConfig.minY, this.platformGenerationConfig.maxY);
		
		//choose a random number of tiles to build the platform with
		const numOfTiles: number = Phaser.Math.RND.between(this.platformGenerationConfig.minTiles, this.platformGenerationConfig.maxTiles); 

		//use inactive tiles already in the pool, otherwise create new ones and populate the platforms
		let x: number = CANVAS_WIDTH+10;
		let tile: Phaser.GameObjects.Image = null;

		for (let i: number = 0; i < numOfTiles; i++) {
			tile = this.platforms.get(x, posY);
			if (!tile)
				return;
			tile.setVisible(true);
			tile.setActive(true);
			x += PLATFORM.tileWidth;
		}

		//use an inactive enemy already in the enemy pool otherwise create a new one
		const enemy: Phaser.GameObjects.Sprite = this.enemies.get(CANVAS_WIDTH+12, posY-PLATFORM.enemyDim.height);
		if (!enemy)
			return;
		enemy.setData({left: CANVAS_WIDTH+10, right: (CANVAS_WIDTH + 10) + numOfTiles*PLATFORM.tileWidth - PLATFORM.enemyDim.width, direction: 1});
		enemy.setVisible(true);
		enemy.setActive(true);
		
		//play the enemy movement animation
		enemy.anims.play('cykrab_move');
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
			// TODO: later, imight further optimize the update loop by only checking if the first active enemy in the pool is beyond boundary
			Phaser.Actions.Call(this.enemies.getChildren(), enemy => {
				//if the enemy is inactive in the pool, then skip it
				if (!enemy.active)
					return;	

				if (enemy instanceof Phaser.GameObjects.Sprite) {
					//if enemy goes past the destroy boundary then stop its current animation and deactivate and hide it
					if (enemy.x < PLATFORM.destroyBoundaryX) {
					    enemy.anims.stop();	
						this.enemies.killAndHide(enemy);
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
		// only check the very first active platform tile in the platforms container
		//and deactivate it if it goes past the destroy boundary
		const tile: Phaser.GameObjects.Image = this.platforms.getFirstAlive();
		if (tile != null && tile.x < PLATFORM.destroyBoundaryX)
			this.platforms.killAndHide(tile);
	}

	//for every frame, for all projectiles, update position of projectile 
	//and check if a projectile is out of bounds and destroys them if so
	updateProjectiles(): void {
		//exit if there are no active projectiles 
		if (this.projectiles.getLength() === 0)
			return;

		//for each laser projectile
		Phaser.Actions.Call(this.projectiles.getChildren(), projectile => {
			//if the projectile is not currently active don't bother updating it every frame
			if (!projectile.active)
				return;
			
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
		//scroll the background left
		this.bgd.tilePositionX += BGD_SCROLL_SPEED;

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
		if (this.player.body instanceof Phaser.Physics.Arcade.Body && this.player instanceof Phaser.GameObjects.Sprite) {

			//if player is grounded i.e. not in midair then make the player jump
			if (this.player.getData('isGrounded')) {
				this.player.body.setVelocityY(-1 * PLAYER.jump);
				this.player.anims.pause(this.player.anims.currentAnim.frames[2]);
				this.player.setData('isGrounded', false);		
			} 

			//fires projectile when 'SPACE' button is pressed while in 'track pointer' mode
			if (this.player.getData('trackPointer')) {
					
					//get the recoil force/direction based on the orientation of the player with the mouse pointer
					const { rfX, rfY }: { rfX: number, rfY: number } = this.calcRecoilForce();
							
					//set the x and y velocity of the player to the product of the recoil direction and recoil speed
					this.player.body.setVelocityX(rfX * PLAYER.recoilSpeed);
					this.player.body.setVelocityY(rfY * PLAYER.recoilSpeed);
					
					console.debug(this.player.anims.get('player_stagger'));
					this.player.anims.pause(this.player.anims.get('player_stagger').frames[0]);

					//create a new projectile at the position of the player
					// const projectile: Phaser.Physics.Arcade.Image = this.projectiles.create(this.player.body.x, this.player.body.y, 'projectile');
					const projectile: Phaser.Physics.Arcade.Image = this.projectiles.get(this.player.x, this.player.y);
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


