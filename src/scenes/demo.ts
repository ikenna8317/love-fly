import 'phaser';
import gameConstants from '../constants';
import { Block } from '../gameobjs/enemy';

export default class Demo extends Phaser.Scene {

	blocks: Phaser.GameObjects.Group;

	constructor() {
		super('template');
	}

	create(): void {
		this.blocks = this.add.group();
		this.blocks.classType = Block;
		this.blocks.runChildUpdate = true;
	
		this.blocks.get(900, 100);
		this.blocks.get(900, 200);
		this.blocks.get(900, 300);
		return;	
	}
}
