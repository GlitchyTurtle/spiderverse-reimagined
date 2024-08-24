import { system, MolangVariableMap } from "@minecraft/server";
import { calculateDistance, calculateKnockbackVector, calcVectorOffset, traceLine, spawnWebs, delayedFunc, createShockwave, shootWeb, playSound, spawnEffect } from "../utils.js";

const map = new MolangVariableMap();

const getEntitiesNearViewDirection = (player, rayDistance = 100) => {
    const viewDir = player.getViewDirection();

    for (let i = 0; i < rayDistance; i++) {
        const pos = calcVectorOffset(player, 0, 0, i, viewDir);

        // Check if we hit a solid block
        const rayCast = player.dimension.getBlockFromRay(pos, viewDir, { includePassableBlocks: true, includeLiquidBlocks: true, maxDistance: 1 });
        if (rayCast) return [];

        // Really interesting reverse falloff function that I came up with to check for entities
        // The idea is that the farther away the entity is, the harder it is to hit it so we should expand the detection radius as we go
        const sigmoidFalloff = 1 + 3 / (1 + 3**(-i+5));

        // Check if we hit an entity
        const entities = player.dimension.getEntities({ location: pos, maxDistance: sigmoidFalloff, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] });
        if (entities.length > 0) return entities;
    }

    return [];
}

const spawnWebCircle = (player, radius) => {
    const { x, y, z } = player.location;
    const dimension = player.dimension;

    for (let xBlock = x - radius; xBlock <= x + radius; xBlock++) {
        for (let zBlock = z - radius; zBlock <= z + radius; zBlock++) {
            if (Math.sqrt(Math.pow(xBlock - x, 2) + Math.pow(zBlock - z, 2)) <= radius && !(Math.floor(xBlock) == Math.floor(x) && Math.floor(zBlock) == Math.floor(z))) {
                const block = dimension.getBlock({x: xBlock, y: y , z: zBlock })
                if (!block.isAir || Math.random() < 0.3) continue;

                const typeOfBlock = block.type;
                block.setType("minecraft:web");
                player.dimension.spawnParticle("minecraft:large_explosion", {x: xBlock, y: y , z: zBlock }, map);

                delayedFunc(player, () => {
                    block.setType(typeOfBlock)
                }, Math.random() * 25 + 5);
            }
        }
    }
}

const grappleForwardCombo = (player, target) => {
    createShockwave(player, player.location, 6, 6, 2);
    playSound(player, "spiderman.debris", 1, player.location, 5);
    player.runCommand(`stopsound @s spiderman.swing`);

    const viewDir = player.getViewDirection();
    player.applyKnockback(-viewDir.x, -viewDir.z, 3, 0.5);

    delayedFunc(player, () => {
        spawnWebs(player, target.location, 3, 2);
    }, 5);
}

const grappleUpCombo = (player, PLAYER_DATA, target) => {
    createShockwave(player, player.location, 6, 6, 2);
    playSound(player, "spiderman.debris", 1, player.location, 5);
    player.runCommand(`stopsound @s spiderman.swing`);

    PLAYER_DATA.stalledEntity = target;
    PLAYER_DATA.timeInStall = 0;
    PLAYER_DATA.airStall = true;
}

