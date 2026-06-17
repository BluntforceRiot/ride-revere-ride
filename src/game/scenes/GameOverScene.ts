import { Scene } from 'phaser';
import { gameAudio } from '../audio';
import { ASSETS } from '../assets';
import { GAME } from '../config';
import { saveHighScore } from '../storage';
import type { RunResult } from '../types';

const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Courier New, monospace',
    fontSize: '20px',
    color: '#f6f1df',
    align: 'center'
};

export class GameOverScene extends Scene {
    private result: RunResult = {
        score: 0,
        alarm: 0,
        deliveries: 0,
        maxCombo: 0,
        reason: 'dawn'
    };

    private initials = '';
    private initialsText!: Phaser.GameObjects.Text;
    private saved = false;

    constructor() {
        super('GameOverScene');
    }

    create(data: Partial<RunResult>) {
        this.result = {
            score: data.score ?? 0,
            alarm: data.alarm ?? 0,
            deliveries: data.deliveries ?? 0,
            maxCombo: data.maxCombo ?? 0,
            reason: data.reason ?? 'dawn'
        };
        this.initials = '';
        this.saved = false;

        this.cameras.main.setBackgroundColor(0x1b1320);
        this.drawBackdrop();
        this.drawPanel(GAME.width / 2, 288, 650, 356, 0x2c2118, 0xc49a57, 0.95);

        const title = this.result.reason === 'dawn' ? 'Run Complete' : 'Ride Failed';

        this.add.text(GAME.width / 2, 76, title, {
            ...textStyle,
            fontSize: '42px',
            color: '#f6df9a',
            stroke: '#090b12',
            strokeThickness: 5
        }).setOrigin(0.5);

        const reason = this.result.reason === 'dawn' ? 'Dawn arrived.' : 'Stamina ran out.';
        this.add.text(GAME.width / 2, 160, [
            reason,
            `Final Score: ${this.result.score}`,
            `Alarm Meter: ${this.result.alarm}/100`,
            `Deliveries Made: ${this.result.deliveries}`,
            `Max Combo: x${this.result.maxCombo}`
        ], {
            ...textStyle,
            color: '#fff2cc',
            stroke: '#120d09',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(GAME.width / 2, 310, 'Enter 3 initials', {
            ...textStyle,
            color: '#d9ecff',
            stroke: '#120d09',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.initialsText = this.add.text(GAME.width / 2, 362, '_ _ _', {
            ...textStyle,
            fontSize: '46px',
            color: '#ffefb5',
            stroke: '#120d09',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(GAME.width / 2, 416, 'Type letters, Backspace to edit', {
            ...textStyle,
            fontSize: '16px',
            color: '#d8c9a7',
            stroke: '#120d09',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(GAME.width / 2, 444, 'Enter: save score    Esc/S: skip', {
            ...textStyle,
            fontSize: '16px',
            color: '#ffefb5',
            stroke: '#120d09',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.input.keyboard?.on('keydown', this.handleKeyDown);
        this.events.once('shutdown', this.cleanUp);
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (this.saved) {
            return;
        }

        if (event.code === 'Escape' || event.code === 'KeyS') {
            event.preventDefault();
            this.skipAndContinue();
            return;
        }

        if (event.code === 'Backspace') {
            event.preventDefault();
            this.initials = this.initials.slice(0, -1);
            this.updateInitialsText();
            return;
        }

        if (event.code === 'Enter') {
            event.preventDefault();

            if (this.initials.length === 3) {
                this.saveAndContinue();
            }

            return;
        }

        const key = event.key.toUpperCase();

        if (/^[A-Z]$/.test(key) && this.initials.length < 3) {
            this.initials += key;
            this.updateInitialsText();
        }
    };

    private updateInitialsText() {
        this.initialsText.setText(this.initials.padEnd(3, '_').split('').join(' '));
    }

    private saveAndContinue() {
        this.saved = true;

        saveHighScore({
            initials: this.initials,
            score: this.result.score,
            alarm: this.result.alarm,
            deliveries: this.result.deliveries,
            maxCombo: this.result.maxCombo,
            date: new Date().toISOString()
        });
        gameAudio.playSave();

        this.scene.start('HighScoreScene');
    }

    private skipAndContinue() {
        this.saved = true;
        this.scene.start('HighScoreScene');
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
        this.add.rectangle(0, 0, GAME.width, GAME.height, 0x080b12).setOrigin(0).setAlpha(0.32);
    }

    private drawPanel(x: number, y: number, width: number, height: number, fill: number, stroke: number, alpha: number) {
        this.add.rectangle(x, y, width, height, fill, alpha)
            .setStrokeStyle(3, stroke, 0.86);
        this.add.rectangle(x, y, width - 20, height - 20, fill, 0)
            .setStrokeStyle(1, 0xf6df9a, 0.45);
    }

    private cleanUp = () => {
        this.input.keyboard?.off('keydown', this.handleKeyDown);
    };
}
