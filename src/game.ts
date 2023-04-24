//import 'phaser'
import {
    Game,
    Types
} from 'phaser';
//import Demo from './scenes/demo';
import Demo from './scenes/demo1'
import gameConstants from './constants';

const {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    GRAVITY
} = gameConstants

// 
const gameConfig: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    loader: {
        baseURL: 'assets/',
        maxParallelDownloads: 10
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: GRAVITY
            }
        }
    },
    scene: Demo
};

const game: Game = new Phaser.Game(gameConfig);
