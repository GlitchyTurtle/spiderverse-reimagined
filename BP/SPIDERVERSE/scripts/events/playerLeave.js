import { PLAYER_DATA_MAP } from "../index.js";

export const playerLeave = (v) => {
    console.warn(`Player ${v.player.name} left the server.`);
    if (PLAYER_DATA_MAP[v.player.id]) delete PLAYER_DATA_MAP[v.player.id];

    console.warn(JSON.stringify(PLAYER_DATA_MAP));
}