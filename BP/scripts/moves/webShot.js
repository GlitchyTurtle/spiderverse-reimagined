import { system, MolangVariableMap, Player } from "@minecraft/server";
import { calculateDistance, calcVectorOffset, spawnWebs, createShockwave, playSound, spawnEffect, delayedFunc, isShockImmune, oldTraceLine } from "../utils.js";

import { config } from "../config.js";

const map = new MolangVariableMap();

const ALL_WEB_SHOTS = {}

const maxBlocksAffected = config.conductiveMaxBlocks;
const conductiveBlocks = config.conductiveBlocks;

function getAllBlocksAround(player, location, radius) {
    const blocks = [];
    for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
            for (let z = -radius; z <= radius; z++) {
                const loc = { x: location.x + x, y: location.y + y, z: location.z + z };
                const block = player.dimension.getBlock(loc);

                blocks.push(block);
            }
        }
    }

    return blocks;
}

function getNeighbors(block) {
    const neighbors = [];
    const directions = ['north', 'south', 'east', 'west', 'above', 'below'];

    // Randomize the directions
    directions.sort(() => Math.random() - 0.5);

    for (const direction of directions) {
        const neighbor = block[direction]();
        if (neighbor) {
            neighbors.push(neighbor);
        }
    }

    return neighbors;
}

function dfs(startBlock) {
    const stack = [startBlock];
    const visited = new Set();
    const connectedBlocks = [];

    while (stack.length > 0) {
        if (connectedBlocks.length > maxBlocksAffected) {
            break;
        }
        const currentBlock = stack.pop();
        const key = `${currentBlock.location.x},${currentBlock.location.y},${currentBlock.location.z}`;

        if (visited.has(key)) {
            continue;
        }

        visited.add(key);

        if (conductiveBlocks.includes(currentBlock.typeId)) {
            connectedBlocks.push(currentBlock);
            const neighbors = getNeighbors(currentBlock);
            for (const neighbor of neighbors) {
                stack.push(neighbor);
            }
        }
    }

    return connectedBlocks;
}


