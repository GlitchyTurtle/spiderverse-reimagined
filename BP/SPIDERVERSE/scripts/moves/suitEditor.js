import { system, MolangVariableMap } from "@minecraft/server";
import { calculateDistance, calcVectorOffset, traceLine, spawnWebs, createShockwave, playSound, equipSuitParticle } from "../utils.js";

import { suitEditorMenu } from "../editor/suitEditor.js";

const releaseCharge = (player, PLAYER_DATA) => {
    if (PLAYER_DATA.webFluidAmount > 1) return;

    playSound(player, "spiderman.open", 1, player.location, 1);
    suitEditorMenu(player, PLAYER_DATA);
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


export const webEditor = {
    name: { translate: "spiderman.move.customize_suit" },
    webFluidCost: 0,
    activation(player, PLAYER_DATA) {
        return false;
    },
    activationCharged(player, PLAYER_DATA) {
        webFluidChargedActivation(player, PLAYER_DATA);
    }
}