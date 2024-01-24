import 'phaser';
import gameConstants from '../constants';

const {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	FLOOR_HEIGHT,
	ENEMY,
	PLATFORM
} = gameConstants;

/*
 Base enemy gameobject template
*/
class Enemy extends Phaser.GameObjects.Sprite {
	parentGroup: Phaser.GameObjects.Group;
	damage: number;

	constructor(scene: Phaser.Scene, parentGroup: Phaser.GameObjects.Group, textureKey: string, damage: number) {
		super(scene, CANVAS_WIDTH + ENEMY.spawnOffset, CANVAS_HEIGHT - FLOOR_HEIGHT, textureKey);
		this.parentGroup = parentGroup;
		this.damage = damage;
	}
}

/*
	A simple enemy that moves from right to left horizontally
*/
export class SimpleScrollEnemy extends Enemy {
	sspeedMultiplier: number;

	constructor(scene: Phaser.Scene, parentGroup: Phaser.GameObjects.Group, textureKey: string, damage: number) {
		super(scene, parentGroup, textureKey, damage);
		this.sspeedMultiplier = 1;
	}

	update(): void {
		if (this.x < PLATFORM.destroyBoundaryX) {
			this.anims.stop();
			this.parentGroup.kill(this);
			return;
		}

		this.setX(-1 * this.x + PLATFORM.initEnemySpeedX * this.sspeedMultiplier);	

		if (this.body instanceof Phaser.Physics.Arcade.StaticBody)
			this.body.updateFromGameObject();
	}
}

/*
//demo red block
export class Block extends Phaser.GameObjects.Rectangle {
	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene, x, y, 50, 50, 0xff0000);
	}

//move the block leftwards and if it goes past 0 then reset it back to 600
	update(): void {
		this.setX(this.x-5);
		if (this.x < 0)
			this.setX(600);
	}
}
*/
