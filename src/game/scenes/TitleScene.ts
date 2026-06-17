import { Scene } from 'phaser';
import { gameAudio } from '../audio';
import { ASSETS, preloadVisualAssets } from '../assets';
import { GAME } from '../config';

const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Courier New, monospace',
    fontSize: '20px',
    color: '#f6f1df',
    align: 'center'
};

export class TitleScene extends Scene {
    private soundText!: Phaser.GameObjects.Text;
    private howToOverlay?: Phaser.GameObjects.Container;

    constructor() {
        super('TitleScene');
    }

    preload() {
        preloadVisualAssets(this);
    }

    create() {
        this.cameras.main.setBackgroundColor(0x12172a);
        this.drawBackdrop();

        this.add.text(GAME.width / 2, 366, [
            'Arrow keys/WASD: move lanes',
            'Space: throw broadside'
        ], {
            ...textStyle,
            color: '#f6f1df',
            stroke: '#080b12',
            strokeThickness: 4
        }).setOrigin(0.5);

        const promptText = this.add.text(GAME.width / 2, 424, 'Enter/Space: start    H: high scores    I/?: how to play', {
            ...textStyle,
            fontSize: '18px',
            color: '#ffefb5',
            stroke: '#080b12',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({
            targets: promptText,
            alpha: 0.72,
            duration: 980,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.soundText = this.add.text(GAME.width - 24, 500, '', {
            ...textStyle,
            fontSize: '14px',
            color: '#a9c6d8',
            stroke: '#080b12',
            strokeThickness: 3
        }).setOrigin(1, 0.5);

        this.add.text(GAME.width / 2, 500, 'v0.9.2 browser demo prototype', {
            ...textStyle,
            fontSize: '14px',
            color: '#839bb1',
            stroke: '#080b12',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.updateSoundText();

        this.input.keyboard?.on('keydown', this.handleKeyDown);
        this.events.once('shutdown', this.cleanUp);
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Enter' || event.code === 'Space') {
            event.preventDefault();
            gameAudio.resume();
            this.scene.start('GameScene');
            return;
        }

        if (event.code === 'KeyM') {
            event.preventDefault();
            gameAudio.toggleMute();
            this.updateSoundText();
            return;
        }

        if (event.code === 'KeyI' || event.code === 'Slash') {
            event.preventDefault();
            this.toggleHowTo();
            return;
        }

        if (event.code === 'Escape' && this.howToOverlay?.visible) {
            event.preventDefault();
            this.toggleHowTo(false);
            return;
        }

        if (event.code === 'KeyH') {
            this.scene.start('HighScoreScene');
        }
    };

    private cleanUp = () => {
        this.input.keyboard?.off('keydown', this.handleKeyDown);
    };

    private drawBackdrop() {
        this.add.image(GAME.width / 2, GAME.height / 2, ASSETS.screens.title)
            .setDisplaySize(GAME.width, GAME.height);
        this.add.rectangle(0, 322, GAME.width, 204, 0x060914).setOrigin(0).setAlpha(0.72);
        this.add.rectangle(GAME.width / 2, 402, 610, 138, 0x0d1524, 0.78)
            .setStrokeStyle(2, 0xb58a4e, 0.7);
    }

    private toggleHowTo(forceVisible?: boolean) {
        if (!this.howToOverlay) {
            this.howToOverlay = this.createHowToOverlay();
        }

        const visible = forceVisible ?? !this.howToOverlay.visible;

        this.howToOverlay.setVisible(visible);
    }

    private createHowToOverlay() {
        const panel = this.add.rectangle(0, 0, 690, 344, 0x101828, 0.96)
            .setStrokeStyle(3, 0xd6a85d, 0.9);
        const inner = this.add.rectangle(0, 0, 660, 314, 0x101828, 0)
            .setStrokeStyle(1, 0xf4d18a, 0.42);
        const title = this.add.text(0, -138, 'How To Play', {
            ...textStyle,
            fontSize: '28px',
            color: '#ffefb5',
            stroke: '#080b12',
            strokeThickness: 4
        }).setOrigin(0.5);
        const body = this.add.text(-292, -86, [
            'Move lanes: Arrow keys or WASD',
            'Throw broadside: Space',
            'Hit buildings to raise alarm and score points',
            'Avoid tax collectors, loyalists, tea tables,',
            'barrels, and mud',
            'Combo hits multiply score',
            'Wake the town before dawn'
        ], {
            ...textStyle,
            fontSize: '17px',
            color: '#f6f1df',
            align: 'left',
            stroke: '#080b12',
            strokeThickness: 3
        }).setOrigin(0, 0);
        const footer = this.add.text(0, 134, 'I/Esc: close    M: mute', {
            ...textStyle,
            fontSize: '16px',
            color: '#a9c6d8',
            stroke: '#080b12',
            strokeThickness: 3
        }).setOrigin(0.5);

        return this.add.container(GAME.width / 2, GAME.height / 2, [
            panel,
            inner,
            title,
            body,
            footer
        ]).setVisible(false);
    }

    private updateSoundText() {
        this.soundText.setText(`M: ${gameAudio.getLabel()}`);
    }
}
