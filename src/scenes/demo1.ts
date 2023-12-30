import 'phaser';
import gameConstants from '../constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
	OVERLAY_HEIGHT,
	PLAYER_ICON,
	CANVAS_BOUNDS_OFFSET,
    FLOOR_HEIGHT,
	PLAYER,
	PLATFORM,
	BGD_SCROLL_SPEED,
	PROJECTILE,
	ENEMY
} = gameConstants;

export default class Demo extends Phaser.Scene {
    // player: Phaser.GameObjects.Container;	//player state
	player: Phaser.GameObjects.Container;
	platforms: Phaser.GameObjects.Group;	//platform tiles pool
	bgd: Phaser.GameObjects.TileSprite;
	//floor: Phaser.GameObjects.Rectangle;
	overlay: Phaser.GameObjects.TileSprite;
	scrollSpeed: {bgd: number, overlay: number};
	enemies: Phaser.GameObjects.Group;		//enemies pool 
	projectiles: Phaser.Physics.Arcade.Group;	//player single projectiles pool
	uiLayer: Phaser.GameObjects.Layer;
	//floorSmokes: Phaser.GameObjects.Group;	//pool for the floor smokes that spawn when the projectiles overlap the floor

	healthBar: Phaser.GameObjects.Rectangle;
	platformGenerationConfig: {minY: number, maxY: number, maxTiles: number, minTiles: number};		//config data to set the bounds when dynamically creating platforms
	//counter: {platforms: number};
	cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;		//cursor keys i.e. up, down, left, right, space, shift
	trackPointerKey: Phaser.Input.Keyboard.Key;		//track pointer key is the key that when pressed enables the player to enter 'track pointer' mode
	sspeedMultiplier: number;	//used to increase the scrolling speed of the platforms and enemies (and maybe later) over time

	//tweens
	//------
	playerFlashTween: Phaser.Tweens.Tween;
	healthBarDropTween: Phaser.Tweens.Tween;


	constructor() {
		super('demo');
	}

	//load the necessary game files like images and spritesheets
	preload(): void {
		this.load.image('player_icon', 'lovelight-icon.png');
		this.load.spritesheet('general_ts', 'tilesets/general_tileset_2.png', {frameWidth: 32, frameHeight: 34});
		//this.load.image('beach_ts', 'beach_tileset_2.png');
		this.load.image('projectile', 'laser_projectile.png');
		this.load.image('bgd', 'bgd/beach_bgd.png');
		this.load.image('overlay', 'bgd/lagoon-overlay.png');
		this.load.image('floor_smoke', 'floor_smoke.png');
		this.load.spritesheet('player', 'p-run-ssheet.png', {
			frameWidth: 45,
			frameHeight: 74,
			startFrame: 0,
		});
		this.load.spritesheet('hands', 'hands-ssheet.png', {
			frameWidth: 19,
			frameHeight: 23,
			startFrame: 0,
			endFrame: 1
		});
		this.load.spritesheet('gun', 'pgun-ssheet.png', {
			frameWidth: 41,
			frameHeight: 21,
			startFrame: 0,
			endFrame: 1
		});

		this.load.spritesheet('cykrab', 'cykrab_ssheet.png', {
			frameWidth: 75,
			frameHeight: 55,
			startFrame: 0,
			endFrame: 2
		});
		this.load.spritesheet('dust_trail', 'dust-trail.png', {
			frameWidth: 54,
			frameHeight: 20,
			startFrame: 0,
			endFrame: 1
		});
		this.load.spritesheet('poof', 'poof.png', {
			frameWidth: 32,
			frameHeight: 32,
			startFrame: 0,
			endFrame: 1
		});

	}

