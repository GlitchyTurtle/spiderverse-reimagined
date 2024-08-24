import { MolangVariableMap } from "@minecraft/server";
import { wallClimbActivation } from "../moves/wallClimb.js";

import { startTutorial } from "../tutorial/tutorial.js";

import { playSound, spawnEffect, removeSuit, calculateDistance } from "../utils.js";

const map = new MolangVariableMap();

const onScreenDisplayRuntime = (player, PLAYER_DATA) => {
    if (PLAYER_DATA.isEnabled || player.selectedSlotIndex === 8) {
        // Display the web fluid amount and the current slot
        const headLoc = player.getHeadLocation();
        const isUnderwater = player.dimension.getBlock(headLoc).isLiquid;

        // Funny check because the bubbles disappear with a tiny bit of delay
        if (isUnderwater) PLAYER_DATA.timeInWater += 1;
        if (!isUnderwater && PLAYER_DATA.timeInWater > 0) PLAYER_DATA.timeInWater += -3.75;
        
        var statusFlag = PLAYER_DATA.timeInWater > 0 ? "moveup" : "";
        if (PLAYER_DATA.charge > 10) statusFlag += "center";

        if (PLAYER_DATA.webShooterType === "organic") {
            // Convert to an even number from 0 to 70
            const fillAmount = Math.floor(((PLAYER_DATA.webFluidAmount/PLAYER_DATA.maxWebFluid) * 70) / 2) * 2;

            player.onScreenDisplay.setTitle(`a:web_bar${fillAmount}${statusFlag}`);
        } else if (PLAYER_DATA.webShooterType === "mechanical") {
            const fillAmount = Math.floor((PLAYER_DATA.webFluidAmount/PLAYER_DATA.maxWebFluid) * (4 + PLAYER_DATA.upgradeLevel));
            player.onScreenDisplay.setTitle(`a:mech_bar${"_plus".repeat(PLAYER_DATA.upgradeLevel)}${fillAmount}${statusFlag}`);

            // Fancy reload sound for the mechanical web shooter
            if (Math.floor((PLAYER_DATA.prevWebFluid/PLAYER_DATA.maxWebFluid) * (4 + PLAYER_DATA.upgradeLevel)) < fillAmount) playSound(player, "spiderman.reload", 1, player.location, 5);
        }

        const moveName = PLAYER_DATA.moveset[player.selectedSlotIndex] ? PLAYER_DATA.moveset[player.selectedSlotIndex].name : { translate: "spiderman.move.none" };
        player.onScreenDisplay.setActionBar(moveName);

        if (player.selectedSlotIndex === 8 && !PLAYER_DATA.isEnabled) {
            player.onScreenDisplay.setActionBar({ translate: "spiderman.move.enable_suit" });
        } else {
            player.onScreenDisplay.setActionBar(moveName);
        }
    } else {
        player.onScreenDisplay.setTitle("a:reset");
        player.onScreenDisplay.setActionBar("a:reset");
    }
}

const antiFallDamageRuntime = (player, velocity) => {
    const offsets = [
        { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }, 
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, 
        { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: 1 }, { x: -1, y: 0, z: -1 }
    ];

    for (const offset of offsets) {
        const { x, y, z } = player.location;
        const location = { x: x + offset.x, y: y + offset.y, z: z + offset.z };
        const blockBelow = player.dimension.getBlockBelow(location, { maxDistance: 6, includePassableBlocks: true, includeLiquidBlocks: false });
        if (velocity.y < -0.55 && blockBelow && !blockBelow.isAir) {
            player.addEffect("slow_falling", 5, { amplifier: 1, showParticles: false });
        }
    }
}