const shootWeb = (player, PLAYER_DATA, travelDir, isMini = false, chargeMultiplier = 1) => {
    let currentTick = -1;
    let endRuntime = false;
    let currentLocation;
    let lastPositions = [];

    if (PLAYER_DATA.webModifier === "sniper") {
        chargeMultiplier = 1.5;
        currentTick = -4;
    }

    const sched_ID = system.runInterval(function tick() {
        // In case of errors
        currentTick += 2;
        if (currentTick > 205) {
            delete ALL_WEB_SHOTS[sched_ID];
            return system.clearRun(sched_ID);
        }
        if (currentTick > 105*chargeMultiplier) endRuntime = true;

        // Slightly angle the travel direction downwards to simulate gravity
        travelDir.y -= 0.02;
        if (PLAYER_DATA.webModifier === "sniper") {
            travelDir.y += 0.02;
            currentTick += 2;
        } else if (PLAYER_DATA.webShooterUpgrade === "range") {
            travelDir.y += 0.01;
        }


        // Find the block current location based on the last particle location
        let currentPos;
        let lastPos;
        try {
            if (!currentLocation) currentLocation = calcVectorOffset(player, 0, 0.5, currentTick, travelDir);
            currentPos = calcVectorOffset(player, 0, 0.5, currentTick, travelDir, currentLocation);

            lastPositions.push(currentPos);
            
            if (lastPositions.length > 4) lastPositions.shift();
            lastPos = lastPositions[0];

            if (lastPositions.length < 4) lastPos = calcVectorOffset(player, 0, 0.5, 0, travelDir, currentLocation);

        } catch (error) {
            return system.clearRun(sched_ID);
        }

        const isInBounds = currentPos.y < 250 && currentPos.y > -60;
        if (!isInBounds) {
            delete ALL_WEB_SHOTS[sched_ID];
            return system.clearRun(sched_ID);
        }

        const lengthOfWebShots = Object.keys(ALL_WEB_SHOTS).length;
        if (!ALL_WEB_SHOTS[sched_ID] && lengthOfWebShots < 4) {
            ALL_WEB_SHOTS[sched_ID] = [currentPos, false, player.id];
        } else if (lengthOfWebShots < 4) {
            ALL_WEB_SHOTS[sched_ID][0] = currentPos;
        }

        if (!currentPos) {
            delete ALL_WEB_SHOTS[sched_ID];
            return system.clearRun(sched_ID);
        }

        // Check if we are hitting other web shots
        // I don't care how inefficient this is, it's COOl
        // Before you make fun of me, go check out avatar addon and see how I did it there, it's fucking awesome
        const webShots = Object.values(ALL_WEB_SHOTS);
        const webShotKeys = Object.keys(ALL_WEB_SHOTS);

        for (let i = 0; i < webShots.length; i++) {
            const [pos, shouldEnd] = webShots[i];
            if (shouldEnd) continue;
            const distance = calculateDistance(currentPos, pos);
            if (distance < 3 && pos != currentPos && webShots[i][2] != player.id) {
                ALL_WEB_SHOTS[webShotKeys[i]][1] = true;
                ALL_WEB_SHOTS[sched_ID][1] = true;
            }
        }

        if (lengthOfWebShots < 4 && ALL_WEB_SHOTS[sched_ID][1]) {
            endRuntime = true;
        }

        const items = [...player.dimension.getEntities({ location: currentPos, maxDistance: 3, type: "item" })];
        items.forEach(item => { item.applyImpulse(travelDir) });

        const nearbyEntities = [...player.dimension.getEntities({ location: currentPos, maxDistance: 4, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] })];
        if (nearbyEntities[0] != undefined) endRuntime = true;

        const speed = Math.sqrt(travelDir.x**2 + travelDir.y**2 + travelDir.z**2);

        // Check if we hit a solid block
        const scanDistance = PLAYER_DATA.webModifier === "sniper" ? speed * 6 : speed * 4;
        const rayCast = player.dimension.getBlockFromRay(currentPos, travelDir, { includePassableBlocks: true, includeLiquidBlocks: true, maxDistance: scanDistance });
        if (rayCast) endRuntime = true;

        // Spawn the particle
        try {
            oldTraceLine(player, lastPos, currentPos, 16, "a:web_shot");
            if (PLAYER_DATA.webModifier) player.dimension.spawnParticle(`a:${PLAYER_DATA.webModifier}_web`, currentPos, map);
        } catch (error) {
            return system.clearRun(sched_ID);
        }

        // The end of the runtime
        if (endRuntime) {
            system.clearRun(sched_ID);
            delete ALL_WEB_SHOTS[sched_ID];
            player.dimension.spawnParticle("minecraft:large_explosion", currentPos, map);

            if (isMini) {
                createShockwave(player, currentPos, 4*chargeMultiplier, 5, 2, PLAYER_DATA.webModifier);
                spawnWebs(player, currentPos, 8*chargeMultiplier, 3);
                playSound(player, "random.explode", 1, player.location, 100);
                return system.clearRun(sched_ID);
            }

            const damage = PLAYER_DATA.webShooterUpgrade === "strength" ? 10 : 4;
            createShockwave(player, currentPos, damage, 5, 2, PLAYER_DATA.webModifier);
            spawnWebs(player, currentPos, 8, 3);
            playSound(player, "random.explode", 1, player.location, 100);


            // Check if nearby blocks are of a certain type
            const nearbyBlocks = getAllBlocksAround(player, currentPos, config.webshotAffectRadius);

            // See if any blocks are target blocks
            const targetBlocks = nearbyBlocks.filter(block => block.typeId === "minecraft:target");
            const conductiveBlocksNear = nearbyBlocks.filter(block => conductiveBlocks.includes(block.typeId));

            if (targetBlocks.length > 0) {
                for (const block of targetBlocks) {
                    block.setType("minecraft:redstone_block");
                    delayedFunc(player, () => block.setType("minecraft:target"), 3);
                }
            } else if (PLAYER_DATA.webModifier === "electric" && conductiveBlocksNear.length > 0) {
                // First things first, get all entities in a 100 block area around the player
                const entities = [...player.dimension.getEntities({ location: player.location, maxDistance: 100, excludeNames: [player.name] })];

                // Pick a random block from the conductive blocks
                const randomBlock = conductiveBlocksNear[Math.floor(Math.random() * conductiveBlocksNear.length)];

                // Now, we don't have to actually spawn shockwaves around every single metal block, we can just spawn them around the entities
                const blocks = dfs(randomBlock)

                for (const block of blocks) {
                    player.dimension.spawnParticle("a:lightning_lots", { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 }, map);

                    const blockPos = block.location;
                    for (const entity of entities) {
                        const distance = calculateDistance(blockPos, entity.location);
                        if (distance < 6) {
                            const reducedDmg = isShockImmune(entity);
                            if (reducedDmg == 0) continue;

                            oldTraceLine(player, blockPos, entity.location, 16, "a:lightning");
                            entity.addEffect("slowness", 100, { amplifier: 7, showParticles: true });
                            spawnEffect(entity, 0, "a:lightning", 3);
                            entity.applyDamage(8*reducedDmg, { cause: "entityAttack", damagingEntity: player });
                        }
                    }
                    
                }
            }

            let attackType = "web_shot";
            const distance = calculateDistance(player.location, currentPos);
            if (distance < 4) {
                player.applyKnockback(0, 0, 0, 1.8);
                attackType = "web_shot_launch";

                if (PLAYER_DATA.webModifier === "sniper") {
                    player.applyKnockback(0, 0, 0, 2.6);
                }
            }

            if (PLAYER_DATA.lastAttackType === "web_shot_launch" && attackType != "web_shot_launch") {
                spawnWebs(player, currentPos, 28, 6);
                createShockwave(player, currentPos, 8, 6, 3, PLAYER_DATA.webModifier);
            }

            PLAYER_DATA.lastAttackType = attackType;

            // This is important for some combos later on
            PLAYER_DATA.lastAttackedLocation = currentPos;
        }
    }, 1);
}

