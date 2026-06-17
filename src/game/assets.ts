import type { Scene } from 'phaser';

export const ASSETS = {
    screens: {
        title: 'screen-title-background'
    },
    environment: {
        nightSkyline: 'environment-night-skyline'
    },
    player: {
        revereHorse: 'player-revere-horse'
    },
    props: {
        broadside: 'prop-rolled-broadside',
        hempBaleCrate: 'prop-hemp-bale-crate',
        fence: 'prop-split-rail-fence',
        lanternPosts: 'prop-lantern-posts'
    },
    effects: {
        hitSpark: 'effect-hit-spark',
        lanternGlow: 'effect-lantern-glow'
    },
    ui: {
        bluePanel: 'ui-blue-panel',
        redPanel: 'ui-red-panel',
        parchmentPanel: 'ui-parchment-panel'
    },
    buildings: {
        'Colonial House': {
            unwarned: 'building-house-unwarned',
            warned: 'building-house-warned'
        },
        Tavern: {
            unwarned: 'building-tavern-unwarned',
            warned: 'building-tavern-warned'
        },
        Church: {
            unwarned: 'building-church-unwarned',
            warned: 'building-church-warned'
        },
        Blacksmith: {
            unwarned: 'building-blacksmith-unwarned',
            warned: 'building-blacksmith-warned'
        },
        'Militia Post': {
            unwarned: 'building-militia-post-unwarned',
            warned: 'building-militia-post-warned'
        }
    },
    hazards: {
        'Redcoat Tea Table': 'hazard-redcoat-tea-table',
        'Royal Tax Collector': 'enemy-royal-tax-collector',
        Loyalist: 'enemy-loyalist',
        Barrel: 'hazard-barrel',
        'Mud Patch': 'hazard-mud-patch'
    }
} as const;

const runtimeAssets: Record<string, string> = {
    [ASSETS.screens.title]: 'assets/screens/title_background.png',
    [ASSETS.environment.nightSkyline]: 'assets/environment/night_skyline.png',
    [ASSETS.player.revereHorse]: 'assets/player/revere_horse.png',
    [ASSETS.props.broadside]: 'assets/props/rolled_broadside.png',
    [ASSETS.props.hempBaleCrate]: 'assets/props/hemp_bale_crate.png',
    [ASSETS.props.fence]: 'assets/props/split_rail_fence.png',
    [ASSETS.props.lanternPosts]: 'assets/props/lantern_posts.png',
    [ASSETS.effects.hitSpark]: 'assets/effects/hit_spark.png',
    [ASSETS.effects.lanternGlow]: 'assets/effects/lantern_glow.png',
    [ASSETS.ui.bluePanel]: 'assets/ui/blue_panel.png',
    [ASSETS.ui.redPanel]: 'assets/ui/red_panel.png',
    [ASSETS.ui.parchmentPanel]: 'assets/ui/parchment_panel.png',
    [ASSETS.buildings['Colonial House'].unwarned]: 'assets/buildings/house_unwarned.png',
    [ASSETS.buildings['Colonial House'].warned]: 'assets/buildings/house_warned.png',
    [ASSETS.buildings.Tavern.unwarned]: 'assets/buildings/tavern_unwarned.png',
    [ASSETS.buildings.Tavern.warned]: 'assets/buildings/tavern_warned.png',
    [ASSETS.buildings.Church.unwarned]: 'assets/buildings/church_unwarned.png',
    [ASSETS.buildings.Church.warned]: 'assets/buildings/church_warned.png',
    [ASSETS.buildings.Blacksmith.unwarned]: 'assets/buildings/blacksmith_unwarned.png',
    [ASSETS.buildings.Blacksmith.warned]: 'assets/buildings/blacksmith_warned.png',
    [ASSETS.buildings['Militia Post'].unwarned]: 'assets/buildings/militia_post_unwarned.png',
    [ASSETS.buildings['Militia Post'].warned]: 'assets/buildings/militia_post_warned.png',
    [ASSETS.hazards['Redcoat Tea Table']]: 'assets/hazards/redcoat_tea_table.png',
    [ASSETS.hazards['Royal Tax Collector']]: 'assets/enemies/royal_tax_collector.png',
    [ASSETS.hazards.Loyalist]: 'assets/enemies/loyalist.png',
    [ASSETS.hazards.Barrel]: 'assets/hazards/barrel.png',
    [ASSETS.hazards['Mud Patch']]: 'assets/hazards/mud_patch.png'
};

export const preloadVisualAssets = (scene: Scene) => {
    for (const [key, path] of Object.entries(runtimeAssets)) {
        if (!scene.textures.exists(key)) {
            scene.load.image(key, path);
        }
    }
};
