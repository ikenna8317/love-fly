import 'phaser';
import gameConstants from '../constants';

const {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	ENEMY,
	EVENTS,
	PLATFORM
} = gameConstants;


//Base enemy class
class Enemy extends Phaser.Physics.Arcade.Sprite {
	sspeedMultiplier: number;
	damage: number;

	constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string, damage: number = 0) {
		super(scene, x, y, textureKey);
		this.sspeedMultiplier = 1;
		this.damage = damage;

		scene.physics.add.existing(this);
	}

	update(): void {
		if (this.x < -PLATFORM.destroyBoundaryX) 
			this.disableBody(true);
		
	}
}

/*
	A simple enemy that moves from right to left horizontally
*/
class SimpleScrollEnemy extends Enemy {
	speedX: number;

	constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string, speedX: number, damage: number = 0) {
		super(scene, x, y, textureKey, damage);
		this.speedX = speedX;

		setTimeout(() => this.start(), 100);
		return this;
	}

	start(): void {
		this.setVelocityX(-this.speedX);
	}

	update(): void {
		super.update();
	}
}

export class Bogey extends SimpleScrollEnemy {
	constructor(scene: Phaser.Scene) {
		super(scene, CANVAS_WIDTH + ENEMY.spawnOffset, CANVAS_HEIGHT - 50, 'bogey', 50);
	}
}
