import { shootWeb, calcVectorOffset, delayedFunc, calculateDistance } from "../utils.js";
import { Web } from "../web/web.js";

const swingActivation = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA.isEnabled) return false;
    const target = player.getBlockFromViewDirection({ includePassableBlocks: true, includeLiquidBlocks: false, maxDistance: 200 });
    if (!target) {
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

    if (PLAYER_DATA.webShooterType == "organic") PLAYER_DATA.webFluidAmount -= 20;
    if (PLAYER_DATA.webShooterType == "mechanical") PLAYER_DATA.webFluidAmount -= PLAYER_DATA.maxWebFluid / (4 + PLAYER_DATA.upgradeLevel);

    // Move the target back towards the player a tiny bit
    const { x, y, z } = target.block.location;
    const vector = { x: x - player.location.x, y: y - player.location.y, z: z - player.location.z };
    const newTarget = calcVectorOffset(player, 0, 0, -0.5, vector, target.block.location)

    const distance = calculateDistance(player.location, newTarget);

    // The more distance, the more points and the easier it is to control since you'll be swinging faster 
    // ...and potentially hitting walls before you can react if you had a lower controllability
    const webPoints = Math.min(15, Math.max(10, distance/5));
    const controllability = (distance > 35) ? 0.6 : 0.1;

    PLAYER_DATA.cooldown = 10;

    shootWeb(player, player, newTarget, 4);
    delayedFunc(player, () => {
        const web = new Web(player, newTarget, player.location, webPoints, controllability);
        PLAYER_DATA.webs.push(web);
    }, 4);
}

export const swing = {
    name: { translate: "spiderman.move.swing" },
    webFluidCost: 20,
    activation(player, PLAYER_DATA) {
        if (!PLAYER_DATA.isEnabled) return;
        swingActivation(player, PLAYER_DATA);
    },
    activationCharged(player, PLAYER_DATA) {
        return false;
    }
}