import { MolangVariableMap } from "@minecraft/server";
import { playSound } from "../utils";

const map = new MolangVariableMap();

export const wallClimbActivation = (player, PLAYER_DATA) => {
    if (!PLAYER_DATA.isEnabled) return false;
    if ((PLAYER_DATA.cooldown > 0 && PLAYER_DATA.webShooterType === "organic") || (PLAYER_DATA.cooldown > 6 && PLAYER_DATA.webShooterType === "mechanical")) return false;
    var wallClimbSuccess = false;

    const cardinalDirections = [
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 },
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 }
    ];

    const headLoc = player.getHeadLocation();

    for (const direction of cardinalDirections) {
        const block = player.dimension.getBlockFromRay(headLoc, direction, { maxDistance: 1, includeLiquidBlocks: true, includePassableBlocks: true });

        if (block) {
            if (PLAYER_DATA.wallClimbCount > 1 && JSON.stringify(direction) == JSON.stringify(PLAYER_DATA.lastWallDirection)) return false;

            PLAYER_DATA.cooldown = 10;

            // Get the horizontal angle between the player's view direction and the direction to the block
            const viewDir = player.getViewDirection();
            const angle = Math.atan2(direction.z * viewDir.x - direction.x * viewDir.z, direction.x * viewDir.x + direction.z * viewDir.z);
  
            // The parallel direction is the direction parallel to the wall in whatever direction the player is facing
            const parallelDirection = angle !== 0 ? { x: Math.sign(angle) * direction.z, y: 0, z: -Math.sign(angle) * direction.x } : null;
            const awayFromBlockDirection = { x: -direction.x, y: 0, z: -direction.z };

            // Model this on desmos
            // It maps the angle to a quadratic so that the force is stronger the farther from 0 the angle is
            const force = 1.4 * (1/3 * Math.pow(angle, 2))

            // Apply the knockback based on three different possible scenarios
            if (force < 0.03) {
                // Directly upwards for small angles, climb jumps straight up
                player.applyKnockback(0, 0, Math.min(force*1.4, 1.9), 0.85);  
            } else if (force < 0.3) {
                // Just parallel direction slightly larger angles, for along the wall jumps / side climbs
                const knockback = { x: parallelDirection.x, y: 0, z: parallelDirection.z };
                player.applyKnockback(knockback.x, knockback.z, 1, 0.9);
            } else {
                // For jumps that are more away from the wall, combine the two vectors to get the final knockback direction
                // This is where the angle matters for how far and how fast you get pushed off the wall
                // The more perpendicular the angle, the more force you get
                const knockback = { x: parallelDirection.x + awayFromBlockDirection.x, y: 0, z: parallelDirection.z + awayFromBlockDirection.z };
                player.applyKnockback(knockback.x, knockback.z, Math.min(force*1.4, 1.9), 0.9);                
            }

            // Keep track of the direction of the last wall climbed and how many times in a row
            if (JSON.stringify(direction) == JSON.stringify(PLAYER_DATA.lastWallDirection)) {
                // If the player climbs the same wall, increment the count
                PLAYER_DATA.wallClimbCount++;
            } else {
                // If the player climbs a different wall, reset the count
                PLAYER_DATA.wallClimbCount = 0;
            }

            playSound(player, "spiderman.woosh", 2.5, player.location, 5);
            player.dimension.spawnParticle("minecraft:egg_destroy_emitter", player.location, map);
            
            // Important to do this last, so that we don't false increment the count
            PLAYER_DATA.lastWallDirection = direction;
            wallClimbSuccess = true;

            break;
        }
    }

    return wallClimbSuccess;
}