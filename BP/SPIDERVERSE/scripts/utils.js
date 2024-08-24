import { world, system, Player, GameMode, MolangVariableMap, ItemStack, EnchantmentType } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui"
import { config } from "./config.js";

import { PLAYER_DATA_MAP } from "./index.js";

// Any function that requires particles can be sped up by using only one global map
const map = new MolangVariableMap();

/**
 * Gets a players score.
 * @param {string} objective Scoreboard objective.
 * @param {Player} target The player object.
 * @returns {number} The score for the player.
 */
export const getScore = (objective, target) => {
    try {
        const oB = world.scoreboard.getObjective(objective);
        return oB.getScore(target.scoreboardIdentity);
    } catch (error) {
        return undefined;
    }
};

/**
 * Shows a warning message to a player.
 * @param {Player} source The player object to show the warning to.
 * @param {string} title The title of the warning.
 * @param {string} message The message of the warning.
 * @param {Function} returnFunc The function to run after the warning is closed.
 * @returns {void}
 */
export const showWarning = (source, title, message, returnFunc = null) => {
	const warningMenu = new ActionFormData()
        .title(title)
        .body(message)
	    .button("Got it.")
	    .show(source).then(result => {
            if (!returnFunc) return;
            returnFunc(source);
        });
}

/**
 * Gets the game mode of a player.
 * @param {Player} player The player object.
 * @returns {string} The game mode of the player as a string.
 */
export const getGamemode = (player) => {
    return Object.values(GameMode).find(
      (g) => [...world.getPlayers({ name: player.name, gameMode: g })].length
    );
}

/**
 * Set the score of a player or other entity
 * @param {Entity|string} target The entity or dummy player to change the score of.
 * @param {string} objective The objective to change the score on.
 * @param {number} amount The amount to change the score by.
 * @param {boolean} stack If the score should stack on top of the previous value set.
 * @returns {number} The new score that was set, or NaN if no objective or initial entity score was found or set.
 */
export const setScore = (target, objective, amount, stack = false) => {
    const scoreObj = world.scoreboard.getObjective(objective);
    let score;
    const isParticipant = scoreObj.getParticipants().some((target) => target.id === target.id);
    if (isParticipant !== undefined) {
        score = scoreObj.getScore(target.scoreboardIdentity);
    } else {
        target.runCommand(`scoreboard players add @s ${objective} 0`);
        return 0;
    }
    const result = (stack ? score ?? 0 : 0) + amount;
    scoreObj.setScore(target.scoreboardIdentity, result);
    return score;
}

/**
 * Delays a function a certain number of ticks.
 * @param {Player} player The player entity the function will run at.
 * @param {Function} func The function ran after the delay.
 * @param {number} tickDelay The number of ticks delayed for. Default 1.
 * @returns {void}
 */
export const delayedFunc = (player, func, tickDelay = 1) => {
    system.runTimeout(() => {
        func(player);
    }, tickDelay);
};

/**
 * Plays a sound relative to an entity.
 * @param {Entity} entity
 * @param {string} sound The sound to play- like note.pling.
 * @param {number} pitch The pitch of the sound. 
 * @param {string} location Location to play the sound at.
 * @param {number} volume The volume of the sound.
 * @returns {void}
 */
export const playSound = (entity, sound, pitch = 1, location = { x: entity.location.x, y: entity.location.y, z: entity.location.z }, volume = 1) => {
    entity.playSound(sound, {
        pitch: pitch,
        volume: volume,
        location: location
    });
};

/**
 * Normalizes the given vector and scales it by the factor `s`.
 * @param {Vector3} vector - The 3D vector to normalize.
 * @param {number} s - The scale factor to apply to the normalized vector.
 * @returns {Vector3} The normalized and scaled vector.
 */
export const normalizeVector = (vector, s) => {
    let l = Math.hypot(vector.x,vector.y,vector.z)
    return {
        x: s * (vector.x/l),
        y: s * (vector.y/l),
        z: s * (vector.z/l)
    }
}