const grappleDownCombo = (player, PLAYER_DATA)  => {
    PLAYER_DATA.webFluidAmount = Math.min(PLAYER_DATA.webFluidAmount + 50, PLAYER_DATA.maxWebFluid);
    PLAYER_DATA.cooldown = 10;

    createShockwave(player, player.location, 10, 6, 8);
    player.dimension.spawnParticle("minecraft:huge_explosion_emitter", player.location, map);

    if (PLAYER_DATA.webModifier && PLAYER_DATA.webModifier != "sniper") {
        player.dimension.spawnParticle(`a:${PLAYER_DATA.webModifier}_shockwave`, player.location, map);
    } else {
        player.dimension.spawnParticle("a:air_puff", player.location, map);
    }

    player.runCommandAsync("camerashake add @a[r=8] 0.8 0.2 positional");

    playSound(player, "random.explode", 1, player.location, 5);
    playSound(player, "spiderman.debris", 1, player.location, 5);
    player.runCommand(`stopsound @s spiderman.swing`);

    // Get all nearby entities
    player.playAnimation("animation.spiderman.slam");
    const entities = [...player.dimension.getEntities({ location: player.location, maxDistance: 6, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] })];
    entities.forEach(entity => {
        try {
            entity.applyKnockback(0, 0, 0, 1.4);
            entity.addEffect("slow_falling", 25, { amplifier: 255, showParticles: false });
    
            if (PLAYER_DATA.webModifier === "fire") entity.setOnFire(15, true);
        } catch (err) {};
    });

    // Bonus combo for when they used a ranged move and then follow up with a melee move right after
    if (PLAYER_DATA.lastAttackedLocation && calculateDistance(player.location, PLAYER_DATA.lastAttackedLocation) < 6) {
        spawnWebCircle(player, 5); 

        createShockwave(player, PLAYER_DATA.lastAttackedLocation, 10, 8, 10);
        player.dimension.spawnParticle("a:air_puff", PLAYER_DATA.lastAttackedLocation, map);
    }

    if (entities.length == 0) return;

    // All of this is to hold the entities in place for a short duration
    let currentTick = 0;
    let wasAirStall = false;
    const sched_ID = system.runInterval(function tick() {
        if (currentTick > 60) return system.clearRun(sched_ID);
        currentTick++;

        // So we don't keep the entities in place if the player has already done the punch move
        if (wasAirStall && !PLAYER_DATA.airStall) return system.clearRun(sched_ID);
        if (PLAYER_DATA.airStall && !wasAirStall) wasAirStall = true;

        if (currentTick > 20) {
            entities.forEach(entity => {
                entity.applyKnockback(0, 0, 0, 0.03);
            });
        }
    }, 1);

}

const pullTowardsCombo = (player, PLAYER_DATA, target) => {
    let currentTick = 0;
    let endRuntime = false;

    // Pull the entity towards the player
    const sched_ID = system.runInterval(function tick() {
        currentTick++;
        if (currentTick > 140 || endRuntime || !target.isValid()) {
            PLAYER_DATA.airStall = true;
            PLAYER_DATA.timeInStall = 0;
            PLAYER_DATA.stalledEntity = target;
            return system.clearRun(sched_ID);
        }

        const { x, y, z } = target.location;
        const vector = { x: x - player.location.x, y: y - player.location.y, z: z - player.location.z };

        const newTarget = calcVectorOffset(player, 0, 0, -0.5, vector, target.location);
        const distance = calculateDistance(player.location, newTarget);

        traceLine(player, player.location, newTarget, distance, "a:web");

        if (distance < 3) {
            endRuntime = true;

            PLAYER_DATA.airStall = true;
            PLAYER_DATA.timeInStall = 0;
            PLAYER_DATA.stalledEntity = target;
        } else {
            const kbVector = calculateKnockbackVector(player.location, newTarget, 0.1);
            const horizontal = Math.sqrt(kbVector.x ** 2 + kbVector.z ** 2);
    
            target.applyKnockback(kbVector.x, kbVector.z, horizontal*18, kbVector.y*18);
            player.applyKnockback(0, 0, 0, 0.06);
        }
    }, 1);
}

