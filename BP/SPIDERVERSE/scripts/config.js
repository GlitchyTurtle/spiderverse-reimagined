export const config = {
    // -----------------------------------
    // GENERAL CONFIGURATION
    // -----------------------------------

    // The maximum speed of the player when swinging, in blocks per tick (1 block per tick is 20 blocks per second)
    maxSwingSpeed: 0.8,

    // If the players name tag should be hidden when the suit is enabled
    suitHidesNameTag: true,

    // -----------------------------------
    // SUIT CUSTOMIZATION
    // -----------------------------------

    // Allow players to use custom rbg colors for their suit, outside of the default range
    allowCustomSuitColors: true,

    // Allow players to use the standard web colors, like red, blue, black, etc.
    allowWebColors: true,

    // Allow players to use custom rbg web colors, outside of the default range, if allowWebColors is true
    allowCustomWebColors: true,

    // -----------------------------------
    // WEB SHOOTER CONFIGURATION
    // -----------------------------------

    // This is the distance in blocks that the webshot (upon impact) will affect other blocks (stuff like electricity conduction, activating targets, etc.)
    webshotAffectRadius: 2,

    // The maximum number of blocks that can be affected by the shock webs conductive ability
    conductiveMaxBlocks: 90,

    // The type of blocks that can be affected by the shock webs conductive ability
    conductiveBlocks: [
        "minecraft:iron_block",
        "minecraft:iron_bars",
        "minecraft:chain",
        "minecraft:iron_trapdoor",
        "minecraft:iron_door",
        "minecraft:iron_ore",
        "minecraft:water"
    ]
}