import { system, world } from "@minecraft/server";

// Events that we subscribe to later
import { playerSpawn } from "./events/playerSpawn.js";
import { playerLeave } from "./events/playerLeave.js";
import { entityHitEntity } from "./events/entityHitEntity.js";
import { scriptEvent } from "./events/scriptEvent.js";

// Only three moves for now
import { grapple } from "./moves/grapple.js";
import { swing } from "./moves/swing.js";
import { webShot } from "./moves/webShot.js";

// Skill tree "move" that's actually a menu
import { equipSuit } from "./moves/equipSuit.js";
import { webEditor } from "./moves/suitEditor.js";

// This runtime also handles the webs and the player's cooldowns
import { playerRuntime } from "./runtimes/player.js";

// Utility functions
import { loadSuit, loadBuild, playSound } from "./utils.js";

// Debug stuff
system.afterEvents.scriptEventReceive.subscribe(v => scriptEvent(v));

// Remove player data when they leave the server
world.afterEvents.playerSpawn.subscribe(v => playerSpawn(v));
world.beforeEvents.playerLeave.subscribe(v => playerLeave(v));
world.afterEvents.entityHitEntity.subscribe(v => entityHitEntity(v));

// Store short term scoreboard data more efficiently
export const PLAYER_DATA_MAP = {};

// Setup player data when they first join the server
const setup = (player) => {
    if (!PLAYER_DATA_MAP[player.id]) PLAYER_DATA_MAP[player.id] = {
        // Storing the web entities currently active
        webs: [],
        webBlocks: [],

        health: undefined,
        equippable: undefined,

        trickTimer: 0,
        isEnabled: false,
        isInvulnerable: false,

        // For the blocking mechanic
        isBlocking: false,
        blockTime: 0,
        blockCooldown: 0,
    
        // For the web fluid
        webFluidAmount: 100,
        prevWebFluid: 100,
        maxWebFluid: 100,

        // For the web shooter
        webShooterType: "organic",
        upgradeLevel: 0,
        webShooterUpgrade: undefined,

        // For the general cooldown
        cooldown: 0,

        // For the double jump detection
        isJumping: false,
        doubleJump: false,

        // For the grapple combos
        airStall: false,
        timeInStall: 0,
        stalledEntity: undefined,

        // For charged moves
        charge: 0,
        onReleaseCharge: undefined,
        selectedChargeSlot: undefined,

        // For the web shot combos
        timeSinceLastAttack: 0,
        lastAttackedLocation: undefined,
        lastAttackType: undefined,

        // For the wall climb
        lastWallDirection: undefined,
        wallClimbCount: 0,
        timesTriedToEquipArmor: 0,

        // For the web bar display and chat
        timeInWater: 0,
        chatCooldown: 0,
        lastOpenedMenu: undefined,

        // Web Modifier
        webModifier: undefined,
        webColor: undefined,
        particleMap: undefined,

        // For the actual triggering and activation of the moves
        moveset: [swing, grapple, webShot, undefined, undefined, undefined, undefined, webEditor, equipSuit],

        // Suit
        suit: {
            enabled: false,
            base: {
                texture: 1,
                color: {
                    red: 200,
                    green: 20,
                    blue: 20,
                    alpha: 127
                }
            },
            secondary: {
                texture: 1,
                color: {
                    red: 0,
                    green: 0,
                    blue: 30,
                    alpha: 204
                }
            },
            pattern: {
                texture: 2,
                color: {
                    red: 200,
                    green: 150,
                    blue: 0,
                    alpha: 204
                }
            },
            eyes: {
                texture: 1
            }
        },

        armor: {
            Head: undefined,
            Chest: undefined,
            Legs: undefined,
            Feet: undefined
        },

        activateSlot(slot) {
            if (!this.moveset[slot] || (this.cooldown > 0 && this.webShooterType === "organic") || (this.cooldown > 6 && this.webShooterType === "mechanical") || this.webs.length > 0) return;
            
            if (this.webFluidAmount < this.moveset[slot].webFluidCost && this.webShooterType == "organic") {
                if (this.chatCooldown === 0) {
                    playSound(player, "spiderman.empty", 1, player.location, 1);
                    this.chatCooldown = 10;
                }
                return
            };

            const singleBarCost = this.maxWebFluid / (4 + this.upgradeLevel);
            if (this.webFluidAmount < singleBarCost && this.webShooterType == "mechanical") {
                if (this.chatCooldown === 0) {
                    playSound(player, "spiderman.click", 1, player.location, 0.4);
                    this.chatCooldown = 10;
                }
                return;
            }

            this.moveset[slot].activation(player, this);
        },

        activateSlotCharged(slot) {
            if (!this.moveset[slot] || this.webs.length > 0) return;

            this.moveset[slot].activationCharged(player, this);
        }
    };

    const PLAYER_DATA = PLAYER_DATA_MAP[player.id];

    // To load the rest of the player's build
    loadBuild(player, PLAYER_DATA);

    // So when the player first joins, they have the suit equipped if they had it equipped before
    PLAYER_DATA.suit.enabled = player.getDynamicProperty("SuitEquipped");
    PLAYER_DATA.isEnabled = PLAYER_DATA.suit.enabled;

    // To load the suit visuals
    loadSuit(player, PLAYER_DATA);

    // Setup custom components
    PLAYER_DATA.health = player.getComponent("minecraft:health");
    PLAYER_DATA.equippable = player.getComponent('minecraft:equippable');
};

const index = () => {
    for (const player of world.getPlayers()) {
        if (!PLAYER_DATA_MAP[player.id]) setup(player);
        const PLAYER_DATA = PLAYER_DATA_MAP[player.id];

        // Try is very important here, as it will prevent the runtime from skipping the rest of the players if one of them throws an error
        try { playerRuntime(player, PLAYER_DATA) } catch (err) {}
    }
}

system.run(function runnable() { 
    system.run(runnable);
    index();
});