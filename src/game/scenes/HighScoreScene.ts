import { Scene } from 'phaser';
import { ASSETS } from '../assets';
import { GAME } from '../config';
import { clearHighScores, loadHighScores } from '../storage';

const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Courier New, monospace',
    fontSize: '20px',
    color: '#f6f1df',
    align: 'center'
};

export class HighScoreScene extends Scene {
    private resetPromptText!: Phaser.GameObjects.Text;
    private resetConfirmUntil: number = 0;

    constructor() {
        super('HighScoreScene');
    }

    create(data: { cleared?: boolean } = {}) {
        this.resetConfirmUntil = 0;
        this.cameras.main.setBackgroundColor(0x101624);
        this.drawBackdrop();
        this.drawPanel(GAME.width / 2, 284, 760, 396, 0x101f38, 0x5f8fc5, 0.94);

        this.add.text(GAME.width / 2, 72, 'High Scores', {
            ...textStyle,
            fontSize: '44px',
            color: '#f6df9a',
            stroke: '#090b12',
            strokeThickness: 5
        }).setOrigin(0.5);

        const highScores = loadHighScores();

        if (highScores.length === 0) {
            this.add.text(GAME.width / 2, 228, 'No warnings delivered yet.', {
                ...textStyle,
                stroke: '#080b12',
                strokeThickness: 3
            }).setOrigin(0.5);
        } else {
            highScores.forEach((entry, index) => {
                const y = 142 + index * 30;
                const row = `${(index + 1).toString().padStart(2, '0')}. ${entry.initials}  ${entry.score.toString().padStart(5, ' ')}  Alarm ${entry.alarm.toString().padStart(3, ' ')}  Combo x${entry.maxCombo}`;

                this.add.rectangle(GAME.width / 2, y + 1, 666, 24, index === 0 ? 0x3b2a15 : 0x0b1426, 0.54);
                this.add.text(GAME.width / 2, y, row, {
                    ...textStyle,
                    fontSize: '18px',
                    color: index === 0 ? '#ffefb5' : '#f6f1df',
                    stroke: '#080b12',
                    strokeThickness: 3
                }).setOrigin(0.5);
            });
        }

        this.add.text(GAME.width / 2, 474, 'Enter/Space: play again    T/Esc: title', {
            ...textStyle,
            fontSize: '16px',
            color: '#c8dcf2',
            stroke: '#080b12',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.resetPromptText = this.add.text(
            GAME.width / 2,
            506,
            data.cleared ? 'Local scores cleared.' : 'R: reset local scores',
            {
                ...textStyle,
                fontSize: '16px',
                color: data.cleared ? '#ffefb5' : '#c8dcf2',
                stroke: '#080b12',
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        this.input.keyboard?.on('keydown', this.handleKeyDown);
        this.events.once('shutdown', this.cleanUp);
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Enter' || event.code === 'Space') {
            event.preventDefault();
            this.scene.start('GameScene');
            return;
        }

        if (event.code === 'KeyT' || event.code === 'Escape') {
            event.preventDefault();
            this.scene.start('TitleScene');
            return;
        }

        if (event.code === 'KeyR') {
            event.preventDefault();
            this.handleResetRequest();
        }
    };

    private handleResetRequest() {
        if (this.time.now <= this.resetConfirmUntil) {
            clearHighScores();
            this.scene.restart({ cleared: true });
            return;
        }

        this.resetConfirmUntil = this.time.now + 3000;
        this.resetPromptText.setText('Press R again to clear local scores.');
        this.resetPromptText.setColor('#ffefb5');

        this.time.delayedCall(3000, () => {
            if (this.time.now >= this.resetConfirmUntil) {
                this.resetConfirmUntil = 0;
                this.resetPromptText.setText('R: reset local scores');
                this.resetPromptText.setColor('#c8dcf2');
            }
        });
    }

    private drawBackdrop() {
        this.add.rectangle(0, 0, GAME.width, GAME.height, 0x0a0f1d).setOrigin(0);
        this.add.image(0, 70, ASSETS.environment.nightSkyline)
            .setOrigin(0, 0)
            .setDisplaySize(GAME.width, 180)
            .setAlpha(0.62);
        this.add.circle(790, 74, 28, 0xf5eccf).setAlpha(0.9);
        this.add.rectangle(0, GAME.road.bottom, GAME.width, GAME.height - GAME.road.bottom, 0x1f361f)
            .setOrigin(0)
            .setAlpha(0.85);
        this.add.rectangle(0, 0, GAME.width, GAME.height, 0x080b12).setOrigin(0).setAlpha(0.34);
    }

    private drawPanel(x: number, y: number, width: number, height: number, fill: number, stroke: number, alpha: number) {
        this.add.rectangle(x, y, width, height, fill, alpha)
            .setStrokeStyle(3, stroke, 0.82);
        this.add.rectangle(x, y, width - 20, height - 20, fill, 0)
            .setStrokeStyle(1, 0xf6df9a, 0.38);
    }

    private cleanUp = () => {
        this.input.keyboard?.off('keydown', this.handleKeyDown);
    };
}
