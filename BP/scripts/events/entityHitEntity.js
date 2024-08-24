import { Player, MolangVariableMap } from "@minecraft/server";
import { calcVectorOffset, playSound, createShockwave, spawnTrail, spawnEffect } from "../utils.js";

import { PLAYER_DATA_MAP } from "../index.js";

export const entityHitEntity = (eventData) => {
    const { hitEntity, damagingEntity } = eventData;

    // If it's not a player who did the hit then ignore
    if (!(damagingEntity instanceof Player)) return;

    const PLAYER_DATA = PLAYER_DATA_MAP[damagingEntity.id];
    if (!PLAYER_DATA) return;

    // Combo #1
    if (PLAYER_DATA.airStall) {
        PLAYER_DATA.airStall = false;

        const viewDir = damagingEntity.getViewDirection();
        const directedMap = new MolangVariableMap();
        directedMap.setVector3("variable.plane", viewDir);
        damagingEntity.dimension.spawnParticle("a:block_indicator", calcVectorOffset(damagingEntity, 0, 0, 1, viewDir, damagingEntity.getHeadLocation()), directedMap);

        createShockwave(damagingEntity, damagingEntity.location, 6, 5, 0);
    
        const horizontal = Math.sqrt(viewDir.x ** 2 + viewDir.z ** 2);

        hitEntity.applyKnockback(viewDir.x, viewDir.z, horizontal*8, viewDir.y*3);

        // Sound design
        playSound(damagingEntity, "random.explode", 1, damagingEntity.location, 2);
        playSound(damagingEntity, "spiderman.debris", 1, damagingEntity.location, 5);
        
        // Visual Impact (visual1mpact lol)
        damagingEntity.runCommandAsync("camerashake add @a[r=8] 1 0.2 positional");
        spawnTrail(hitEntity, 10);
    }

	const myInv = damagingEntity.getComponent("minecraft:inventory").container;
	const myMainhand = myInv.getItem(damagingEntity.selectedSlotIndex);

	// The Knockback Strike passive
	if (damagingEntity.isSneaking && PLAYER_DATA.cooldown == 0 && PLAYER_DATA.webFluidAmount >= 15 && !myMainhand) {
        PLAYER_DATA.webFluidAmount -= 15;
        PLAYER_DATA.cooldown = 5;

		const viewDir = damagingEntity.getViewDirection();
		hitEntity.applyKnockback(viewDir.x, viewDir.z, 2.5, 0.6);
		
		const directedMap = new MolangVariableMap();
		directedMap.setVector3("variable.plane", viewDir);
		damagingEntity.dimension.spawnParticle("a:block_indicator", calcVectorOffset(damagingEntity, 0, 0, 1, viewDir, damagingEntity.getHeadLocation()), directedMap);
		playSound(damagingEntity, "land.cloth", 0.2, damagingEntity.location, 1);
        damagingEntity.runCommandAsync("camerashake add @a[r=8] 0.3 0.1 positional");
	}
};