/**
 * Finds a location based on their view direction and the scaling factors from the players current position, the same as ^^^ in commands.
 * @param {object} player - The player object to base the view direction and starting position on.
 * @param {number} xf - The scaling factor for the x direction.
 * @param {number} yf - The scaling factor for the y direction.
 * @param {number} zf - The scaling factor for the z direction.
 * @returns {{x: number, y: number, z: number}} The transformed location.
 */
export const calcVectorOffset = (player, xf, yf, zf, d = player.getViewDirection(), l = player.location) => {
    let m = Math.hypot(d.x, d.z);
    let xx = normalizeVector({
        x: d.z,
        y: 0,
        z: -d.x
    }, xf);
    let yy = normalizeVector({
        x: (d.x / m) * -d.y,
        y: m,
        z: (d.z / m) * -d.y
    }, yf);
    let zz = normalizeVector(d, zf);

    return {
        x: l.x + xx.x + yy.x + zz.x,
        y: l.y + xx.y + yy.y + zz.y,
        z: l.z + xx.z + yy.z + zz.z
    };
}

/**
 * Calculates the knockback vector based on an entity's position, a force source position, and the force magnitude.
 * @param {Vector3} entityPosition - The position of the entity as a Vector3.
 * @param {Vector3} forceSourcePosition - The position of the force source as a Vector3.
 * @param {Vector3} forceMagnitude - The magnitude of the force to be applied.
 * @returns {Vector3} The knockback vector as a Vector3.
 */
export const calculateKnockbackVector = (entityPosition, pusherPosition, forceMagnitude) => {
    let direction = {
        x: entityPosition.x - pusherPosition.x,
        y: entityPosition.y - pusherPosition.y,
        z: entityPosition.z - pusherPosition.z
    };
  
    let distance = magnitude(direction);
  
    // Normalize the direction vector so it has a magnitude of 1
    direction = {
        x: direction.x / distance,
        y: direction.y / distance,
        z: direction.z / distance
    };
  
    // Scale the direction vector by the force magnitude to get the final knockback vector
    let knockback = {
        x: direction.x * forceMagnitude,
        y: direction.y * forceMagnitude,
        z: direction.z * forceMagnitude
    };
  
    return knockback;
}

/**
 * Calculates the distance between an position and another position.
 * @param {Vector3} entityPosition - The position of the entity as a Vector3.
 * @param {Vector3} forceSourcePosition - The position of the force source as a Vector3.
 * @param {Vector3} forceMagnitude - The magnitude of the force to be applied.
 * @returns {Vector3} The knockback vector as a Vector3.
 */
export function calculateDistance(posA, posB) {
    let direction = {
        x: posA.x - posB.x,
        y: posA.y - posB.y,
        z: posA.z - posB.z
    };
    return magnitude(direction);
}

/**
 * Calculates the magnitude of a Vector3.
 * @param {Vector3} entityPosition - The Vector3 input.
 * @returns {number} The magnitude of the vector.
 */