export const grappleActivation = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA.isEnabled) return false;

    const grappleID = Math.random().toString(36).substring(7);
    PLAYER_DATA.grappleID = grappleID;

    let target;
    let isEntity = false;
    const entityRay = getEntitiesNearViewDirection(player, 100);

    if (entityRay.length > 0) {
        target = entityRay[0];
        isEntity = true;
    } else {
        const blockRay = player.getBlockFromViewDirection({ includePassableBlocks: false, includeLiquidBlocks: false });
        if (!blockRay) {
            if (PLAYER_DATA.chatCooldown === 0) {

                if (PLAYER_DATA.webShooterUpgrade === "range") {
                    player.sendMessage([{ text: "§c"}, { translate: "spiderman.warning.aim_at_block_boost" }]);
                } else {
                    player.sendMessage([{ text: "§c"}, { translate: "spiderman.warning.aim_at_block" }]);
                }
                PLAYER_DATA.chatCooldown = 10;
            }
            
            return;
        }

        target = blockRay.block;
    }

    if (PLAYER_DATA.webShooterType == "organic") PLAYER_DATA.webFluidAmount -= 30;
    if (PLAYER_DATA.webShooterType == "mechanical") PLAYER_DATA.webFluidAmount -= PLAYER_DATA.maxWebFluid / (4 + PLAYER_DATA.upgradeLevel);

    const { x, y, z } = target.location;

    const playerTorsoLoc = calcVectorOffset(player, 0, 1.3, 0.5, player.getViewDirection(), player.location);

    const vector = { x: x - playerTorsoLoc.x, y: y - playerTorsoLoc.y, z: z - playerTorsoLoc.z };
    
    let newTargetL = calcVectorOffset(player, 1, 0, -0.5, vector, { x, y, z })
    let newTargetR = calcVectorOffset(player, -1, 0, -0.5, vector, { x, y, z })

    PLAYER_DATA.cooldown = 10;

    shootWeb(player, playerTorsoLoc, newTargetL, 4);
    shootWeb(player, playerTorsoLoc, newTargetR, 4);

    playSound(player, "spiderman.woosh", 4, player.location, 5);
    playSound(player, "spiderman.woosh", 1, player.location, 5);

    const distanceFallen = player.location.y - target.location.y;

    player.addEffect("slow_falling", 5, { amplifier: 5, showParticles: false });

    delayedFunc(player, () => {
        let currentTick = 0;
        let endRuntime = false;
        let lastPosition = player.location;
        let lastPlayerPos = player.location;

        const viewDir = player.getViewDirection();
        const isLookingDown = viewDir.y < -0.9;

        const slam = isLookingDown && distanceFallen > 6;

        const blockBelow = player.dimension.getBlockBelow(player.location, { maxDistance: 5, includePassableBlocks: true, includeLiquidBlocks: true });
        const pullTowards = (isEntity && !slam && !target.isFalling && !player.isOnGround && !blockBelow);
        if (pullTowards) {
            return pullTowardsCombo(player, PLAYER_DATA, target);
        }

        const maxGrappleTime = Math.min(calculateDistance(player.location, target.location)*0.75, 500);

        playSound(player, "spiderman.swing", 1, player.location, 5);        
        const sched_ID = system.runInterval(function tick() {
            if (PLAYER_DATA.grappleID != grappleID) endRuntime = true;

            if (currentTick > maxGrappleTime || endRuntime) {
                player.runCommand(`stopsound @s spiderman.swing`);

                return system.clearRun(sched_ID);
            }
            currentTick++;

            if (isEntity) {
                const { x, y, z } = target.location;
                const vector = { x: x - player.location.x, y: y - player.location.y, z: z - player.location.z };            
                newTargetL = calcVectorOffset(player, 1, 0, -0.5, vector, { x, y, z })
                newTargetR = calcVectorOffset(player, -1, 0, -0.5, vector, { x, y, z })
            }
            
            const start = player.location;
            const distance = calculateDistance(start, newTargetL);

            const playerTorsoLoc = calcVectorOffset(player, 0, 1.3, 0.5, viewDir, player.location);

            traceLine(player, playerTorsoLoc, newTargetL, Math.min(distance*3, 40), "a:web");
            traceLine(player, playerTorsoLoc, newTargetR, Math.min(distance*3, 40), "a:web");

            if (PLAYER_DATA.webModifier) player.dimension.spawnParticle(`a:${PLAYER_DATA.webModifier}_web`, playerTorsoLoc, map);

            if (currentTick % 40 == 0) playSound(player, "spiderman.swing", 1, player.location, 5);

            if (distance < 2) endRuntime = true;

            if (slam) {
                player.addEffect("slow_falling", 25, { amplifier: 5, showParticles: false });
                player.applyKnockback(0, 0, 0, -8);

                const playerPos = player.location;
                traceLine(player, lastPlayerPos, playerPos, 25, "a:air_flutter");
                traceLine(player, lastPlayerPos, playerPos, 25, "a:air_blast_tiny");

                if (PLAYER_DATA.webModifier) traceLine(player, lastPlayerPos, playerPos, 15, `a:${PLAYER_DATA.webModifier}_web`);

                lastPlayerPos = playerPos;
            } else {
                const kbVector = calculateKnockbackVector(start, newTargetL, 0.1);
                const horizontal = Math.sqrt(kbVector.x ** 2 + kbVector.z ** 2);
    
                player.applyKnockback(-kbVector.x, -kbVector.z, horizontal*18, -kbVector.y*18);    
            }

            const velocity = player.getVelocity();
            const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

            if (speed < 0.3 && currentTick > 5) endRuntime = true;
            lastPosition = player.location;

            if (slam && velocity.y == 0) endRuntime = true;

            player.addEffect("slow_falling", 5, { amplifier: 1, showParticles: false });
     
            if ((endRuntime || currentTick > maxGrappleTime) && isEntity && !target.isOnGround) {
                grappleUpCombo(player, PLAYER_DATA, target);
            } else if ((endRuntime || currentTick > maxGrappleTime) && slam) {
                grappleDownCombo(player, PLAYER_DATA);
            } else if ((endRuntime || currentTick > maxGrappleTime) && isEntity) {
                grappleForwardCombo(player, target);
            } else if (endRuntime || currentTick > maxGrappleTime) {
                player.applyKnockback(0, 0, 0, 1.2);
                player.runCommand(`stopsound @s spiderman.swing`);
                playSound(player, "spiderman.release", 1, player.location, 5);
            }
        }, 1);
    }, 4);
}

