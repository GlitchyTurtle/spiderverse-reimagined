export const playerSpawn = (eventData) => {
    const { player, initialSpawn } = eventData;

    player.runCommand("inputpermission set @s movement enabled");

    if (!initialSpawn) return;

    console.warn(`Addon started for ${player.name}! (initialSpawn). If you see any errors, please report them on the discord server. Happy testing!`);
}