export function magnitude(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

/**
 * Applies damage to an entity based on the damage type and amount.
 * @param {Player} player The player object used for dimension and particles.
 * @param {Vector3} startPoint The position the particles will originate from.
 * @param {Vector3} endPoint The position the particles will end at.
 * @param {number} numOfPoints The number of particles in between the start and end points.
 * @param {string|boolean} particle The particle to spawn, or false to not spawn particles and return vector3 positions.
 * @returns {Vector3[]} An array of Vector3 positions for the particles.
 */
export const traceLine = (player, pStart, pEnd, numOfPoints, particle) => {
    let customMap = map;
    if (player instanceof Player) {
        customMap = PLAYER_DATA_MAP[player.id].particleMap;
    }

    const point1 = pStart;
    const point2 = pEnd;
    const distance = calculateDistance(point1, point2);
    const vectorDir = { x: point1.x - point2.x, y: point1.y - point2.y, z: point1.z - point2.z };

    const midPoint = { x: (point1.x + point2.x) / 2, y: (point1.y + point2.y) / 2, z: (point1.z + point2.z) / 2 };

    customMap.setVector3("variable.direction", vectorDir);
    customMap.setFloat("variable.length", distance/2);
    player.dimension.spawnParticle("a:web_line", midPoint, customMap);
}


/**
 * Checks if a ray is clear from the start to end position.
 * @param {Player} player The player object used for dimension and particles.
 * @param {Vector3} start The starting position of the ray.
 * @param {Vector3} end The ending position of the ray.
 * @returns {boolean} True if the ray is clear, false if it is obstructed.
 */
export const isRayClear = (player, start, end) => {    
    // Get the view direction from start position to end position
    const viewDir = {
        x: end.x - start.x,
        y: end.y - start.y,
        z: end.z - start.z
    };

    // Normalize the view direction
    const magnitude = Math.sqrt(viewDir.x * viewDir.x + viewDir.y * viewDir.y + viewDir.z * viewDir.z);
    viewDir.x /= magnitude;
    viewDir.y /= magnitude;
    viewDir.z /= magnitude;

    // Check if the ray is clear
    const block = player.dimension.getBlockFromRay(start, viewDir, { maxDistance: magnitude, includePassableBlocks: false, includeLiquidBlocks: false });
    return !block;
}

/**
 * Creates a shockwave that does damage to all entities near the location and applies knockback, both damage and knockback increase via distance to the origination point.
 * @param {Player} player The player object that the shockwave will originate from, and who is immune.
 * @param {object} spawnPos The position the shockwave will spawn from.
 * @param {number} strength The power of the shockwave, in damage.
 * @param {number} range The range of the shockwave that entities can be affected by, as damage smooths at the outer rim.
 * @param {number | undefined} knockbackForce The additional multiplier for the knockback that is using the shockwave
 */
export const createShockwave = (player, spawnPos, strength, range, knockbackForce = 1, webModifier = "none") => {
    // Create the needed variables for kb and pos
    const dimension = player.dimension;
    const entities = [...dimension.getEntities({ location: spawnPos, maxDistance: range, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTypes: ["item"] })];
    const items = [...dimension.getEntities({ location: spawnPos, maxDistance: range, type: "item" })];

    // Loop through all nearby entities (not items though)
    entities.forEach(entity => {
        // Calculate damage
        const distance = calculateDistance(entity.location, spawnPos);
        const kbIntensity = knockbackForce / (1 + Math.exp(-5 * (Math.ceil(distance) - 0.5)));
        const damageIntensity = strength / (1 + Math.exp(-5 * (Math.ceil(distance) - 0.5)));
        const kbVector = calculateKnockbackVector(entity.location, spawnPos, kbIntensity/2);

        if (!isRayClear(player, spawnPos, entity.location)) return;

        // Apply damage and knockback
        if (entity instanceof Player) {
            const PLAYER_DATA = PLAYER_DATA_MAP[entity.id];
            if (PLAYER_DATA.isInvulnerable) return;

            if (PLAYER_DATA.isBlocking) {
                if (Math.random() > 0.5) {
                    entity.sendMessage([{ text: "§6"}, { translate: "spiderman.block.perfect" }]);
                } else {
                    entity.sendMessage([{ text: "§6"}, { translate: "spiderman.block.good" }]);
                }

                const targetViewDir = entity.getViewDirection();
                const spawnPos = calcVectorOffset(entity, 0, 0.5, 1);
    
                const directedMap = new MolangVariableMap();
                directedMap.setVector3("variable.plane", targetViewDir);
    
                entity.dimension.spawnParticle("a:block_indicator", spawnPos, directedMap);
                playSound(entity, "note.pling", 3, entity.location, 1);

                entity.addEffect("resistance", 60, { amplifier: 255, showParticles: true });
                entity.addEffect("strength", 60, { amplifier: 3, showParticles: true });
            }

            entity.applyDamage(damageIntensity, { cause: "entityAttack", damagingEntity: player });
        } else {
            entity.applyDamage(damageIntensity*2.5, { cause: "entityAttack", damagingEntity: player });
        }

        if (webModifier === "fire") entity.setOnFire(15, true);

        try {
            entity.applyKnockback(kbVector.x, kbVector.z, kbIntensity/4, kbIntensity/20);
        } catch (error) {} 
    });
    items.forEach(item => { item.applyImpulse(calculateKnockbackVector(item.location, spawnPos, 1)); });
}


/**
 * Spawns a number of web blocks around a location in a players dimension.
 * @param {Player} player The player object used to find the dimension of the location.
 * @param {object} location The location the webs will spawn around.
 * @param {number} amount The number of webs to spawn.
 * @param {number} radius The radius around the location to spawn the webs.
 */
export const spawnWebs = (player, location, amount = 8, radius = 4) => {
    for (let i = 0; i < amount; i++) {
        const randomPos = calcVectorOffset(player, Math.random() * radius - radius/2, Math.random() * radius - radius/2, Math.random() * radius - radius/2, player.getViewDirection(), location);
        
        // Accessing a block outside world bounds will throw an error
        if (randomPos.y > 254 || randomPos.y < -62) continue;

        const block = player.dimension.getBlock(randomPos);
        player.dimension.spawnParticle("minecraft:large_explosion", randomPos, map);

        if (block.isAir) {
            PLAYER_DATA_MAP[player.id].webBlocks.push(randomPos);
            block.setType("minecraft:web");

            delayedFunc(player, (removeBlock) => {
                block.setType("minecraft:air");

                PLAYER_DATA_MAP[player.id].webBlocks = PLAYER_DATA_MAP[player.id].webBlocks.filter((pos) => pos != randomPos);

            }, 40 * Math.random() + 50);
        }
    }
}

/**
 * Spawns a trail of particles behind an entity.
 * @param {Entity} entity The entity to spawn the trail behind.
 * @param {number} time The number of ticks to spawn the trail for.
 */
export const spawnTrail = (entity, time) => {
    let currentTick = 0;
    let lastEntityPos = entity.location;
    const sched_ID = system.runInterval(function tick() {
        if (currentTick > time) return system.clearRun(sched_ID);
        currentTick++;

        if (!entity.isValid()) return system.clearRun(sched_ID);

        const playerPos = entity.location;
        traceLine(entity, lastEntityPos, playerPos, 5, "a:air_flutter")
        traceLine(entity, lastEntityPos, playerPos, 25, "a:air_blast_tiny")
        lastEntityPos = playerPos;
    }, 1);
}

/**
 * Spawns a particle effect around an entity.
 * @param {Entity} entity The entity to spawn the effect around.
 * @param {number} time The number of ticks to spawn the effect for.
 * @param {string} particle The particle to spawn.
 */
export const spawnEffect = (entity, time, particle, amount = 1) => {
    let map2 = map;
    if (entity instanceof Player) {
        map2 = PLAYER_DATA_MAP[entity.id].particleMap;
    }

    if (time <= 1) {
        // Do it faster without runInterval
        if (!entity.isValid()) return;
        for (let i = 0; i < amount; i++) {
            const { x, y, z } = entity.location;
            const randomOffset = { x: Math.random() * 2 - 1, y: Math.random() * 2, z: Math.random() * 2 - 1 };
            const pos = { x: x + randomOffset.x, y: y + randomOffset.y, z: z + randomOffset.z };
            entity.dimension.spawnParticle(particle, pos, map2);
        }
        return;
    }

    let currentTick = 0;
    const sched_ID = system.runInterval(function tick() {
        if (currentTick > time) return system.clearRun(sched_ID);
        currentTick++;

        if (!entity.isValid()) return system.clearRun(sched_ID);

        // Take the current location and add a random offset
        for (let i = 0; i < amount; i++) {
            const { x, y, z } = entity.location;
            const randomOffset = { x: Math.random() * 2 - 1, y: Math.random() * 2, z: Math.random() * 2 - 1 };
            const pos = { x: x + randomOffset.x, y: y + randomOffset.y, z: z + randomOffset.z };
            entity.dimension.spawnParticle(particle, pos, map);
        }

    }, 1);
}

/**
 * Spawns a web projectile from a player to a location.
 * @param {Player} player The player object to spawn the web from.
 * @param {Vector3} start The starting position of the web.
 * @param {Vector3} end The ending position of the web.
 * @param {number} time The number of ticks the web will take to reach the end.
 * @param {number} points The number of points to spawn along the web.
 * @returns {void}
 */
export const shootWeb = (player, start, end, time, points) => {
    let liveUpdate = false;
    if (start instanceof Player) {
        liveUpdate = true;
        start = start.location;
    }

    if (!points) points = calculateDistance(start, end) * 3;
    let currentTick = 0;
    let endRuntime = false;
    const sched_ID = system.runInterval(function tick() {
        if (currentTick > time || endRuntime) return system.clearRun(sched_ID);
        currentTick++;

        if (liveUpdate) start = player.location;

        const ratio = currentTick / time;

        // Get point on the line formed between start and end points
        const x = (1 - ratio) * start.x + ratio * end.x;
        const y = (1 - ratio) * start.y + ratio * end.y;
        const z = (1 - ratio) * start.z + ratio * end.z;

        const position = { x, y, z };
        traceLine(player, start, position, points, "a:web");
    }, 1);
};


export const isShockImmune = (entity) => {
    try {
        const armorSlots = ["Head", "Chest", "Legs", "Feet"]
        let shockDamage = 1;
        for (const slotName of armorSlots) {
            const item = entity.getComponent('minecraft:equippable').getEquipment(slotName);

            if (item && item.typeId.includes("chainmail")) {
                shockDamage -= 0.25;
            }
        }

        return shockDamage;
    } catch (error) {
        return 1;
    }
}

export const equipSuitParticle = (player) => {
    player.inputPermissions.movementEnabled = false;

    const PLAYER_DATA = PLAYER_DATA_MAP[player.id];
    const SUIT = PLAYER_DATA.suit;

    const base = new MolangVariableMap();
    base.setVector3("variable.plane", {
        x: SUIT.base.color.red/255,
        y: SUIT.base.color.green/255,
        z: SUIT.base.color.blue/255
    });

    const secondary = new MolangVariableMap();
    secondary.setVector3("variable.plane", {
        x: SUIT.secondary.color.red/255,
        y: SUIT.secondary.color.green/255,
        z: SUIT.secondary.color.blue/255
    });

    const pattern = new MolangVariableMap();
    pattern.setVector3("variable.plane", {
        x: SUIT.pattern.color.red/255,
        y: SUIT.pattern.color.green/255,
        z: SUIT.pattern.color.blue/255
    });

    try { player.dimension.spawnParticle("a:equip_suit", player.location, base) } catch (error) {};
    try { player.dimension.spawnParticle("a:equip_suit", player.location, secondary) } catch (error) {};
    try { player.dimension.spawnParticle("a:equip_suit", player.location, pattern) } catch (error) {};

    delayedFunc(player, () => {
        PLAYER_DATA.isEnabled = !PLAYER_DATA.isEnabled;
        if (PLAYER_DATA.suit.enabled) return removeSuit(player, PLAYER_DATA);

        PLAYER_DATA.suit.enabled = true;
        loadSuit(player, PLAYER_DATA);
    }, 9);

    delayedFunc(player, () => {
        player.inputPermissions.movementEnabled = true;
    }, 16);
}

export const loadSuit = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA) PLAYER_DATA = PLAYER_DATA_MAP[player.id];

    const SUIT = PLAYER_DATA.suit;
    if (!SUIT) return;

    if (!SUIT.enabled) return removeSuit(player, PLAYER_DATA);

    const saved = player.getDynamicProperty("ArmorSaved");
    if (!saved) saveArmor(player, PLAYER_DATA);

    player.setProperty("suit:base_layer", SUIT.base.texture);
    player.setProperty("suit:base_layer_red", SUIT.base.color.red/255);
    player.setProperty("suit:base_layer_green", SUIT.base.color.green/255);
    player.setProperty("suit:base_layer_blue", SUIT.base.color.blue/255);
    player.setProperty("suit:base_layer_alpha", SUIT.base.color.alpha/255);
    
    player.setProperty("suit:secondary_layer", SUIT.secondary.texture);
    player.setProperty("suit:secondary_layer_red", SUIT.secondary.color.red/255);
    player.setProperty("suit:secondary_layer_green", SUIT.secondary.color.green/255);
    player.setProperty("suit:secondary_layer_blue", SUIT.secondary.color.blue/255);
    player.setProperty("suit:secondary_layer_alpha", SUIT.secondary.color.alpha/255);

    player.setProperty("suit:pattern_layer", SUIT.pattern.texture);
    player.setProperty("suit:pattern_layer_red", SUIT.pattern.color.red/255);
    player.setProperty("suit:pattern_layer_green", SUIT.pattern.color.green/255);
    player.setProperty("suit:pattern_layer_blue", SUIT.pattern.color.blue/255);
    player.setProperty("suit:pattern_layer_alpha", SUIT.pattern.color.alpha/255);

    player.setProperty("suit:eyes", SUIT.eyes.texture);

    if (config.suitHidesNameTag) player.nameTag = "";
    player.setDynamicProperty("SuitEquipped", true);
}