const releaseCharge = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA.isEnabled) return false;
    if (PLAYER_DATA.charge < 50) return;

    const CHARGE_FACTOR = PLAYER_DATA.charge / 100;
    let entities = player.dimension.getEntities({ location: player.location, maxDistance: 32*CHARGE_FACTOR, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] });

    let currentTick = 0;
    let endRuntime = false;
    const sched_ID = system.runInterval(function tick() {
        if (currentTick > 42) return system.clearRun(sched_ID);

        if (currentTick > 40 || endRuntime) {
            createShockwave(player, player.location, 6, 6, 2);

            player.dimension.spawnParticle("a:air_puff", player.location, map);
            player.dimension.spawnParticle("minecraft:huge_explosion_emitter", player.location, map);
            player.runCommandAsync("camerashake add @a[r=8] 0.8 0.2 positional");
        
            playSound(player, "random.explode", 1, player.location, 5);
            playSound(player, "spiderman.debris", 1, player.location, 5);

            spawnWebs(player, player.location, 28, 8);

            return system.clearRun(sched_ID);
        }

        currentTick++;
        PLAYER_DATA.cooldown = 10;

        for (const entity of entities) {
            const kbVector = calculateKnockbackVector(entity.location, player.location, 1);
            const horizontal = Math.sqrt(kbVector.x ** 2 + kbVector.z ** 2);

            if (calculateDistance(player.location, entity.location) < 3) {
                entities = entities.filter(e => e.id !== entity.id);
            }

            traceLine(player, player.getHeadLocation(), entity.location, 30, "a:web");
            entity.applyKnockback(-kbVector.x, -kbVector.z, horizontal * 6, -kbVector.y * 6);
        }

        if (entities.length == 0) endRuntime = true;
    }, 1);

    spawnEffect(player, 0, "a:air_flutter", 12);
    player.dimension.spawnParticle("minecraft:egg_destroy_emitter", player.location, map);
}

const grappleChargedActivation = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA.isEnabled) return false;
    PLAYER_DATA.cooldown = 10;

    PLAYER_DATA.selectedChargeSlot = player.selectedSlotIndex;

    if (PLAYER_DATA.webFluidAmount > 0) {
        PLAYER_DATA.charge += 2;
        PLAYER_DATA.webFluidAmount = Math.max(0, PLAYER_DATA.webFluidAmount - 2);
    }

    if (PLAYER_DATA.charge > 10) {
        const amount = Math.floor(Math.max(PLAYER_DATA.charge/15, 1));
        spawnEffect(player, 0, "a:web_shot", amount);
    
        player.runCommand(`camerashake add @a[r=8] ${PLAYER_DATA.charge/100} 0.05 positional`);
    }

    if (PLAYER_DATA.onReleaseCharge === undefined) PLAYER_DATA.onReleaseCharge = releaseCharge;
}

export const grapple = {
    name: { translate: "spiderman.move.grapple" },
    webFluidCost: 30,
    activation(player, PLAYER_DATA) {
        if (!PLAYER_DATA.isEnabled) return;
        grappleActivation(player, PLAYER_DATA);
    },
    activationCharged(player, PLAYER_DATA) {
        if (!PLAYER_DATA.isEnabled) return;
        grappleChargedActivation(player, PLAYER_DATA);
    }
}