import { Geom, Math as PhaserMath, Scene } from 'phaser';
import { gameAudio } from '../audio';
import { ASSETS } from '../assets';
import {
    DEBUG_VISUALS,
    FLAVOR_LINES,
    GAME,
    HAZARD_NAMES,
    HAZARD_STYLES,
    TARGET_NAMES,
    TARGET_STYLES
} from '../config';
import type { RunEndReason, RunResult } from '../types';

type RouteEntityKind = 'target' | 'hazard';
type TargetName = (typeof TARGET_NAMES)[number];
type HazardName = (typeof HAZARD_NAMES)[number];
type WaveType = keyof typeof GAME.spawnDirector.early.weights;
type SpawnBand =
    | typeof GAME.spawnDirector.early
    | typeof GAME.spawnDirector.mid
    | typeof GAME.spawnDirector.late;
type ScrollingDecor = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

interface RouteEntity {
    kind: RouteEntityKind;
    name: TargetName | HazardName;
    laneIndex: number;
    x: number;
    y: number;
    age: number;
    width: number;
    height: number;
    warned: boolean;
    container: Phaser.GameObjects.Container;
    body: Phaser.GameObjects.Rectangle;
    sprite?: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    debugObjects: Phaser.GameObjects.GameObject[];
}

interface Broadside {
    x: number;
    y: number;
    age: number;
    width: number;
    height: number;
    hit: boolean;
    trail: Phaser.GameObjects.Rectangle;
    container: Phaser.GameObjects.Container;
}

const hudStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Courier New, monospace',
    fontSize: '18px',
    color: '#fff6cf'
};

const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    color: '#1b1320',
    align: 'center'
};

export class GameScene extends Scene {
    private player!: Phaser.GameObjects.Container;
    private playerBody!: Phaser.GameObjects.Rectangle;
    private playerSprite!: Phaser.GameObjects.Image;
    private playerLabel!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private staminaText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private deliveriesText!: Phaser.GameObjects.Text;
    private alarmText!: Phaser.GameObjects.Text;
    private alarmBar!: Phaser.GameObjects.Graphics;
    private alarmFlash!: Phaser.GameObjects.Rectangle;
    private muteText!: Phaser.GameObjects.Text;

    private roadDecor: ScrollingDecor[] = [];
    private entities: RouteEntity[] = [];
    private broadsides: Broadside[] = [];

    private currentLaneIndex: number = 1;
    private targetLaneIndex: number = 1;
    private playerY: number = GAME.lanes[1];
    private score: number = 0;
    private alarm: number = 0;
    private stamina: number = GAME.startingStamina;
    private deliveries: number = 0;
    private combo: number = 0;
    private maxCombo: number = 0;
    private timeRemaining: number = GAME.timerSeconds;
    private cooldownRemainingMs: number = 0;
    private waveSpawnMs: number = GAME.spawnDirector.firstWaveMs;
    private invulnerabilityMs: number = 0;
    private dustSpawnMs: number = 0;
    private flavorIndex: number = 0;
    private alarmThresholdsShown = new Set<number>();
    private debugVisuals: boolean = DEBUG_VISUALS;
    private runActive = true;

    constructor() {
        super('GameScene');
    }

    create() {
        this.resetRunState();
        this.cameras.main.setBackgroundColor(0x12172a);
        this.drawRoute();
        this.createPlayer();
        this.createHud();
        this.updateHud();

        this.input.keyboard?.on('keydown', this.handleKeyDown);
        this.events.once('shutdown', this.cleanUp);
    }

    update(_time: number, delta: number) {
        if (!this.runActive) {
            return;
        }

        const seconds = delta / 1000;
        const routeSpeed = this.getRouteSpeed();

        this.timeRemaining = Math.max(0, this.timeRemaining - seconds);
        this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);
        this.invulnerabilityMs = Math.max(0, this.invulnerabilityMs - delta);

        this.updatePlayer(delta);
        this.updatePlayerMotion(delta);
        this.updatePlayerInvulnerability();
        this.updateScrollingDecor(seconds, routeSpeed);
        this.updateSpawns(delta);
        this.updateRouteEntities(seconds, routeSpeed);
        this.updateBroadsides(seconds);
        this.checkBroadsideHits();
        this.checkHazardCollisions();
        this.updateHud();