export const removeSuit = (player, PLAYER_DATA) => {
    const saved = player.getDynamicProperty("ArmorSaved");
    if (saved) loadArmor(player);

    PLAYER_DATA.suit.enabled = false;
    player.setProperty("suit:base_layer", 0);
    player.setProperty("suit:secondary_layer", 0);
    player.setProperty("suit:pattern_layer", 0);
    player.setProperty("suit:eyes", 0);

    player.removeEffect("resistance");
    player.removeEffect("jump_boost");
    player.removeEffect("speed");

    player.nameTag = player.name;
    player.setDynamicProperty("SuitEquipped", false);
}

export const saveArmor = (player, PLAYER_DATA) => {
    const armorSlots = ["Head", "Chest", "Legs", "Feet"];
    const equippable = player.getComponent('minecraft:equippable');

    let tag = {
        Head: {
            enchantments: []
        },
        Chest: {
            enchantments: []
        },
        Legs: {
            enchantments: []
        },
        Feet: {
            enchantments: []
        }
    };

    for (const slotName of armorSlots) {
        const item = equippable.getEquipment(slotName);

        if (item) {
            PLAYER_DATA.armor[slotName] = item;
            equippable.setEquipment(slotName, undefined);

            tag[slotName].typeId = item.typeId;
            tag[slotName].nameTag = item.nameTag;
            tag[slotName].damage = item.getComponent('minecraft:durability').damage;
            item.getComponent('minecraft:enchantable').getEnchantments().forEach((enchantment) => {
                tag[slotName].enchantments.push({ type: enchantment.type.id, level: enchantment.level });
            });
        }
    }

    player.setDynamicProperty("ArmorSaved", `${JSON.stringify(tag)}`);
}