	//init the assets and configure the scene at the beginning
	create(): void {
		//init the background and overlay and set the horizontal scrolling speed
		this.bgd = this.add.tileSprite(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'bgd').setOrigin(0,0);
		this.overlay = this.add.tileSprite(0, CANVAS_HEIGHT-OVERLAY_HEIGHT, CANVAS_WIDTH, OVERLAY_HEIGHT, 'overlay').setOrigin(0,0); 

		//we want the overlay to scroll twice as fast as the background to induce that nice parallax effect but feel free to tweak this to your liking
		//also notice we are setting this parameter in the create method and not in the update loop/method, this is because the create method is called only once after the game has loaded
		//b4 the game begins, while the update loop is called once per frame depending on the frame rate so if our game was 24 fps for example, we will be calculating 2 * BGD_SCROLL_SPEED
		//24 times per second which modern CPUs can handle easily but its redundant and so we chose to instead calculate it here and store it in memory to save some extra milli or nanoseconds
		// of processing hence a simple optimization trick you need to always watch out for
		this.scrollSpeed = {bgd: BGD_SCROLL_SPEED, overlay: BGD_SCROLL_SPEED * 2};

		//TODO: setup the health bar and player icon
		const playerIcon: Phaser.GameObjects.Image = this.add.image(50, 50, 'player_icon').setOrigin(0,0);
		this.healthBar = this.add.rectangle(50 + PLAYER_ICON.width, 50, PLAYER.health, PLAYER_ICON.height/2, 0x09D805).setOrigin(0,0);
		
		this.uiLayer = this.add.layer([playerIcon, this.healthBar]);
		//this.uiLayer.add([playerIcon, this.healthBar]);
		this.uiLayer.setDepth(11);

		//A rectangular object with physics later enabled to prevent player from falling through
        const floor: Phaser.GameObjects.Rectangle = this.add.rectangle(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT, 0xd1e3ff).setOrigin(0, 0);
		floor.setVisible(false);	

		//create the platforms and enemies group
		this.platforms = this.add.group();
		this.enemies = this.physics.add.staticGroup();

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

		//[redacted] set the number of present platforms to 0
		//this.counter = {platforms: 0};

		//init the projectiles group
		this.projectiles = this.physics.add.group();

		//this is the max number of projectiles that can be in the pool (active or inactive) at a time
		this.projectiles.maxSize = PROJECTILE.maxPoolCapacity;

		//the projectile will be rendered as an image and not a sprite since it has no animations
		this.projectiles.classType = Phaser.Physics.Arcade.Image;
		this.projectiles.defaultKey = 'projectile';

		/*
		this.floorSmokes = this.add.group();
		this.floorSmokes.maxSize = 5;
		this.floorSmokes.classType = Phaser.GameObjects.Image;
		this.floorSmokes.defaultKey = 'floor_smoke';
		*/

		//we created the player as a container of game objects instead of a regular sprite because in the future we would like to be able to customize the player's attributes
		//such as clothes, type of guns etc and to do so efficiently would mean to split the player into several components to allow easier customization and mix and match
        this.player = this.add.container(PLAYER.spawnX, PLAYER.spawnY);
		//this.player = this.add.sprite(PLAYER.spawnX, PLAYER.spawnY, 'player', 0);
		this.player.width = PLAYER.width;
		this.player.height = PLAYER.height;

		//create the sprite body parts that make up the player
		const body: Phaser.GameObjects.Sprite = this.add.sprite(0, 0, 'player', 0);
		body.setName('body');
		const gun: Phaser.GameObjects.Sprite = this.add.sprite(0, 0, 'gun', 0);
		gun.setName('gun');
		const hands: Phaser.GameObjects.Sprite = this.add.sprite(1, -2, 'hands', 0);
		hands.setName('hands');
		const dustTrail: Phaser.GameObjects.Sprite = this.add.sprite(-PLAYER.width/2, PLAYER.height/2 - 4, 'dust_trail');
		dustTrail.setName('dust');

		//add the sprite parts to the player container
		this.player.add(body);
		this.player.add(gun);
		this.player.add(hands);
		this.player.add(dustTrail);

		//set the initial player state data
		this.player.setDataEnabled();
		this.player.setData('isGrounded', false);	//tracks if the player is touching the ground or not
		this.player.setData('trackPointer', false);		//tracks if the player is in "track pointer" mode
		this.player.setData('health', PLAYER.health);	//tracks the health level of the player. As long as the health is greater than 0, the game continues
		this.player.setState(0);	//the state of the player tracks whether the player is hit by an enemy or projectile or not hit. 1 when hit and 0 when not

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

			//set the horizontal drag of the player for a less slippery horizontal movement
			this.player.body.setDamping(true);
			this.player.body.setDragX(0.15);

		}
	   
		//setting up the colliders
		//-------------------------
		//a collider between the player and the floor
		this.physics.add.collider(this.player, floor, () => {
			//don't bother rerunning the collider script while the player is already grounded to improve performance
			if (this.player.getData('isGrounded'))
				return;

			this.player.getByName('dust').setActive(true);
			//@ts-ignore
			this.player.getByName('dust').setVisible(true);

			//since at the beginning when the player is spawned mid air we set this here so that if the dust trail animation isn't already playing we can play it like this
			//@ts-ignore
			if (!this.player.getByName('dust').anims.isPlaying)
				//@ts-ignore
				this.player.getByName('dust').anims.play('trail_dust');

			//@ts-ignore: Container only returns objects of type 'GameObject' and so fails compilation when accessing 'anims' property and type assertion does not work
			//but we are certain they are all sprites
			this.player.getByName('body').anims.play('player_move', true);
			//@ts-ignore
			this.player.getByName('gun').anims.play('gun_move', true);
			//@ts-ignore
			this.player.getByName('hands').anims.play('hands_move', true);
			//this.player.getByName('dust').anims.play('trail_dust');

			//let the game know that the player is currently grounded and not in track pointer mode
			this.player.setData('isGrounded', true);
			this.player.setData('trackPointer', false);

			//reset the rotation of the player to 0
			if (this.player.body instanceof Phaser.Physics.Arcade.Body) 
				this.player.body.rotation = 0;

		});