const webModifierRuntime = (player, PLAYER_DATA, index, webLoc) => {
    if (Math.random() > 0.3 || index > 10) return;

        if (PLAYER_DATA.webModifier === "fire") {
            player.dimension.spawnParticle("a:fire_web", webLoc, map);
            player.runCommand(`fill ${webLoc.x - 3} ${webLoc.y - 3} ${webLoc.z - 3} ${webLoc.x + 3} ${webLoc.y + 3} ${webLoc.z + 3} air replace ice`);
            
            // Get the entities around the web block
            const entities = [...player.dimension.getEntities({ location: webLoc, maxDistance: 3, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] })];
            for (const entity of entities) {
                entity.setOnFire(15, true);
            }
        }

        if (PLAYER_DATA.webModifier === "poison") {
            player.dimension.spawnParticle("a:poison_web", webLoc, map);
            
            // Get the entities around the web block
            const entities = [...player.dimension.getEntities({ location: webLoc, maxDistance: 3, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] })];
            for (const entity of entities) {
                entity.addEffect("poison", 100, { amplifier: 1, showParticles: true });
            }
        }

        if (PLAYER_DATA.webModifier === "electric") {
            player.dimension.spawnParticle("a:lightning", webLoc, map);
            
            // Get the entities around the web block
            const entities = [...player.dimension.getEntities({ location: webLoc, maxDistance: 3, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] })];
            for (const entity of entities) {
                const reducedDmg = isShockImmune(entity);
                if (reducedDmg == 0) continue;

                entity.addEffect("slowness", 100, { amplifier: 0, showParticles: true });
                entity.addEffect("weakness", 100, { amplifier: 2, showParticles: true });
                spawnEffect(entity, 0, "a:lightning", 3);
                entity.applyDamage(1, { cause: "entityAttack", damagingEntity: player });
            }
        }

        if (PLAYER_DATA.webModifier === "ice") {
            player.dimension.spawnParticle("a:ice_web", webLoc, map);
            player.runCommand(`fill ${webLoc.x - 3} ${webLoc.y - 3} ${webLoc.z - 3} ${webLoc.x + 3} ${webLoc.y + 3} ${webLoc.z + 3} air replace fire`);
            
            if (calculateDistance(player.location, webLoc) < 3) player.extinguishFire();

            // Get the entities around the web block
            const entities = [...player.dimension.getEntities({ location: webLoc, maxDistance: 3, excludeNames: [player.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off"] })];
            for (const entity of entities) {
                entity.addEffect("slowness", 100, { amplifier: 1, showParticles: true });
                entity.addEffect("mining_fatigue", 300, { amplifier: 2, showParticles: true });
                entity.addEffect("weakness", 300, { amplifier: 2, showParticles: true });
                entity.extinguishFire();
                spawnEffect(entity, 0, "a:ice_web_entity", 3);
            }
        }
}

const passiveSkillsRuntime = (player, PLAYER_DATA) => {
    // Acrobatics skill
	if (!player.getEffect("jump_boost") || !player.getEffect("speed")) {
		player.addEffect("jump_boost", 120000, { amplifier: 1, showParticles: false });
		player.addEffect("speed", 120000, { amplifier: 1, showParticles: false });
	}

    if (PLAYER_DATA.blockTime > 100 && PLAYER_DATA.webFluidAmount > 1) {
        player.addEffect("invisibility", 10, { amplifier: 0, showParticles: false });

        PLAYER_DATA.webFluidAmount -= 0.5;        
        PLAYER_DATA.cooldown = 25;
    }

    player.addEffect("resistance", 300, { amplifier: 2, showParticles: false });
}

export const playerRuntime = (player, PLAYER_DATA) => {
    if (PLAYER_DATA.health.currentValue == 0) return;

    // Tutorial
    const hasCompletedTutorial = player.getDynamicProperty("TutorialCompleted");
    if (!hasCompletedTutorial) {
        player.setDynamicProperty("TutorialCompleted", true);
        startTutorial(player);
    }

    // Web fluid regeneration and cooldown
    PLAYER_DATA.prevWebFluid = PLAYER_DATA.webFluidAmount;
    if (PLAYER_DATA.webFluidAmount < PLAYER_DATA.maxWebFluid && PLAYER_DATA.cooldown == 0) PLAYER_DATA.webFluidAmount += 1;
    if (PLAYER_DATA.webShooterUpgrade === "refill") PLAYER_DATA.webFluidAmount += 0.75;
    if (PLAYER_DATA.webShooterType === "organic" && PLAYER_DATA.cooldown > 0) PLAYER_DATA.cooldown--;
    if (PLAYER_DATA.webShooterType === "mechanical" && PLAYER_DATA.cooldown > 0) PLAYER_DATA.cooldown -= 0.5;
    if (PLAYER_DATA.webFluidAmount > PLAYER_DATA.maxWebFluid) PLAYER_DATA.webFluidAmount = PLAYER_DATA.maxWebFluid;
    
    // Chat cooldown
    if (PLAYER_DATA.chatCooldown > 0) PLAYER_DATA.chatCooldown--;

    // Handle all the GUI elements
    try {
        onScreenDisplayRuntime(player, PLAYER_DATA);
    } catch (error) {
        // No need to send error, most likely the player is just really high up or below -64
        console.log(error);
    }
    
    // Double jump check to activate the selected slot
    if (player.isJumping) PLAYER_DATA.isJumping = true;
    if (!player.isJumping && PLAYER_DATA.isJumping) PLAYER_DATA.doubleJump = true;

    if (PLAYER_DATA.isJumping && player.isOnGround) {
        PLAYER_DATA.isJumping = false;
        PLAYER_DATA.doubleJump = false;
        PLAYER_DATA.wallClimbCount = 0;
        PLAYER_DATA.lastWallDirection = undefined;
    }

    // Since we can't access blocks in out of bounds areas, we can't run the addon there
    const isInBounds = player.location.y < 250 && player.location.y > -64;

    if (!isInBounds && PLAYER_DATA.wasInBounds) player.sendMessage([{ text: "§c"}, { translate: "spiderman.bounds.exit" }]);
    if (isInBounds && !PLAYER_DATA.wasInBounds && PLAYER_DATA.wasInBounds != undefined) player.sendMessage([{ text: "§a"}, { translate: "spiderman.bounds.enter" }]);
    PLAYER_DATA.wasInBounds = isInBounds;

    if (!PLAYER_DATA.particleMap) {
        const colorMap = new MolangVariableMap();
        colorMap.setVector3("variable.plane", { x: 1, y: 1, z: 1 });
        PLAYER_DATA.particleMap = colorMap;
    }

    // Wall climb activation and slot activation
    if (player.isJumping && !player.isOnGround && PLAYER_DATA.doubleJump && isInBounds) {
        if (PLAYER_DATA.trickTimer > 0 && PLAYER_DATA.trickTimer < 5) {
            PLAYER_DATA.trickTimer = 0;
            console.warn("Trick!");
        }

        const tryWallClimb = wallClimbActivation(player, PLAYER_DATA);
        if (!tryWallClimb) PLAYER_DATA.activateSlot(player.selectedSlotIndex);
    }

    // Trick timer
    if (PLAYER_DATA.trickTimer > 0) PLAYER_DATA.trickTimer--;

    // Charged move release 
    if (player.selectedSlotIndex === PLAYER_DATA.selectedChargeSlot && PLAYER_DATA.charge > 0 && !player.isSneaking && isInBounds) {
        PLAYER_DATA.onReleaseCharge(player, PLAYER_DATA);

        PLAYER_DATA.selectedChargeSlot = undefined;
        PLAYER_DATA.onReleaseCharge = undefined;
        PLAYER_DATA.charge = 0;
    } else if (player.selectedSlotIndex != PLAYER_DATA.selectedChargeSlot && PLAYER_DATA.charge > 0) {
        PLAYER_DATA.selectedChargeSlot = undefined;
        PLAYER_DATA.onReleaseCharge = undefined;
        PLAYER_DATA.charge = 0;
    }

    // Charged move build up thing
    if (player.isSneaking && isInBounds) {
        PLAYER_DATA.activateSlotCharged(player.selectedSlotIndex);
    }

    // Prevent fall damage without using player.json file
    try {
        const velocity = player.getVelocity();
        antiFallDamageRuntime(player, velocity);
    } catch (error) {
        // No need to error, most likely the player is just really high up or below -64
        console.log(error);
    }

    // Web runtime and check for dissolving/unmanned webs
    if (PLAYER_DATA.webs.length > 0) {
        for (const web of PLAYER_DATA.webs) {
            if (web.dissolved) {
                PLAYER_DATA.webs.splice(PLAYER_DATA.webs.indexOf(web), 1);
                continue;
            }
    
            web.display();
            web.tick(PLAYER_DATA);
        }
    } else {
        const webEntity = player.dimension.getEntities({ tags: [`${player.id}`] });
        for (const entity of webEntity) entity.triggerEvent("minecraft:despawn");
    }

    // If the player has disabled the suit, we return unless they are trying to select the last slot to enable it
    if (!PLAYER_DATA.isEnabled && player.selectedSlotIndex === 8) return;

    // Disable the suit if the player equips any armor
    if (PLAYER_DATA.isEnabled) {
        const armorSlots = ["Head", "Chest", "Legs", "Feet"];
        const equippable = PLAYER_DATA.equippable;
    
        for (const slotName of armorSlots) {
            const item = equippable.getEquipment(slotName);
    
            if (item) {
                PLAYER_DATA.timesTriedToEquipArmor++;
                player.sendMessage([{ text: "§c"}, { translate: 'spiderman.warning.no_armor'}]);
                console.warn(PLAYER_DATA.timesTriedToEquipArmor)

                equippable.setEquipment(slotName, undefined);

                const container = player.getComponent("minecraft:inventory").container;
                if (container.emptySlotsCount > 0) {
                    container.addItem(item);
                } else {
                    player.dimension.spawnItem(item, player.location);
                }
                
                if (PLAYER_DATA.timesTriedToEquipArmor > 3) {
                    player.sendMessage([{ text: "§c"}, { translate: 'spiderman.warning.no_armor_repeated'}]);
                    playSound(player, "spiderman.fabric", 1, player.location, 5);
                    playSound(player, "spiderman.zipper", 1, player.location, 0.3);
                    
                    PLAYER_DATA.isEnabled = false;
                    return removeSuit(player, PLAYER_DATA);
                }
            }
        }
    }

    if (!PLAYER_DATA.isEnabled) return;

    // Parts of combo moves and other assorted checks
    if (PLAYER_DATA.lastAttackType === "jump_dash" && player.isOnGround) PLAYER_DATA.lastAttackType = undefined;
    if (PLAYER_DATA.lastAttackedLocation) PLAYER_DATA.timeSinceLastAttack++;
    if (PLAYER_DATA.timeSinceLastAttack > 80) {
        PLAYER_DATA.timeSinceLastAttack = 0;
        PLAYER_DATA.lastAttackedLocation = undefined;
        PLAYER_DATA.lastAttackType = undefined;
    }

    // Passive skills
    passiveSkillsRuntime(player, PLAYER_DATA);

    // Air stall
    if (PLAYER_DATA.airStall) {
        if (PLAYER_DATA.timeInStall > 35) PLAYER_DATA.airStall = false;
        PLAYER_DATA.timeInStall++;
    
        player.applyKnockback(0, 0, 0, 0.07);

        if (PLAYER_DATA.stalledEntity.isValid()) {
            PLAYER_DATA.stalledEntity.applyKnockback(0, 0, 0, 0.07);
        } else {
            PLAYER_DATA.airStall = false;
        }
    }

    // Blocking
    if (player.isSneaking) {
        PLAYER_DATA.blockTime++;
    } else {
        PLAYER_DATA.blockTime = 0;
    }

    if (PLAYER_DATA.blockCooldown > 0 && !player.isSneaking) PLAYER_DATA.blockCooldown--;
    if (PLAYER_DATA.blockTime > 0 && PLAYER_DATA.blockCooldown == 0) {
        if (PLAYER_DATA.blockTime > 10) PLAYER_DATA.blockCooldown = 10;
        PLAYER_DATA.isBlocking = true;
    } else {
        if (PLAYER_DATA.isBlocking) PLAYER_DATA.blockCooldown = 10;
        PLAYER_DATA.isBlocking = false;
    }

    // Web Modifier
    for (const [index, webLoc] of PLAYER_DATA.webBlocks.entries()) {
        webModifierRuntime(player, PLAYER_DATA, index, webLoc);
    }
}