        if (this.timeRemaining <= 0) {
            this.endRun('dawn');
        }
    }

    private resetRunState() {
        this.currentLaneIndex = 1;
        this.targetLaneIndex = 1;
        this.playerY = GAME.lanes[this.currentLaneIndex];
        this.score = 0;
        this.alarm = 0;
        this.stamina = GAME.startingStamina;
        this.deliveries = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.timeRemaining = GAME.timerSeconds;
        this.cooldownRemainingMs = 0;
        this.waveSpawnMs = GAME.spawnDirector.firstWaveMs;
        this.invulnerabilityMs = 0;
        this.dustSpawnMs = 0;
        this.flavorIndex = 0;
        this.alarmThresholdsShown = new Set<number>();
        this.debugVisuals = DEBUG_VISUALS;
        this.runActive = true;
        this.roadDecor = [];
        this.entities = [];
        this.broadsides = [];
    }

    private drawRoute() {
        this.add.rectangle(0, 0, GAME.width, GAME.height, 0x12172a).setOrigin(0);
        this.add.image(0, 82, ASSETS.environment.nightSkyline)
            .setOrigin(0, 0)
            .setDisplaySize(GAME.width, 168)
            .setAlpha(0.9);
        this.add.circle(820, 70, 30, 0xf5eccf);
        this.add.rectangle(0, 96, GAME.width, 92, 0x182540).setOrigin(0).setAlpha(0.32);
        this.add.rectangle(0, GAME.road.top, GAME.width, GAME.road.bottom - GAME.road.top, 0x1d130d).setOrigin(0);
        this.add.rectangle(0, GAME.road.top + 8, GAME.width, GAME.road.bottom - GAME.road.top - 16, 0x4b3524)
            .setOrigin(0)
            .setAlpha(0.2);
        this.add.rectangle(0, GAME.road.top + 8, GAME.width, GAME.road.bottom - GAME.road.top - 16, 0x120d09)
            .setOrigin(0)
            .setAlpha(0.24);
        this.add.rectangle(0, GAME.road.bottom, GAME.width, GAME.height - GAME.road.bottom, 0x244229).setOrigin(0);
        this.add.rectangle(0, GAME.road.top - 12, GAME.width, 14, 0x6b5633).setOrigin(0);
        this.add.rectangle(0, GAME.road.bottom, GAME.width, 14, 0x6b5633).setOrigin(0);
        this.add.rectangle(0, GAME.road.top - 2, GAME.width, 6, 0x0f1d12, 0.22).setOrigin(0);
        this.add.rectangle(0, GAME.road.bottom - 4, GAME.width, 7, 0x0f1d12, 0.24).setOrigin(0);

        for (let lane = 0; lane < GAME.lanes.length; lane += 1) {
            const y = GAME.lanes[lane];
            const fill = lane % 2 === 0 ? 0x2a1c13 : 0x1d130c;

            this.add.rectangle(0, y - 26, GAME.width, 52, fill, 0.18).setOrigin(0);
            this.add.rectangle(0, y + 16, GAME.width, 3, 0x0d0906, 0.14).setOrigin(0);
            this.add.rectangle(0, y - 17, GAME.width, 2, 0x6e5134, 0.07).setOrigin(0);
            this.add.rectangle(0, y + 4, GAME.width, 2, 0x7b5c3c, 0.05).setOrigin(0);
        }

        for (let lane = 0; lane < GAME.lanes.length - 1; lane += 1) {
            const y = (GAME.lanes[lane] + GAME.lanes[lane + 1]) / 2;

            for (let x = 28; x < GAME.width + 120; x += 118) {
                this.roadDecor.push(this.add.rectangle(x, y, 54, 2, 0x8d7957).setAlpha(0.08));
            }
        }

        for (let lane = 0; lane < GAME.lanes.length; lane += 1) {
            const y = GAME.lanes[lane] + 22;

            for (let x = 32; x < GAME.width + 160; x += 94) {
                const offset = (lane % 2) * 27;

                this.roadDecor.push(this.add.rectangle(x + offset, y, 20, 3, 0x100c09).setAlpha(0.14));
                this.roadDecor.push(this.add.rectangle(x + offset + 42, y - 37, 12, 2, 0x7d6445).setAlpha(0.1));
            }
        }

        for (let x = 24; x < GAME.width + 180; x += 190) {
            this.roadDecor.push(this.add.image(x, GAME.road.top - 24, ASSETS.props.fence)
                .setDisplaySize(104, 44)
                .setAlpha(0.82));
            this.roadDecor.push(this.add.image(x + 82, GAME.road.bottom + 28, ASSETS.props.fence)
                .setDisplaySize(104, 44)
                .setAlpha(0.76));
        }

        for (let x = 120; x < GAME.width + 360; x += 330) {
            this.roadDecor.push(this.add.image(x, GAME.road.top - 46, ASSETS.props.lanternPosts)
                .setDisplaySize(92, 56)
                .setAlpha(0.9));
        }

        this.roadDecor.push(this.add.image(GAME.width + 220, GAME.road.bottom + 38, ASSETS.props.hempBaleCrate)
            .setDisplaySize(96, 40)
            .setAlpha(1));
    }

    private createPlayer() {
        const shadow = this.add.ellipse(-8, 22, 96, 16, 0x050302, 0.42);
        const lanternGlow = this.add.circle(-54, -24, 17, 0xffc663, 0.2);
        const sprite = this.add.image(-4, -16, ASSETS.player.revereHorse)
            .setDisplaySize(138, 84)
            .setAlpha(1);
        const body = this.add.rectangle(0, 0, GAME.player.width, GAME.player.height, 0x40633a, this.getDebugHitboxAlpha())
            .setStrokeStyle(1, 0xf8e8b8, this.getDebugStrokeAlpha());
        const label = this.add.text(0, 0, 'Revere', {
            ...labelStyle,
            fontSize: '11px',
            color: '#fff6cf'
        }).setOrigin(0.5).setPosition(0, 34).setVisible(this.debugVisuals);

        this.playerSprite = sprite;
        this.playerBody = body;
        this.playerLabel = label;
        this.player = this.add.container(GAME.player.x, this.playerY, [shadow, lanternGlow, sprite, body, label]);
    }

    private createHud() {
        this.add.rectangle(0, 0, GAME.width, 88, 0x080d18).setOrigin(0).setAlpha(0.96);
        this.add.rectangle(0, 84, GAME.width, 4, 0x9b6042, 0.5).setOrigin(0);
        this.drawHudPanel(12, 14, 204, 56, 0x2b1815, 0x9b6042);
        this.drawHudPanel(238, 14, 204, 56, 0x10213a, 0x5f82a5);
        this.drawHudPanel(464, 14, 160, 56, 0x10213a, 0x5f82a5);
        this.drawHudPanel(640, 14, 250, 56, 0x10213a, 0x5f82a5);
        this.scoreText = this.add.text(18, 16, '', hudStyle);
        this.comboText = this.add.text(18, 46, '', hudStyle);
        this.staminaText = this.add.text(250, 16, '', hudStyle);
        this.deliveriesText = this.add.text(250, 46, '', hudStyle);
        this.timerText = this.add.text(488, 16, '', hudStyle);
        this.alarmText = this.add.text(650, 16, '', hudStyle);
        this.alarmBar = this.add.graphics();
        this.alarmFlash = this.add.rectangle(650, 48, 230, 16, 0xfff1b7, 0)
            .setOrigin(0);
        this.muteText = this.add.text(GAME.width - 18, 72, '', {
            ...hudStyle,
            fontSize: '11px',
            color: '#a9c6d8'
        }).setOrigin(1, 0.5);
    }

    private drawHudPanel(x: number, y: number, width: number, height: number, fill: number, stroke: number) {
        this.add.rectangle(x, y, width, height, fill, 0.9)
            .setOrigin(0)
            .setStrokeStyle(2, stroke, 0.74);
        this.add.rectangle(x, y, width, 5, 0xf0c781, 0.08)
            .setOrigin(0);
        this.add.rectangle(x + 5, y + 5, width - 10, height - 10, fill, 0)
            .setOrigin(0)
            .setStrokeStyle(1, 0xf0c781, 0.22);
    }

    private updateHud() {
        const multiplier = this.combo > 0 ? this.getComboMultiplier(this.combo) : 1;

        this.scoreText.setText(`Score ${this.score}`);
        this.comboText.setText(`Combo ${this.combo} (x${multiplier})`);
        this.staminaText.setText(`Stamina ${this.stamina}`);
        this.deliveriesText.setText(`Deliveries ${this.deliveries}`);
        this.timerText.setText(`Dawn ${this.formatTime(this.timeRemaining)}`);
        this.alarmText.setText(`Alarm ${this.alarm}/100`);

        this.alarmBar.clear();
        this.alarmBar.fillStyle(0x202942, 1);
        this.alarmBar.fillRect(650, 48, 230, 16);
        this.alarmBar.fillStyle(0xffdb5c, 1);
        this.alarmBar.fillRect(650, 48, 230 * (this.alarm / 100), 16);
        this.alarmBar.fillStyle(0xfff0a0, 0.45);
        this.alarmBar.fillRect(650, 48, 230 * (this.alarm / 100), 5);
        this.alarmBar.lineStyle(1, 0xf0c85a, 0.45);
        this.alarmBar.lineBetween(650 + 115, 47, 650 + 115, 65);
        this.alarmBar.lineBetween(650 + 184, 47, 650 + 184, 65);
        this.alarmBar.lineStyle(2, 0xfff1b7, 1);
        this.alarmBar.strokeRect(650, 48, 230, 16);
        this.muteText.setText(`M: ${gameAudio.getLabel()}`);
        this.comboText.setColor(multiplier > 1 ? '#ffdf6b' : '#fff6cf');
    }

    private updatePlayer(delta: number) {
        const targetY = GAME.lanes[this.targetLaneIndex];
        const transition = PhaserMath.Clamp(delta / GAME.player.transitionMs, 0, 1);

        this.playerY = PhaserMath.Linear(this.playerY, targetY, transition);

        if (Math.abs(this.playerY - targetY) < 0.5) {
            this.playerY = targetY;
            this.currentLaneIndex = this.targetLaneIndex;
        }

        this.player.y = this.playerY;
    }

    private updatePlayerMotion(delta: number) {
        const gallop = Math.sin(this.time.now * 0.024);
        const laneTargetY = GAME.lanes[this.targetLaneIndex];
        const laneDelta = laneTargetY - this.playerY;
        const lean = PhaserMath.Clamp(laneDelta / 34, -1, 1);

        this.playerSprite.y = -16 + gallop * 2.2;
        this.playerSprite.setAngle(gallop * 1.1 + lean * 2.4);

        this.dustSpawnMs -= delta;

        if (this.dustSpawnMs <= 0) {
            this.spawnHorseDust();
            this.dustSpawnMs = Math.abs(lean) > 0.05 ? 70 : 115;
        }
    }

    private updatePlayerInvulnerability() {
        if (this.invulnerabilityMs <= 0) {
            this.playerBody.setAlpha(this.getDebugHitboxAlpha());
            this.playerSprite.setAlpha(1);
            return;
        }

        const elapsed = GAME.player.invulnerabilityMs - this.invulnerabilityMs;
        const flashPhase = Math.floor(elapsed / GAME.player.flashMs);

        const alpha = flashPhase % 2 === 0 ? 0.42 : 1;

        this.playerBody.setAlpha(this.debugVisuals ? alpha : 0);
        this.playerSprite.setAlpha(alpha);
    }

    private updateScrollingDecor(seconds: number, routeSpeed: number) {
        for (const decor of this.roadDecor) {
            decor.x -= routeSpeed * seconds;

            if (decor.x < -90) {
                decor.x += GAME.width + 180;
            }
        }
    }

    private updateSpawns(delta: number) {
        this.waveSpawnMs -= delta;

        if (this.waveSpawnMs > 0) {
            return;
        }

        if (!this.canSpawnColumn()) {
            this.waveSpawnMs = 120;
            return;
        }

        const band = this.getSpawnBand();

        this.spawnWave(this.chooseWaveType(band));
        this.waveSpawnMs = PhaserMath.Between(band.gapMinMs, band.gapMaxMs);
    }

    private updateRouteEntities(seconds: number, routeSpeed: number) {
        for (const entity of [...this.entities]) {
            entity.age += seconds;
            entity.x -= routeSpeed * seconds;
            entity.container.x = entity.x;
            this.updateEntityMotion(entity);

            if (entity.x < -entity.width) {
                this.handleEscapedEntity(entity);
                this.removeEntity(entity);
            }
        }
    }

    private updateBroadsides(seconds: number) {
        for (const broadside of [...this.broadsides]) {
            broadside.age += seconds;
            broadside.x += GAME.projectile.speed * seconds;
            broadside.container.x = broadside.x;
            broadside.container.y = broadside.y + Math.sin(broadside.age * 22) * 2.8;
            broadside.container.setAngle(Math.sin(broadside.age * 18) * 3);
            broadside.trail.setAlpha(0.16 + Math.sin(broadside.age * 18) * 0.04);

            if (broadside.x > GAME.width + 60) {
                this.removeBroadside(broadside);
            }
        }
    }

    private updateEntityMotion(entity: RouteEntity) {
        const phase = entity.age * (entity.kind === 'hazard' ? 5.6 : 3.8) + entity.laneIndex;

        if (entity.kind === 'hazard') {
            if (entity.sprite) {
                entity.sprite.y = -14 + Math.sin(phase) * 1.8;
                entity.sprite.setAngle(Math.sin(phase * 0.8) * 1.6);
            }
            return;
        }

        if (!entity.warned && entity.sprite) {
            entity.sprite.y = -12 + Math.sin(phase) * 0.45;
            entity.sprite.setAlpha(0.97 + Math.sin(phase * 0.72) * 0.03);
        }
    }

    private checkBroadsideHits() {
        for (const broadside of [...this.broadsides]) {
            const broadsideBounds = this.boundsFor(broadside.x, broadside.y, broadside.width, broadside.height);
            const target = this.entities.find((entity) => {
                if (entity.kind !== 'target' || entity.warned) {
                    return false;
                }

                return Geom.Intersects.RectangleToRectangle(
                    broadsideBounds,
                    this.boundsFor(entity.x, entity.y, entity.width, entity.height)
                );
            });

            if (target) {
                broadside.hit = true;
                this.warnTarget(target);
                this.removeBroadside(broadside);
            }
        }
    }

    private checkHazardCollisions() {
        if (this.invulnerabilityMs > 0) {
            return;
        }

        const playerBounds = this.boundsFor(
            GAME.player.x,
            this.player.y,
            GAME.player.width,
            GAME.player.height
        );

        const hazard = this.entities.find((entity) => {
            if (entity.kind !== 'hazard') {
                return false;
            }

            return Geom.Intersects.RectangleToRectangle(
                playerBounds,
                this.boundsFor(entity.x, entity.y, entity.width, entity.height)
            );
        });

        if (!hazard) {
            return;
        }

        this.stamina -= 1;
        this.invulnerabilityMs = GAME.player.invulnerabilityMs;
        this.resetCombo();
        gameAudio.playHazard();
        this.cameras.main.shake(110, 0.004);
        this.flashPlayerHit();
        this.floatText('-1 stamina', GAME.player.x + 18, this.player.y - 42, '#ff9a8a');
        this.removeEntity(hazard);

        if (this.stamina <= 0) {
            this.endRun('stamina');
        }
    }

    private spawnWave(waveType: WaveType) {
        const spawnX = GAME.spawnDirector.spawnX;

        if (waveType === 'singleTarget') {
            this.spawnTarget(this.pickLanes(1)[0], spawnX);
            return;
        }

        if (waveType === 'twoTargets') {
            for (const laneIndex of this.pickLanes(2)) {
                this.spawnTarget(laneIndex, spawnX);
            }
            return;
        }

        if (waveType === 'oneHazard') {
            this.spawnHazard(this.pickLanes(1)[0], spawnX);
            return;
        }

        if (waveType === 'twoHazards') {
            for (const laneIndex of this.pickLanes(2)) {
                this.spawnHazard(laneIndex, spawnX);
            }
            return;
        }

        if (waveType === 'targetHazard') {
            const lanes = this.pickLanes(2);

            this.spawnTarget(lanes[0], spawnX);
            this.spawnHazard(lanes[1], spawnX);
            return;
        }

        const hazardLanes = this.pickLanes(2);
        const safeLanes = this.pickLanes(GAME.lanes.length, hazardLanes);
        const targetLane = safeLanes[0];

        for (const laneIndex of hazardLanes) {
            this.spawnHazard(laneIndex, spawnX);
        }

        this.spawnTarget(targetLane, spawnX);
    }

    private spawnTarget(laneIndex: number, x: number) {
        const name = this.pickRandom(TARGET_NAMES);
        const style = TARGET_STYLES[name];
        const asset = ASSETS.buildings[name];
        const displaySize = this.getTargetDisplaySize(name);
        const y = GAME.lanes[laneIndex];
        const tagWidth = Math.max(48, style.tag.length * 8 + 12);
        const shadow = this.add.ellipse(0, 23, displaySize.width * 0.52, 14, 0x050302, 0.36);
        const sprite = this.add.image(0, -12, asset.unwarned)
            .setDisplaySize(displaySize.width, displaySize.height)
            .setAlpha(1)
            .setTint(0xffedc4);
        const leftGlow = this.add.circle(-displaySize.width * 0.22, -12, 13, 0xffc863, 0.16);
        const rightGlow = this.add.circle(displaySize.width * 0.12, -12, 12, 0xffc863, 0.14);
        const doorGlow = this.add.circle(displaySize.width * 0.28, 2, 10, 0xffd47a, 0.12);
        const leftWindow = this.add.rectangle(-displaySize.width * 0.22, -12, 12, 15, 0xffc863, 0.78)
            .setStrokeStyle(1, 0x3b210e, 0.68);
        const rightWindow = this.add.rectangle(displaySize.width * 0.12, -12, 11, 14, 0xffb84e, 0.7)
            .setStrokeStyle(1, 0x3b210e, 0.62);
        const notice = this.add.rectangle(displaySize.width * 0.28, 0, 16, 19, 0xf1dfb4, 0.92)
            .setStrokeStyle(1, 0x6c3b17, 0.82)
            .setAngle(-4);
        const noticeLineTop = this.add.rectangle(displaySize.width * 0.28, -3, 9, 2, 0x6c3b17, 0.58)
            .setAngle(-4);
        const noticeLineBottom = this.add.rectangle(displaySize.width * 0.28, 3, 7, 2, 0x6c3b17, 0.5)
            .setAngle(-4);
        const body = this.add.rectangle(0, 0, GAME.target.width, GAME.target.height, style.fill, this.getDebugHitboxAlpha())
            .setStrokeStyle(1, style.stroke, this.getDebugStrokeAlpha());
        const tag = this.add.rectangle(
            -GAME.target.width / 2 + tagWidth / 2 + 7,
            GAME.target.height / 2 - 8,
            tagWidth,
            16,
            style.tagFill
        );
        const tagLabel = this.add.text(tag.x, tag.y, style.tag, {
            ...labelStyle,
            fontSize: '9px',
            color: '#fff6cf'
        }).setOrigin(0.5);
        const label = this.add.text(8, 8, name, {
            ...labelStyle,
            color: style.labelColor
        }).setOrigin(0.5).setPosition(8, GAME.target.height / 2 + 10);
        const debugObjects = [tag, tagLabel, label];

        this.setDebugObjectsVisible(debugObjects, this.debugVisuals);

        const container = this.add.container(x, y, [
            shadow,
            sprite,
            leftGlow,
            rightGlow,
            doorGlow,
            leftWindow,
            rightWindow,
            notice,
            noticeLineTop,
            noticeLineBottom,
            body,
            tag,
            tagLabel,
            label
        ]);

        this.entities.push({
            kind: 'target',
            name,
            laneIndex,
            x,
            y,
            age: 0,
            width: GAME.target.width,
            height: GAME.target.height,
            warned: false,
            container,
            body,
            sprite,
            label,
            debugObjects
        });
    }

    private spawnHazard(laneIndex: number, x: number) {
        const name = this.pickRandom(HAZARD_NAMES);
        const style = HAZARD_STYLES[name];
        const displaySize = this.getHazardDisplaySize(name);
        const y = GAME.lanes[laneIndex];
        const tagWidth = Math.max(48, style.tag.length * 8 + 12);
        const shadow = this.add.ellipse(0, 20, displaySize.width * 0.56, 15, 0x050302, 0.44);
        const sprite = this.add.image(0, -14, ASSETS.hazards[name])
            .setDisplaySize(displaySize.width, displaySize.height)
            .setAlpha(1);
        const body = this.add.rectangle(0, 0, GAME.hazard.width, GAME.hazard.height, style.fill, this.getDebugHitboxAlpha())
            .setStrokeStyle(1, style.stroke, this.getDebugStrokeAlpha());
        const tag = this.add.rectangle(
            -GAME.hazard.width / 2 + tagWidth / 2 + 7,
            GAME.hazard.height / 2 - 7,
            tagWidth,
            16,
            style.tagFill
        );
        const tagLabel = this.add.text(tag.x, tag.y, style.tag, {
            ...labelStyle,
            fontSize: '9px',
            color: '#fff6cf'
        }).setOrigin(0.5);
        const label = this.add.text(8, 8, name, {
            ...labelStyle,
            fontSize: '11px',
            color: style.labelColor
        }).setOrigin(0.5).setPosition(8, GAME.hazard.height / 2 + 10);
        const debugObjects = [tag, tagLabel, label];

        this.setDebugObjectsVisible(debugObjects, this.debugVisuals);

        const container = this.add.container(x, y, [
            shadow,
            sprite,
            body,
            tag,
            tagLabel,
            label
        ]);

        this.entities.push({
            kind: 'hazard',
            name,
            laneIndex,
            x,
            y,
            age: 0,
            width: GAME.hazard.width,
            height: GAME.hazard.height,
            warned: false,
            container,
            body,
            sprite,
            label,
            debugObjects
        });
    }

    private getTargetDisplaySize(name: TargetName) {
        const sizes: Record<TargetName, { width: number; height: number }> = {
            'Colonial House': { width: 178, height: 78 },
            Tavern: { width: 194, height: 84 },
            Church: { width: 176, height: 72 },
            Blacksmith: { width: 180, height: 76 },
            'Militia Post': { width: 188, height: 68 }
        };

        return sizes[name];
    }

    private getHazardDisplaySize(name: HazardName) {
        const sizes: Record<HazardName, { width: number; height: number }> = {
            'Redcoat Tea Table': { width: 150, height: 88 },
            'Royal Tax Collector': { width: 92, height: 92 },
            Loyalist: { width: 90, height: 92 },
            Barrel: { width: 92, height: 62 },
            'Mud Patch': { width: 154, height: 58 }
        };

        return sizes[name];
    }

    private throwBroadside() {
        if (this.cooldownRemainingMs > 0) {
            return;
        }

        this.cooldownRemainingMs = GAME.projectile.cooldownMs;
        gameAudio.playThrow();

        const x = GAME.player.x + GAME.player.width / 2 + 32;
        const y = this.player.y;
        const shadow = this.add.ellipse(2, 8, 58, 12, 0x050302, 0.34);
        const trail = this.add.rectangle(-28, 2, 34, 3, 0xffefb5, 0.16);
        const body = this.add.image(0, 0, ASSETS.props.broadside)
            .setDisplaySize(62, 24)
            .setAlpha(1);
        const label = this.add.text(0, 0, 'Notice', {
            ...labelStyle,
            fontSize: '9px'
        }).setOrigin(0.5).setAlpha(0);
        const container = this.add.container(x, y, [shadow, trail, body, label]);

        this.broadsides.push({
            x,
            y,
            age: 0,
            width: GAME.projectile.width,
            height: GAME.projectile.height,
            hit: false,
            trail,
            container
        });
    }

    private warnTarget(target: RouteEntity) {
        const previousMultiplier = this.combo > 0 ? this.getComboMultiplier(this.combo) : 1;
        const previousAlarm = this.alarm;

        target.warned = true;
        target.body.setFillStyle(0xf0d677, this.getDebugHitboxAlpha());
        target.sprite?.setTexture(ASSETS.buildings[target.name as TargetName].warned);
        target.sprite?.setAlpha(1);
        target.sprite?.setTint(0xfff6d0);
        target.label.setText('Warned');
        target.label.setColor('#1b1320');

        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        const multiplier = this.getComboMultiplier(this.combo);
        const deliveryScore = GAME.scoring.delivery * multiplier;

        this.score += deliveryScore;
        this.deliveries += 1;
        this.alarm = PhaserMath.Clamp(this.alarm + GAME.scoring.alarmPerDelivery, 0, 100);

        gameAudio.playDelivery();
        this.checkComboTierIncrease(previousMultiplier, multiplier);
        this.checkAlarmThresholds(previousAlarm);
        this.floatText(`+${deliveryScore} x${multiplier}`, target.x, target.y - 42, '#ffef9b');
        this.floatText(this.nextFlavorLine(), target.x, target.y - 68, '#f7fbff', 13, 24, 850);
        this.spawnDeliveryGlow(target.x - 24, target.y - 26);
        this.spawnPostedBroadside(target.x + 36, target.y - 26);
        this.spawnHitSpark(target.x, target.y - 16);
        this.time.delayedCall(240, () => this.removeEntity(target));
    }

    private checkComboTierIncrease(previousMultiplier: number, multiplier: number) {
        if (multiplier <= previousMultiplier || multiplier <= 1) {
            return;
        }

        gameAudio.playComboTier();
        this.showComboTierCue(multiplier);
    }

    private checkAlarmThresholds(previousAlarm: number) {
        const thresholds = [
            { value: 50, message: 'THE TOWN STIRS' },
            { value: 80, message: 'MILITIA READY' },
            { value: 100, message: 'THE TOWN IS AWAKE!' }
        ];

        for (const threshold of thresholds) {
            if (
                previousAlarm < threshold.value
                && this.alarm >= threshold.value
                && !this.alarmThresholdsShown.has(threshold.value)
            ) {
                this.alarmThresholdsShown.add(threshold.value);
                this.showAlarmCue(threshold.message);
                this.flashAlarmMeter();
            }
        }
    }

    private showComboTierCue(multiplier: number) {
        const banner = this.add.container(GAME.width / 2, 112);
        const backing = this.add.rectangle(0, 0, 230, 38, 0x2b1815, 0.88)
            .setStrokeStyle(2, 0xffd86b, 0.85);
        const text = this.add.text(0, -1, `COMBO x${multiplier}!`, {
            fontFamily: 'Courier New, monospace',
            fontSize: '23px',
            color: '#ffef9b',
            stroke: '#080b12',
            strokeThickness: 4
        }).setOrigin(0.5);

        banner.add([backing, text]);
        banner.setScale(0.92);

        this.tweens.add({
            targets: banner,
            y: 96,
            scaleX: 1.04,
            scaleY: 1.04,
            alpha: 0,
            delay: 220,
            duration: 620,
            ease: 'Sine.easeOut',
            onComplete: () => banner.destroy()
        });
    }

    private showAlarmCue(message: string) {
        const banner = this.add.container(764, 104);
        const backing = this.add.rectangle(0, 0, 288, 34, 0x10213a, 0.9)
            .setStrokeStyle(2, 0xf0c85a, 0.86);
        const text = this.add.text(0, -1, message, {
            fontFamily: 'Courier New, monospace',
            fontSize: '17px',
            color: '#f7fbff',
            stroke: '#080b12',
            strokeThickness: 3
        }).setOrigin(0.5);

        banner.add([backing, text]);

        this.tweens.add({
            targets: banner,
            y: 88,
            alpha: 0,
            delay: 480,
            duration: 760,
            ease: 'Sine.easeOut',
            onComplete: () => banner.destroy()
        });
    }

    private flashAlarmMeter() {
        this.alarmFlash.setAlpha(0.68);

        this.tweens.add({
            targets: this.alarmFlash,
            alpha: 0,
            duration: 520,
            ease: 'Sine.easeOut'
        });
    }

    private spawnDeliveryGlow(x: number, y: number) {
        const glow = this.add.image(x, y, ASSETS.effects.lanternGlow)
            .setDisplaySize(96, 72)
            .setAlpha(0.55);

        this.tweens.add({
            targets: glow,
            scaleX: 1.18,
            scaleY: 1.18,
            alpha: 0,
            duration: 520,
            ease: 'Sine.easeOut',
            onComplete: () => glow.destroy()
        });
    }

    private spawnHitSpark(x: number, y: number) {
        const pop = this.add.circle(x, y, 26, 0xffd56e, 0.18);
        const spark = this.add.image(x, y, ASSETS.effects.hitSpark)
            .setDisplaySize(54, 54)
            .setAlpha(1);

        this.tweens.add({
            targets: [pop, spark],
            scaleX: 1.35,
            scaleY: 1.35,
            alpha: 0,
            duration: 280,
            ease: 'Sine.easeOut',
            onComplete: () => {
                pop.destroy();
                spark.destroy();
            }
        });
    }

    private spawnPostedBroadside(x: number, y: number) {
        const notice = this.add.rectangle(x, y, 24, 17, 0xf1dfb4, 0.96)
            .setStrokeStyle(1, 0x6c3b17, 0.9)
            .setAngle(-5);
        const mark = this.add.rectangle(x, y - 1, 13, 2, 0x6c3b17, 0.65)
            .setAngle(-5);

        notice.setScale(0.5);
        mark.setScale(0.5);

        this.tweens.add({
            targets: [notice, mark],
            scaleX: 1,
            scaleY: 1,
            duration: 120,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: [notice, mark],
            alpha: 0,
            delay: 380,
            duration: 260,
            ease: 'Sine.easeOut',
            onComplete: () => {
                notice.destroy();
                mark.destroy();
            }
        });
    }

    private spawnHorseDust() {
        const dust = this.add.ellipse(
            GAME.player.x - 54 + PhaserMath.Between(-6, 6),
            this.player.y + 18 + PhaserMath.Between(-2, 3),
            PhaserMath.Between(12, 20),
            PhaserMath.Between(4, 8),
            0xb58a55,
            0.18
        );

        this.tweens.add({
            targets: dust,
            x: dust.x - PhaserMath.Between(18, 30),
            scaleX: 1.5,
            scaleY: 0.6,
            alpha: 0,
            duration: 520,
            ease: 'Sine.easeOut',
            onComplete: () => dust.destroy()
        });
    }

    private moveLane(direction: -1 | 1) {
        this.targetLaneIndex = PhaserMath.Clamp(
            this.targetLaneIndex + direction,
            0,
            GAME.lanes.length - 1
        );
    }

    private getRunProgress() {
        return PhaserMath.Clamp(1 - this.timeRemaining / GAME.timerSeconds, 0, 1);
    }

    private getRouteSpeed() {
        const progress = this.getRunProgress();

        if (progress < GAME.spawnDirector.early.maxProgress) {
            return PhaserMath.Linear(
                GAME.routeSpeed.early,
                GAME.routeSpeed.mid,
                progress / GAME.spawnDirector.early.maxProgress
            );
        }

        if (progress < GAME.spawnDirector.mid.maxProgress) {
            return PhaserMath.Linear(
                GAME.routeSpeed.mid,
                GAME.routeSpeed.late,
                (progress - GAME.spawnDirector.early.maxProgress) /
                    (GAME.spawnDirector.mid.maxProgress - GAME.spawnDirector.early.maxProgress)
            );
        }

        return GAME.routeSpeed.late;
    }

    private getSpawnBand(): SpawnBand {
        const progress = this.getRunProgress();

        if (progress < GAME.spawnDirector.early.maxProgress) {
            return GAME.spawnDirector.early;
        }

        if (progress < GAME.spawnDirector.mid.maxProgress) {
            return GAME.spawnDirector.mid;
        }

        return GAME.spawnDirector.late;
    }

    private chooseWaveType(band: SpawnBand): WaveType {
        const weights = band.weights;
        const waveTypes = Object.keys(weights) as WaveType[];
        const totalWeight = waveTypes.reduce((total, waveType) => total + weights[waveType], 0);
        let roll = PhaserMath.Between(1, totalWeight);

        for (const waveType of waveTypes) {
            roll -= weights[waveType];

            if (roll <= 0) {
                return waveType;
            }
        }

        return 'singleTarget';
    }

    private canSpawnColumn() {
        return this.entities.every((entity) => {
            return Math.abs(entity.x - GAME.spawnDirector.spawnX) > GAME.spawnDirector.minimumColumnGap;
        });
    }

    private pickLanes(count: number, excluded: number[] = []) {
        const lanes = GAME.lanes
            .map((_lane, index) => index)
            .filter((laneIndex) => !excluded.includes(laneIndex));

        for (let index = lanes.length - 1; index > 0; index -= 1) {
            const swapIndex = PhaserMath.Between(0, index);
            const current = lanes[index];

            lanes[index] = lanes[swapIndex];
            lanes[swapIndex] = current;
        }

        return lanes.slice(0, count);
    }

    private pickRandom<T>(items: readonly T[]) {
        return items[PhaserMath.Between(0, items.length - 1)];
    }

    private getComboMultiplier(combo: number) {
        let multiplier = 1;

        for (const tier of GAME.scoring.comboMultipliers) {
            if (combo >= tier.minCombo) {
                multiplier = tier.multiplier;
            }
        }

        return multiplier;
    }

    private nextFlavorLine() {
        const line = FLAVOR_LINES[this.flavorIndex % FLAVOR_LINES.length];

        this.flavorIndex += 1;

        return line;
    }

    private handleEscapedEntity(entity: RouteEntity) {
        if (entity.kind !== 'target' || entity.warned) {
            return;
        }

        if (this.combo > 0) {
            this.floatText('missed warning', 168, entity.y - 36, '#ffb38a', 14, 24, 720);
        }

        this.resetCombo();
    }

    private resetCombo() {
        this.combo = 0;
    }

    private removeEntity(entity: RouteEntity) {
        const index = this.entities.indexOf(entity);

        if (index >= 0) {
            this.entities.splice(index, 1);
        }

        entity.container.destroy();
    }

    private removeBroadside(broadside: Broadside) {
        const index = this.broadsides.indexOf(broadside);

        if (index >= 0) {
            this.broadsides.splice(index, 1);
        }

        broadside.container.destroy();
    }

    private floatText(
        message: string,
        x: number,
        y: number,
        color: string,
        fontSize: number = 18,
        rise: number = 34,
        duration: number = 650
    ) {
        const text = this.add.text(x, y, message, {
            fontFamily: 'Courier New, monospace',
            fontSize: `${fontSize}px`,
            color,
            stroke: '#1b1320',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - rise,
            alpha: 0,
            duration,
            ease: 'Sine.easeOut',
            onComplete: () => text.destroy()
        });
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'ArrowUp' || event.code === 'ArrowLeft' || event.code === 'KeyW' || event.code === 'KeyA') {
            event.preventDefault();
            this.moveLane(-1);
            return;
        }

        if (event.code === 'ArrowDown' || event.code === 'ArrowRight' || event.code === 'KeyS' || event.code === 'KeyD') {
            event.preventDefault();
            this.moveLane(1);
            return;
        }

        if (event.code === 'Space') {
            event.preventDefault();
            this.throwBroadside();
            return;
        }

        if (event.code === 'KeyM') {
            event.preventDefault();
            gameAudio.toggleMute();
            this.updateHud();
            return;
        }

        if (event.code === 'F3') {
            event.preventDefault();
            this.toggleDebugVisuals();
        }
    };

    private flashPlayerHit() {
        this.playerSprite.setTint(0xff6a2e);

        const flash = this.add.rectangle(
            0,
            0,
            GAME.player.width + 24,
            GAME.player.height + 18,
            0xff5f28,
            0.32
        ).setStrokeStyle(2, 0xffd17a, 0.5);

        this.player.add(flash);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 190,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy()
        });

        this.time.delayedCall(180, () => {
            this.playerSprite.clearTint();
        });
    }

    private toggleDebugVisuals() {
        this.debugVisuals = !this.debugVisuals;
        this.playerBody.setAlpha(this.getDebugHitboxAlpha());
        this.playerBody.setStrokeStyle(1, 0xf8e8b8, this.getDebugStrokeAlpha());
        this.playerLabel.setVisible(this.debugVisuals);

        for (const entity of this.entities) {
            entity.body.setAlpha(this.getDebugHitboxAlpha());
            entity.body.setStrokeStyle(1, 0xffef9c, this.getDebugStrokeAlpha());
            this.setDebugObjectsVisible(entity.debugObjects, this.debugVisuals);
        }
    }

    private setDebugObjectsVisible(objects: Phaser.GameObjects.GameObject[], visible: boolean) {
        for (const object of objects) {
            const visibleObject = object as Phaser.GameObjects.GameObject & { setVisible: (value: boolean) => void };

            visibleObject.setVisible(visible);
        }
    }

    private getDebugHitboxAlpha() {
        return this.debugVisuals ? 0.18 : 0;
    }

    private getDebugStrokeAlpha() {
        return this.debugVisuals ? 0.55 : 0;
    }

    private endRun(reason: RunEndReason) {
        if (!this.runActive) {
            return;
        }

        this.runActive = false;
        gameAudio.playGameOver();

        const result: RunResult = {
            score: this.score,
            alarm: this.alarm,
            deliveries: this.deliveries,
            maxCombo: this.maxCombo,
            reason
        };

        this.scene.start('GameOverScene', result);
    }

    private cleanUp = () => {
        this.input.keyboard?.off('keydown', this.handleKeyDown);
    };

    private boundsFor(x: number, y: number, width: number, height: number) {
        return new Geom.Rectangle(
            x - width / 2,
            y - height / 2,
            width,
            height
        );
    }

    private formatTime(seconds: number) {
        const totalSeconds = Math.ceil(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const remainder = totalSeconds % 60;

        return `${minutes}:${remainder.toString().padStart(2, '0')}`;
    }
}