export const loadArmor = (player) => {
    const armorTag = player.getDynamicProperty("ArmorSaved");
    if (!armorTag) return;

    const tag = JSON.parse(armorTag.replace("ArmorSaved:", ""));
    const equippable = player.getComponent('minecraft:equippable');

    for (const slotName of Object.keys(tag)) {
        const item = tag[slotName];

        if (item.typeId) {
            const itemStack = new ItemStack(item.typeId);
            itemStack.nameTag = item.nameTag;
            itemStack.getComponent('minecraft:durability').damage = item.damage;

            if (item.enchantments) {
                item.enchantments.forEach((enchantment) => {
                    itemStack.getComponent('minecraft:enchantable').addEnchantment({
                        type: new EnchantmentType(enchantment.type), 
                        level: enchantment.level
                    });
                });
            }

            equippable.setEquipment(slotName, itemStack);
        }
    }

    player.setDynamicProperty("ArmorSaved", undefined);
}

export function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r, g, b) {
    [r, g, b] = [Math.round(r), Math.round(g), Math.round(b)];
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

export const saveBuild = (player, PLAYER_DATA) => {
    // Stuff to save:
    const suitParts = [
        PLAYER_DATA.suit.base.texture,
        PLAYER_DATA.suit.base.color,
        PLAYER_DATA.suit.secondary.texture,
        PLAYER_DATA.suit.secondary.color,
        PLAYER_DATA.suit.pattern.texture,
        PLAYER_DATA.suit.pattern.color,
        PLAYER_DATA.suit.eyes.texture,
    ];

    // Save the suit data
    player.setDynamicProperty("SuitSaved", `${JSON.stringify(suitParts)}`);

    // Save the web shooter data
    player.setDynamicProperty("WebShooterType", PLAYER_DATA.webShooterType);
    player.setDynamicProperty("WebShooterUpgrade", PLAYER_DATA.webShooterUpgrade);
    player.setDynamicProperty("UpgradeLevel", PLAYER_DATA.upgradeLevel);

    // Save web modifier
    player.setDynamicProperty("WebModifier", PLAYER_DATA.webModifier);

    // Save web color
    if (PLAYER_DATA.webColor) player.setDynamicProperty("WebColor", `${JSON.stringify(PLAYER_DATA.webColor)}`);
};

export const loadBuild = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA) PLAYER_DATA = PLAYER_DATA_MAP[player.id];
    
    const SUIT_SAVED = player.getDynamicProperty("SuitSaved");

    if (!SUIT_SAVED) return;

    // Load the suit data
    const loadedSuitParts = JSON.parse(SUIT_SAVED);
    PLAYER_DATA.suit.base.texture = loadedSuitParts[0];
    PLAYER_DATA.suit.base.color = loadedSuitParts[1];
    PLAYER_DATA.suit.secondary.texture = loadedSuitParts[2];
    PLAYER_DATA.suit.secondary.color = loadedSuitParts[3];
    PLAYER_DATA.suit.pattern.texture = loadedSuitParts[4];
    PLAYER_DATA.suit.pattern.color = loadedSuitParts[5];
    PLAYER_DATA.suit.eyes.texture = loadedSuitParts[6];

    // Load the web shooter data
    PLAYER_DATA.webShooterType = player.getDynamicProperty("WebShooterType");
    PLAYER_DATA.webShooterUpgrade = player.getDynamicProperty("WebShooterUpgrade");
    PLAYER_DATA.upgradeLevel = player.getDynamicProperty("UpgradeLevel");

    if (PLAYER_DATA.webShooterUpgrade == "capacity") {
        PLAYER_DATA.upgradeLevel = 2;
    } else {
        PLAYER_DATA.upgradeLevel = 0;
    }

    // Load web modifier
    PLAYER_DATA.webModifier = player.getDynamicProperty("WebModifier");

    // Load web color
    const colorJSON = player.getDynamicProperty("WebColor");
    if (!colorJSON) return;
    PLAYER_DATA.webColor = JSON.parse(colorJSON);
    const color = PLAYER_DATA.webColor;
    if (!color || !Object.values(color).length) return;
    const colorMap = new MolangVariableMap();
    colorMap.setVector3("variable.plane", { x: color.red / 255, y: color.green / 255, z: color.blue / 255 });
    PLAYER_DATA.particleMap = colorMap;
};