export const GAME = {
    width: 960,
    height: 540,
    lanes: [224, 280, 336, 392],
    road: {
        top: 184,
        bottom: 432
    },
    routeSpeed: {
        early: 176,
        mid: 196,
        late: 224
    },
    player: {
        x: 150,
        width: 88,
        height: 38,
        // Tuned short so lane changes feel responsive without snapping instantly.
        transitionMs: 90,
        invulnerabilityMs: 800,
        flashMs: 120
    },
    projectile: {
        width: 56,
        height: 16,
        speed: 620,
        cooldownMs: 320
    },
    target: {
        width: 148,
        height: 48
    },
    hazard: {
        width: 154,
        height: 42
    },
    spawnDirector: {
        firstWaveMs: 650,
        spawnX: 1110,
        // Keeps columns readable at current scroll speeds.
        minimumColumnGap: 260,
        early: {
            maxProgress: 0.34,
            gapMinMs: 1050,
            gapMaxMs: 1550,
            weights: {
                singleTarget: 46,
                twoTargets: 26,
                oneHazard: 14,
                twoHazards: 4,
                targetHazard: 10,
                lateMixed: 0
            }
        },
        mid: {
            maxProgress: 0.68,
            gapMinMs: 900,
            gapMaxMs: 1350,
            weights: {
                singleTarget: 28,
                twoTargets: 20,
                oneHazard: 18,
                twoHazards: 12,
                targetHazard: 20,
                lateMixed: 2
            }
        },
        late: {
            gapMinMs: 760,
            gapMaxMs: 1120,
            weights: {
                singleTarget: 18,
                twoTargets: 14,
                oneHazard: 18,
                twoHazards: 18,
                targetHazard: 22,
                lateMixed: 10
            }
        }
    },
    scoring: {
        delivery: 100,
        // Slightly generous for public demos: a strong run can wake the town within 90 seconds.
        alarmPerDelivery: 12,
        comboMultipliers: [
            { minCombo: 1, multiplier: 1 },
            { minCombo: 3, multiplier: 2 },
            { minCombo: 6, multiplier: 3 },
            { minCombo: 10, multiplier: 4 }
        ]
    },
    timerSeconds: 90,
    startingStamina: 3
} as const;

export const DEBUG_VISUALS = false;

export const TARGET_NAMES = [
    'Colonial House',
    'Tavern',
    'Church',
    'Blacksmith',
    'Militia Post'
] as const;

export const TARGET_STYLES = {
    'Colonial House': {
        fill: 0xaec7d8,
        stroke: 0xf8df96,
        tagFill: 0x314c63,
        tag: 'HOUSE',
        labelColor: '#151820'
    },
    Tavern: {
        fill: 0xd2ad68,
        stroke: 0xffefd0,
        tagFill: 0x684022,
        tag: 'TAVERN',
        labelColor: '#20140b'
    },
    Church: {
        fill: 0xcfd8e4,
        stroke: 0xfff5c8,
        tagFill: 0x4e5d72,
        tag: 'BELL',
        labelColor: '#141820'
    },
    Blacksmith: {
        fill: 0x8fb1aa,
        stroke: 0xffd08a,
        tagFill: 0x2f4d49,
        tag: 'FORGE',
        labelColor: '#101817'
    },
    'Militia Post': {
        fill: 0xb7c878,
        stroke: 0xffef9c,
        tagFill: 0x3f5428,
        tag: 'POST',
        labelColor: '#131909'
    }
} as const;

export const HAZARD_NAMES = [
    'Redcoat Tea Table',
    'Royal Tax Collector',
    'Loyalist',
    'Barrel',
    'Mud Patch'
] as const;

export const HAZARD_STYLES = {
    'Redcoat Tea Table': {
        fill: 0x9e3f35,
        stroke: 0xffc2a3,
        tagFill: 0x4b1714,
        tag: 'TEA',
        labelColor: '#fff1dc'
    },
    'Royal Tax Collector': {
        fill: 0x6e4b9c,
        stroke: 0xd7c4ff,
        tagFill: 0x2c1b49,
        tag: 'TAX',
        labelColor: '#f8f0ff'
    },
    Loyalist: {
        fill: 0x3f5f9c,
        stroke: 0xc5ddff,
        tagFill: 0x192a4a,
        tag: 'LOYAL',
        labelColor: '#eef6ff'
    },
    Barrel: {
        fill: 0x8a5a32,
        stroke: 0xf0c08a,
        tagFill: 0x3d2514,
        tag: 'BARREL',
        labelColor: '#fff0dc'
    },
    'Mud Patch': {
        fill: 0x4f3b2c,
        stroke: 0xa4886f,
        tagFill: 0x261b14,
        tag: 'MUD',
        labelColor: '#f5dfc8'
    }
} as const;

export const FLAVOR_LINES = [
    'THE BRITISH ARE COMING!',
    'WAKE THE TOWN!',
    'NO TIME FOR TEA!',
    'TAXED!',
    'LOYALIST BLOCKADE!',
    'TO ARMS!',
    'LIGHT THE LANTERNS!',
    'THE TOWN STIRS!',
    'MILITIA READY!'
] as const;