const webShotActivation = (player, PLAYER_DATA) => {

    if (PLAYER_DATA.webShooterType == "organic") PLAYER_DATA.webFluidAmount -= 20;
    if (PLAYER_DATA.webShooterType == "mechanical") PLAYER_DATA.webFluidAmount -= PLAYER_DATA.maxWebFluid / (4 + PLAYER_DATA.upgradeLevel);

    const travelDir = player.getViewDirection();
    const directedMap = new MolangVariableMap();
    directedMap.setVector3("variable.plane", travelDir);
    player.dimension.spawnParticle("a:block_indicator", calcVectorOffset(player, 0, 0, 1, travelDir, player.getHeadLocation()), directedMap);
    player.runCommandAsync("camerashake add @a[r=5] 0.2 0.1 positional");

    playSound(player, "spiderman.woosh", 1 + Math.random(), player.location, 5);

    PLAYER_DATA.cooldown = 10;

    shootWeb(player, PLAYER_DATA, travelDir, false);
}

const releaseCharge = (player, PLAYER_DATA) => {
    if (PLAYER_DATA.charge < 50) return;

    const CHARGE_FACTOR = PLAYER_DATA.charge / 100;
    const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    
    for (const angle of angles) {
        const radian = angle * Math.PI / 180;
        const x = Math.cos(radian) * CHARGE_FACTOR;
        const z = Math.sin(radian) * CHARGE_FACTOR;

        const direction = { x, y: 0, z };

        shootWeb(player, PLAYER_DATA, direction, true, CHARGE_FACTOR);
    }

    spawnEffect(player, 0, "a:air_flutter", 12);
    player.dimension.spawnParticle("minecraft:egg_destroy_emitter", player.location, map);
}

const webShotChargedActivation = (player, PLAYER_DATA) => {
    PLAYER_DATA.cooldown = 10;

    PLAYER_DATA.selectedChargeSlot = player.selectedSlotIndex;

    if (PLAYER_DATA.webFluidAmount > 1) {
        PLAYER_DATA.charge++;
        PLAYER_DATA.webFluidAmount--;
    }

    if (PLAYER_DATA.charge > 10) {
        const amount = Math.floor(Math.max(PLAYER_DATA.charge/15, 1));
        spawnEffect(player, 0, "a:web_shot", amount);
    
        player.runCommand(`camerashake add @a[r=8] ${PLAYER_DATA.charge/100} 0.05 positional`);
    }

    if (PLAYER_DATA.onReleaseCharge === undefined) PLAYER_DATA.onReleaseCharge = releaseCharge;
}

export const webShot = {
    name: { translate: "spiderman.move.web_shot" },
    webFluidCost: 20,
    activation(player, PLAYER_DATA) {
        if (!PLAYER_DATA.isEnabled) return;
        webShotActivation(player, PLAYER_DATA);
    },
    activationCharged(player, PLAYER_DATA) {
        if (!PLAYER_DATA.isEnabled) return;
        webShotChargedActivation(player, PLAYER_DATA);
    }
}