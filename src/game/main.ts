import { AUTO, Game, Scale } from 'phaser';
import { GAME } from './config';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HighScoreScene } from './scenes/HighScoreScene';
import { TitleScene } from './scenes/TitleScene';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME.width,
    height: GAME.height,
    parent: 'game-container',
    backgroundColor: '#12172a',
    pixelArt: true,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        TitleScene,
        GameScene,
        GameOverScene,
        HighScoreScene
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
