import { system, MolangVariableMap } from "@minecraft/server";
import { calculateDistance, calcVectorOffset, traceLine, spawnWebs, createShockwave, playSound, equipSuitParticle } from "../utils.js";

const releaseCharge = (player, PLAYER_DATA) => {
    if (PLAYER_DATA.webFluidAmount > 1) return;

    playSound(player, "spiderman.fabric", 1, player.location, 5);
    playSound(player, "spiderman.zipper", 1, player.location, 0.3);

    equipSuitParticle(player);
}

const webFluidChargedActivation = (player, PLAYER_DATA) => {
    PLAYER_DATA.cooldown = 10;
    PLAYER_DATA.selectedChargeSlot = player.selectedSlotIndex;

    if (PLAYER_DATA.webFluidAmount > 0) {
        PLAYER_DATA.charge += 10;
        PLAYER_DATA.webFluidAmount = Math.max(0, PLAYER_DATA.webFluidAmount - 10);
    }

    if (PLAYER_DATA.onReleaseCharge === undefined) PLAYER_DATA.onReleaseCharge = releaseCharge;
}


export const equipSuit = {
    name: { translate: "spiderman.move.disable_suit" },
    webFluidCost: 0,
    activation(player, PLAYER_DATA) {
        return false;
    },
    activationCharged(player, PLAYER_DATA) {
        webFluidChargedActivation(player, PLAYER_DATA);
    }
}