		//check for when a projectile overlaps (hits) an enemy 
		 this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
			if (!enemy.active)
				return;
			 //console.log('killed an enemy');
			 //deactivate and hide the projectile to be recycled back in the loop
			this.projectiles.killAndHide(projectile);
			//@ts-ignore: Workaround an unidentified type to prevent typescript from throwing error
			//play the 'poof' smoke animation on the enemy
			enemy.anims.play('poof');
			//@ts-ignore
			//once the animation finishes, deactivate and hide the enemy to be recycled back in the pool
			enemy.on('animationcomplete', event => this.enemies.killAndHide(enemy));
		});

		//collider between player and enemy, for now we will only cause a certain animation frame to pop up on collision, TODO: later on w will implement a proper
		//health system where after a certain number of collisions the player passes out and the scene ends or restarts
		this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
			if (!enemy.active)
				return;

			this.hurtPlayer(player as Phaser.GameObjects.Container, ENEMY.damage);
		});

		//create the cursor keys we will use to control the player
		this.cursorKeys = this.input.keyboard.createCursorKeys();

		this.cursorKeys.left.setEmitOnRepeat(true);		//we want the left button to keep running even while it is pressed down
		//as long as the left button is pressed down, move the player leftward
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

		//enable air mode when you press the space button. Air mode enables the player to jump and fire projectiles while in midair
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
		//player body animations
		//@ts-ignore: Bypass type checking because i am sure all gameobjects in the 'player' container are sprites and not base 'gameobjects'
		this.player.getByName('body').anims.create({key: 'player_move', frames: this.anims.generateFrameNumbers('player', {start: 0, end: 3}), repeat: -1, frameRate: 16});
		//@ts-ignore: Same as comment above
		this.player.getByName('body').anims.create({key: 'player_stagger', frames: this.anims.generateFrameNumbers('player', {frames: [4]}), frameRate: 1});
		//@ts-ignore
		this.player.getByName('body').anims.create({key: 'player_hit', frames: this.anims.generateFrameNumbers('player', {frames: [5]}), frameRate: 1});

		//gun animations
		//@ts-ignore: same as above
		this.player.getByName('gun').anims.create({key: 'gun_move', frames: this.anims.generateFrameNumbers('gun', {start: 0, end: 1}), repeat: -1, frameRate: 8});

		//hand animations
		//@ts-ignore: same as comments above
		this.player.getByName('hands').anims.create({key: 'hands_move', frames: this.anims.generateFrameNumbers('hands', {start: 0, end: 1}), repeat: -1, frameRate: 8});

		//@ts-ignore
		this.player.getByName('dust').anims.create({key: 'trail_dust', frames: this.anims.generateFrameNumbers('dust_trail', {start: 0, end: 1}), repeat: -1, frameRate: 8});


		this.anims.create({key: 'cykrab_move', frames: this.anims.generateFrameNumbers('cykrab', {start: 0, end: 2}), repeat: -1, frameRate: 10});
		this.anims.create({key: 'poof', frames: this.anims.generateFrameNumbers('poof', {start: 0, end: 1}), frameRate: 8});
		//this.anims.create({key: 'player_jump', frames: this.anims.generateFrameNumbers('player', {frames: [2]})});
		//this.player.anims.chain(['player_move', 'player_stagger']);
		//@ts-ignore: same as comment above
		this.player.getByName('body').anims.play('player_move');
		//@ts-ignore
		this.player.getByName('gun').anims.play('gun_move');
		//@ts-ignore
		this.player.getByName('hands').anims.play('hands_move');

		//hide the dust trail in the beginning while the player has not landed on the ground
		//@ts-ignore
		this.player.getByName('dust').setVisible(false);
		this.player.getByName('dust').setActive(false);
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

					//sync the physics body with the updated position since it is a static body that is not automatically updated
					if (enemy.body instanceof Phaser.Physics.Arcade.StaticBody)
						enemy.body.updateFromGameObject();

				}},this);
			
		}

		//optimized removal of tiles, instead of checking every single tile per frame which is bad for performance,
		// only check the very first active platform tile in the platforms container
		//and deactivate it if it goes past the destroy boundary
		const tile: Phaser.GameObjects.Image = this.platforms.getFirstAlive();
		if (tile != null && tile.x < PLATFORM.destroyBoundaryX)
			this.platforms.killAndHide(tile);
	}

	//causes the player to lose some health and be momentarily invincible
	hurtPlayer(player: Phaser.GameObjects.Container, damage: number): void {
			//if the player has very recently been hit then exit
			if (player.state)
				return;

			player.setState(1);		//signify that the player has been hit
			setTimeout(() => {
				player.setState(0);
				//@ts-ignore
				player.setAlpha(1);
				this.tweens.remove(this.playerFlashTween);
				this.tweens.remove(this.healthBarDropTween);
			}, 2500);		//make the player 'unhit' after 2.5s has elapsed

			//calculate the new health based on the damage received and the current health
			let newHealth: number = this.player.getData('health') - damage;

			//play the player flashing effect
			this.playerFlashTween = this.tweens.addCounter({from: 0, to: 1, duration: 500, loop: 3});
		
			//TODO: later replace this with code such that when the health of the player is less than 0, the scene ends or the game restarts
			if (newHealth < 0)
				newHealth = 0;

			//this tween ensures that the health bar drops more smoothly
			this.healthBarDropTween = this.tweens.addCounter({from: this.player.getData('health'), to: newHealth, duration: 250});
			
			//update the players health
			this.player.setData('health', newHealth);

			//if the player is not grounded
			if (!player.getData('isGrounded'))
				//@ts-ignore
				player.getByName('body').anims.pause(player.getByName('body').anims.get('player_hit').frames[0]);
	
			//give the player a small push back
			//@ts-ignore
			player.body.setVelocityX(-100);

    }

	//for every frame, for all projectiles, update position of projectile 
	//and check if a projectile is out of bounds and destroys them if so
	updateProjectiles(): void {
		//exit if there are no active projectiles 
		if (this.projectiles.getLength() === 0)
			return;

		//for each fired projectile
		Phaser.Actions.Call(this.projectiles.getChildren(), projectile => {
			//if the projectile is not currently active don't bother updating it every frame
			if (!projectile.active)
				return;
			
			if (projectile.body instanceof Phaser.Physics.Arcade.Body)
				//update the angle of the projectile
				projectile.body.rotation = projectile.state as number;
				
			//deactivate projectile and send it back to the pool for recycling if it goes out of bounds
			if (projectile instanceof Phaser.Physics.Arcade.Image && !this.isInBounds(projectile)) { 
				// this.projectiles.remove(projectile,true,true);
				this.projectiles.killAndHide(projectile);
				return;
			}	

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

		//if the player is hurt update the players opacity
		if (this.player.state) {
			this.player.setAlpha(this.playerFlashTween.getValue());
			this.healthBar.setSize(this.healthBarDropTween.getValue(), this.healthBar.height);
		}
		//update the projectiles fired by the player
		this.updateProjectiles();

		//scroll the background and overlay leftward
		this.bgd.tilePositionX += this.scrollSpeed.bgd;
		this.overlay.tilePositionX += this.scrollSpeed.overlay;

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
				//@ts-ignore: Bypass type checking since we are sure that the object returned by getAt() is a sprite and not a base gameobject specified by the phase docs
				//now we can call the 'anims' property without running into a type error
				this.player.getByName('body').anims.pause(this.player.getByName('body').anims.currentAnim.frames[2]);
				//@ts-ignore
				this.player.getByName('gun').anims.pause(this.player.getByName('gun').anims.currentAnim.frames[0]);
				//@ts-ignore
				this.player.getByName('hands').anims.pause(this.player.getByName('hands').anims.currentAnim.frames[0]);
				
				//pause and hide the trail dust animation
				//@ts-ignore
				this.player.getByName('dust').anims.pause();
				//@ts-ignore
				this.player.getByName('dust').setVisible(false);
				this.player.getByName('dust').setActive(false);

				this.player.setData('isGrounded', false);		
			} 

			//fires projectile when 'SPACE' button is pressed while in 'track pointer' mode
			if (this.player.getData('trackPointer')) {
					
					//get the recoil force/direction based on the orientation of the player with the mouse pointer
					const { rfX, rfY }: { rfX: number, rfY: number } = this.calcRecoilForce();
							
					//set the x and y velocity of the player to the product of the recoil direction and recoil speed
					this.player.body.setVelocityX(rfX * PLAYER.recoilSpeed);
					this.player.body.setVelocityY(rfY * PLAYER.recoilSpeed);
				
					//console.debug(this.player.getAt(2).anims.get('player_stagger'));
					//@ts-ignore: same as above
					this.player.getByName('body').anims.pause(this.player.getByName('body').anims.get('player_stagger').frames[0]);

					//create a new projectile at the position of the player
					// const projectile: Phaser.Physics.Arcade.Image = this.projectiles.create(this.player.body.x, this.player.body.y, 'projectile');
					const projectile: Phaser.Physics.Arcade.Image = this.projectiles.get(this.player.x, this.player.y);
					if (!projectile)
						return;
					//projectile.setTexture('projectile');
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


