import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { MolangVariableMap } from "@minecraft/server";
import { loadSuit, saveBuild } from "../utils.js";
import { config } from '../config.js';

const rows = [
    '§o§n§e',
    '§t§w§o',
    '§t§h§r§e§e',
    '§f§o§u§r',
    '§f§i§v§e'
]

const sidebarOptions = [
    {
        title: { translate: "spiderman.shooter.title" },
        type: "shooter",
        description: { translate: "spiderman.shooter.desc" },
        texture: 'textures/suit/shooter/organic',
        options: [
            {
                title: { translate: "spiderman.shooter.organic" },
                type: "organic",
                description: { translate: "spiderman.shooter.organic.desc" },
                texture: "textures/suit/shooter/organic"
            },
            {
                title: { translate: "spiderman.shooter.mechanical" },
                type: "mechanical",
                description: { translate: "spiderman.shooter.mechanical.desc" },
                texture: "textures/suit/shooter/mechanical"
            }
        ]
    },
    { 
        title: { translate: "spiderman.modifier.title" },
        type: "modifier",
        description: { translate: "spiderman.modifier.desc" },
        texture: 'textures/suit/modifiers/display',
        options: [
            {
                title: { translate: "spiderman.modifier.electric" },
                type: "electric",
                description: { translate: "spiderman.modifier.electric.desc" },
                texture: "textures/suit/modifiers/electric"
            },
            {
                title: { translate: "spiderman.modifier.poison" },
                type: "poison",
                description: { translate: "spiderman.modifier.poison.desc" },
                texture: "textures/suit/modifiers/poison"
            },
            {
                title: { translate: "spiderman.modifier.fire" },
                type: "fire",
                description: { translate: "spiderman.modifier.fire.desc" },
                texture: "textures/suit/modifiers/fire"
            },
            {
                title: { translate: "spiderman.modifier.ice" },
                type: "ice",
                description: { translate: "spiderman.modifier.ice.desc" },
                texture: "textures/suit/modifiers/ice"
            },
            {
                title: { translate: "spiderman.modifier.sniper" },
                type: "sniper",
                description: { translate: "spiderman.modifier.sniper.desc" },
                texture: "textures/suit/modifiers/sniper"
            }
        ]
    },
    {
        title: { translate: "spiderman.base_color.title" },
        type: "base",
        description: { translate: "spiderman.base_color.desc" },
        texture: 'textures/suit/colors/white',
        options: [
            {
                title: { translate: "spiderman.color.black" },
                description: { translate: "spiderman.color.black.desc" },
                texture: "textures/suit/colors/black",
                rgba: { red: 50, green: 50, blue: 50, alpha: 100 }
            },
            {
                title: { translate: "spiderman.color.brown" },
                description: { translate: "spiderman.color.brown.desc" },
                texture: "textures/suit/colors/brown",
                rgba: { red: 139, green: 69, blue: 19, alpha: 155 }
            },
            {
                title: { translate: "spiderman.color.red" },
                description: { translate: "spiderman.color.red.desc" },
                texture: "textures/suit/colors/red",
                rgba: { red: 255, green: 0, blue: 0, alpha: 115 }
            },
            {
                title: { translate: "spiderman.color.orange" },
                description: { translate: "spiderman.color.orange.desc" },
                texture: "textures/suit/colors/orange",
                rgba: { red: 255, green: 105, blue: 0, alpha: 155 }
            },
            {
                title: { translate: "spiderman.color.yellow" },
                description: { translate: "spiderman.color.yellow.desc" },
                texture: "textures/suit/colors/yellow",
                rgba: { red: 255, green: 205, blue: 0, alpha: 185 }
            },
            {
                title: { translate: "spiderman.color.lime" },
                description: { translate: "spiderman.color.lime.desc" },
                texture: "textures/suit/colors/lime",
                rgba: { red: 80, green: 255, blue: 50, alpha: 165 }
            },
            {
                title: { translate: "spiderman.color.green" },
                description: { translate: "spiderman.color.green.desc" },
                texture: "textures/suit/colors/green",
                rgba: { red: 90, green: 255, blue: 40, alpha: 95 }
            },
            {
                title: { translate: "spiderman.color.cyan" },
                description: { translate: "spiderman.color.cyan.desc" },
                texture: "textures/suit/colors/cyan",
                rgba: { red: 0, green: 255, blue: 255, alpha: 135 }
            },
            {
                title: { translate: "spiderman.color.light_blue" },
                description: { translate: "spiderman.color.light_blue.desc" },
                texture: "textures/suit/colors/light_blue",
                rgba: { red: 120, green: 190, blue: 255, alpha: 155 }
            },
            {
                title: { translate: "spiderman.color.blue" },
                description: { translate: "spiderman.color.blue.desc" },
                texture: "textures/suit/colors/blue",
                rgba: { red: 60, green: 60, blue: 255, alpha: 135 }
            },
            {
                title: { translate: "spiderman.color.purple" },
                description: { translate: "spiderman.color.purple.desc" },
                texture: "textures/suit/colors/purple",
                rgba: { red: 168, green: 40, blue: 168, alpha: 155 }
            },
            {
                title: { translate: "spiderman.color.magenta" },
                description: { translate: "spiderman.color.magenta.desc" },
                texture: "textures/suit/colors/magenta",
                rgba: { red: 255, green: 60, blue: 255, alpha: 135 }
            },
            {
                title: { translate: "spiderman.color.pink" },
                description: { translate: "spiderman.color.pink.desc" },
                texture: "textures/suit/colors/pink",
                rgba: { red: 255, green: 135, blue: 190, alpha: 165 }
            },
            {
                title: { translate: "spiderman.color.gray" },
                description: { translate: "spiderman.color.gray.desc" },
                texture: "textures/suit/colors/gray",
                rgba: { red: 110, green: 110, blue: 110, alpha: 120 }
            },
            {
                title: { translate: "spiderman.color.white" },
                description: { translate: "spiderman.color.white.desc" },
                texture: "textures/suit/colors/white",
                rgba: { red: 255, green: 255, blue: 255, alpha: 155 }
            }
        ]
    },
    {
        title: { translate: "spiderman.secondary_color.title" },
        type: "secondary",
        description: { translate: "spiderman.secondary_color.desc" },
        texture: 'textures/suit/colors/white',
        options: [
            {
                title: { translate: "spiderman.color.black" },
                description: { translate: "spiderman.color.black.desc" },
                texture: "textures/suit/colors/black",
                rgba: { red: 0, green: 0, blue: 0, alpha: 240 }
            },
            {
                title: { translate: "spiderman.color.brown" },
                description: { translate: "spiderman.color.brown.desc" },
                texture: "textures/suit/colors/brown",
                rgba: { red: 59, green: 29, blue: 13, alpha: 215 }
            },
            {
                title: { translate: "spiderman.color.red" },
                description: { translate: "spiderman.color.red.desc" },
                texture: "textures/suit/colors/red",
                rgba: { red: 130, green: 0, blue: 0, alpha: 205 }
            },
            {
                title: { translate: "spiderman.color.orange" },
                description: { translate: "spiderman.color.orange.desc" },
                texture: "textures/suit/colors/orange",
                rgba: { red: 185, green: 95, blue: 0, alpha: 245 }
            },
            {
                title: { translate: "spiderman.color.yellow" },
                description: { translate: "spiderman.color.yellow.desc" },
                texture: "textures/suit/colors/yellow",
                rgba: { red: 185, green: 135, blue: 0, alpha: 185 }
            },
            {
                title: { translate: "spiderman.color.lime" },
                description: { translate: "spiderman.color.lime.desc" },
                texture: "textures/suit/colors/lime",
                rgba: { red: 40, green: 155, blue: 20, alpha: 185 }
            },
            {
                title: { translate: "spiderman.color.green" },
                description: { translate: "spiderman.color.green.desc" },
                texture: "textures/suit/colors/green",
                rgba: { red: 35, green: 90, blue: 10, alpha: 235 }
            },
            {
                title: { translate: "spiderman.color.cyan" },
                description: { translate: "spiderman.color.cyan.desc" },
                texture: "textures/suit/colors/cyan",
                rgba: { red: 10, green: 105, blue: 105, alpha: 175 }
            },
            {
                title: { translate: "spiderman.color.light_blue" },
                description: { translate: "spiderman.color.light_blue.desc" },
                texture: "textures/suit/colors/light_blue",
                rgba: { red: 0, green: 225, blue: 225, alpha: 135 }
            },
            {
                title: { translate: "spiderman.color.blue" },
                description: { translate: "spiderman.color.blue.desc" },
                texture: "textures/suit/colors/blue",
                rgba: { red: 0, green: 0, blue: 30, alpha: 204 }
            },
            {
                title: { translate: "spiderman.color.purple" },
                description: { translate: "spiderman.color.purple.desc" },
                texture: "textures/suit/colors/purple",
                rgba: { red: 168, green: 40, blue: 168, alpha: 155 }
            },
            {
                title: { translate: "spiderman.color.magenta" },
                description: { translate: "spiderman.color.magenta.desc" },
                texture: "textures/suit/colors/magenta",
                rgba: { red: 255, green: 60, blue: 255, alpha: 135 }
            },
            {
                title: { translate: "spiderman.color.pink" },
                description: { translate: "spiderman.color.pink.desc" },
                texture: "textures/suit/colors/pink",
                rgba: { red: 255, green: 135, blue: 190, alpha: 165 }
            },
            {
                title: { translate: "spiderman.color.gray" },
                description: { translate: "spiderman.color.gray.desc" },
                texture: "textures/suit/colors/gray",
                rgba: { red: 70, green: 70, blue: 70, alpha: 190 }
            },
            {
                title: { translate: "spiderman.color.white" },
                description: { translate: "spiderman.color.white.desc" },
                texture: "textures/suit/colors/white",
                rgba: { red: 255, green: 255, blue: 255, alpha: 155 }
            }
        ]
    },
    {
        title: { translate: "spiderman.pattern_color.title" },
        type: "pattern",
        description: { translate: "spiderman.pattern_color.desc" },
        texture: 'textures/suit/colors/white',
        options: [
            {
                title: { translate: "spiderman.color.black" },
                description: { translate: "spiderman.color.black.desc" },
                texture: "textures/suit/colors/black",
                rgba: { red: 30, green: 30, blue: 30, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.brown" },
                description: { translate: "spiderman.color.brown.desc" },
                texture: "textures/suit/colors/brown",
                rgba: { red: 105, green: 49, blue: 34, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.red" },
                description: { translate: "spiderman.color.red.desc" },
                texture: "textures/suit/colors/red",
                rgba: { red: 110, green: 30, blue: 30, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.orange" },
                description: { translate: "spiderman.color.orange.desc" },
                texture: "textures/suit/colors/orange",
                rgba: { red: 185, green: 75, blue: 0, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.yellow" },
                description: { translate: "spiderman.color.yellow.desc" },
                texture: "textures/suit/colors/yellow",
                rgba: { red: 200, green: 150, blue: 0, alpha: 204 }
            },
            {
                title: { translate: "spiderman.color.lime" },
                description: { translate: "spiderman.color.lime.desc" },
                texture: "textures/suit/colors/lime",
                rgba: { red: 80/1.5, green: 255/1.5, blue: 50/1.5, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.green" },
                description: { translate: "spiderman.color.green.desc" },
                texture: "textures/suit/colors/green",
                rgba: { red: 90/2, green: 255/2, blue: 40/2, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.cyan" },
                description: { translate: "spiderman.color.cyan.desc" },
                texture: "textures/suit/colors/cyan",
                rgba: { red: 20, green: 155, blue: 155, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.light_blue" },
                description: { translate: "spiderman.color.light_blue.desc" },
                texture: "textures/suit/colors/light_blue",
                rgba: { red: 120, green: 190, blue: 255, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.blue" },
                description: { translate: "spiderman.color.blue.desc" },
                texture: "textures/suit/colors/blue",
                rgba: { red: 50, green: 52, blue: 152, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.purple" },
                description: { translate: "spiderman.color.purple.desc" },
                texture: "textures/suit/colors/purple",
                rgba: { red: 168/1.5, green: 40/1.5, blue: 198/1.5, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.magenta" },
                description: { translate: "spiderman.color.magenta.desc" },
                texture: "textures/suit/colors/magenta",
                rgba: { red: 255/1.5, green: 60/1.5, blue: 255/1.5, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.pink" },
                description: { translate: "spiderman.color.pink.desc" },
                texture: "textures/suit/colors/pink",
                rgba: { red: 255/1.5, green: 135/1.5, blue: 190/1.5, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.gray" },
                description: { translate: "spiderman.color.gray.desc" },
                texture: "textures/suit/colors/gray",
                rgba: { red: 110, green: 110, blue: 110, alpha: 255 }
            },
            {
                title: { translate: "spiderman.color.white" },
                description: { translate: "spiderman.color.white.desc" },
                texture: "textures/suit/colors/white",
                rgba: { red: 205, green: 205, blue: 205, alpha: 255 }
            }
        ]
    },
    {
        title: { translate: "spiderman.pattern_type.title" },
        type: "pattern_type",
        description: { translate: "spiderman.pattern_type.desc" },
        texture: 'textures/suit/colors/white',
        options: [
            {
                title: { translate: "spiderman.pattern.none" },
                description: { translate: "spiderman.pattern.none.desc" },
                texture: "textures/suit/pattern/0",
                pattern: 0
            },
            {
                title: { translate: "spiderman.pattern.iron_spider" },
                description: { translate: "spiderman.pattern.iron_spider.desc" },
                texture: "textures/suit/pattern/1",
                pattern: 1
            },
            {
                title: { translate: "spiderman.pattern.classic" },
                description: { translate: "spiderman.pattern.classic.desc" },
                texture: "textures/suit/pattern/2",
                pattern: 2
            },
            {
                title: { translate: "spiderman.pattern.tapered" },
                description: { translate: "spiderman.pattern.tapered.desc" },
                texture: "textures/suit/pattern/3",
                pattern: 3
            },
            {
                title: { translate: "spiderman.pattern.minimal" },
                description: { translate: "spiderman.pattern.minimal.desc" },
                texture: "textures/suit/pattern/4",
                pattern: 4
            }
        ]
    },
    {
        title: { translate: "spiderman.eye_type.title" },
        type: "eye_type",
        description: { translate: "spiderman.eye_type.desc" },
        texture: 'textures/suit/colors/white',
        options: [
            {
                title: { translate: "spiderman.eye.none" },
                description: { translate: "spiderman.eye.none.desc" },
                texture: "textures/suit/pattern/0",
                eye: 0
            },
            {
                title: { translate: "spiderman.eye.classic" },
                description: { translate: "spiderman.eye.classic.desc" },
                texture: "textures/suit/eye/1",
                eye: 1
            },
            {
                title: { translate: "spiderman.eye.teardrop" },
                description: { translate: "spiderman.eye.teardrop.desc" },
                texture: "textures/suit/eye/2",
                eye: 2
            },
            {
                title: { translate: "spiderman.eye.sharp" },
                description: { translate: "spiderman.eye.sharp.desc" },
                texture: "textures/suit/eye/3",
                eye: 3
            },
            // {
            //     title: { translate: "spiderman.eye.squint" },
            //     description: { translate: "spiderman.eye.squint.desc" },
            //     texture: "textures/suit/eye/4",
            //     eye: 4
            // },
            {
                title: { translate: "spiderman.eye.true_spider" },
                description: { translate: "spiderman.eye.true_spider.desc" },
                texture: "textures/suit/eye/5",
                eye: 5
            }
        ]
    }
]

export const suitEditorMenu = (player, PLAYER_DATA, context = { sidebar: 1 }) => {
    if (!PLAYER_DATA.isEnabled) return;
    if (PLAYER_DATA.lastOpenedMenu) context.sidebar = PLAYER_DATA.lastOpenedMenu;

    const form = new ActionFormData()
        .title({ rawtext: [
            { text: '§e' },
            { translate: "spiderman.suit.prefix" },
            sidebarOptions[context.sidebar].title,
            { text: '§c§u§s§t§o§m§i§z§e' },
        ]})
        .body(sidebarOptions[context.sidebar].description);
    
    const type = sidebarOptions[context.sidebar].type;

    // Sidebar Options (Web Shooter Type, Base Suit Color, etc.)
    for (let i = 0; i < sidebarOptions.length; i++) {
        const option = sidebarOptions[i];
        let flag = '§0';
        if (i === context.sidebar) flag += '§s§e§l§e§c§t§e§d';

        let texture = option.texture;
        switch (option.type) {
            case 'shooter':
                texture = `textures/suit/shooter/${PLAYER_DATA.webShooterType || 'organic'}`;
                break;
            case 'modifier':
                texture = `textures/suit/modifiers/${PLAYER_DATA.webModifier || 'display'}`;
                break;
            case 'base':
            case 'secondary':
            case 'pattern':
                // This is kinda complicated, but we want to find the nearest color to the one we have in the suit
                let closestColor = sidebarOptions[i].options[0].rgba;
                let closestDistance = 9999999;
                let closestOption = sidebarOptions[i].options[0];
                const suitPart = option.type;
                for (const color of sidebarOptions[i].options) {
                    const distance = Math.pow(color.rgba.red - PLAYER_DATA.suit[suitPart].color.red, 2) + Math.pow(color.rgba.green - PLAYER_DATA.suit[suitPart].color.green, 2) + Math.pow(color.rgba.blue - PLAYER_DATA.suit[suitPart].color.blue, 2);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestColor = color.rgba;
                        closestOption = color;
                    }
                }

                texture = closestOption.texture;
                break;
            case 'pattern_type':
                texture = `textures/suit/pattern/${PLAYER_DATA.suit.pattern.texture || 1}`;
                break;
            case 'eye_type':
                texture = `textures/suit/eye/${PLAYER_DATA.suit.eyes.texture || 1}`;
                break;
        }

        //form.button(`§6${option.title}\n§o§7${option.description}${flag}`, texture);
        form.button({ rawtext: [
            { text: '§6' },
            option.title,
            { text: '\n§o§7' },
            option.description,
            { text: `${flag}` }
        ]}, texture);
    }

    // Customize button
    let removeLength = 0;
    switch (type) {
        case 'shooter':
            removeLength++;
            form.button({ rawtext: [
                { text: '§2§f' },
                { translate: "spiderman.suit.upgrade" },
            ]});
    
            break;
        case 'modifier':
            removeLength++;
            form.button({ rawtext: [
                { text: '§2§f' },
                { translate: "spiderman.suit.reset" },
            ]});
        
            if (config.allowWebColors) {
                removeLength++;
                form.button({ rawtext: [
                    { text: '§2§f' },
                    { translate: "spiderman.suit.web_color" },
                ]});
            }
            break;
        case 'base':
        case 'secondary':
        case 'pattern':
            if (config.allowCustomSuitColors) {
                removeLength++;
                form.button({ rawtext: [
                    { text: '§2§f' },
                    { translate: "spiderman.suit.customize" },
                ]});
            }
            break;
        case 'pattern_type':
        case 'eye_type':
            break;
    }

    const sidebar = sidebarOptions[context.sidebar];
    for (let i = 0; i < sidebar.options.length; i++) {
        const option = sidebar.options[i];
        const row = rows[ i % rows.length ];

        // Is this the same as our suit base color?
        let flag = '';
        switch (type) {
            case 'shooter':
                // Hacky way to check if the web shooter type is the same as the option
                if (PLAYER_DATA.webShooterType === option.type) flag += '§s§e§l§e§c§t§e§d';
                break;
            case 'modifier':
                // Hacky way to check if the web modifier is the same as the option
                if (PLAYER_DATA.webModifier === option.type) flag += '§s§e§l§e§c§t§e§d';
                break;
            case 'base':     
            case 'secondary':
            case 'pattern':
                if (option.rgba && JSON.stringify(option.rgba) == JSON.stringify(PLAYER_DATA.suit[type].color)) flag += '§s§e§l§e§c§t§e§d';
                break;
            case 'pattern_type':
                if (option.pattern && option.pattern === PLAYER_DATA.suit.pattern.texture) flag += '§s§e§l§e§c§t§e§d';
                if (option.pattern === 0 && PLAYER_DATA.suit.pattern.texture === 0) flag += '§s§e§l§e§c§t§e§d';
                break;
            case 'eye_type':
                if (option.eye && option.eye === PLAYER_DATA.suit.eyes.texture) flag += '§s§e§l§e§c§t§e§d';
                if (option.eye === 0 && PLAYER_DATA.suit.eyes.texture === 0) flag += '§s§e§l§e§c§t§e§d';
                break;
        }
        
        //form.button([{ text: '§6' }, option.title, { text: '\n§o§7' }, { text: `${row}${flag}`}], option.texture);

        form.button({ rawtext: [
            { text: '§6' },
            option.title,
            { text: '\n§o§7' },
            option.description,
            { text: `${row}${flag}` }
        ]}, option.texture);

        //form.button(`§6${option.title}\n§o§7${option.description}${row}${flag}`, option.texture);
    }

    form.show(player).then((result) => {
        if (result.canceled) return;
        const { selection } = result;

        if (selection < sidebarOptions.length) {
            PLAYER_DATA.lastOpenedMenu = selection;
            return suitEditorMenu(player, PLAYER_DATA, { sidebar: selection });
        } else if (selection < sidebarOptions.length + removeLength) {
            switch (type) {
                case 'shooter':
                    return upgradeShooterForm(player, PLAYER_DATA);
                case 'modifier':
                    if (selection === sidebarOptions.length) {
                        PLAYER_DATA.webModifier = undefined;
                    } else {
                        return webColorForm(player, PLAYER_DATA);
                    }
                    break;
                case 'base':  
                case 'secondary':
                case 'pattern':
                    return customColorForm(player, PLAYER_DATA, context);  
            }
        } else {
            switch (type) {
                case 'shooter':
                    PLAYER_DATA.webShooterType = sidebar.options[selection - sidebarOptions.length - removeLength].type;
                    break;
                case 'modifier':
                    PLAYER_DATA.webModifier = sidebar.options[selection - sidebarOptions.length - removeLength].type;
                    break;
                case 'base':
                    PLAYER_DATA.suit[type].color = sidebar.options[selection - sidebarOptions.length - removeLength].rgba;
                    loadSuit(player, PLAYER_DATA);
                    break;        
                case 'secondary':
                    PLAYER_DATA.suit.secondary.color = sidebar.options[selection - sidebarOptions.length - removeLength].rgba;
                    loadSuit(player, PLAYER_DATA);
                    break;
                case 'pattern':
                    PLAYER_DATA.suit.pattern.color = sidebar.options[selection - sidebarOptions.length - removeLength].rgba;
                    loadSuit(player, PLAYER_DATA);
                    break;
                case 'pattern_type':
                    PLAYER_DATA.suit.pattern.texture = sidebar.options[selection - sidebarOptions.length - removeLength].pattern;
                    loadSuit(player, PLAYER_DATA);
                    break;
                case 'eye_type':
                    PLAYER_DATA.suit.eyes.texture = sidebar.options[selection - sidebarOptions.length - removeLength].eye;

                    if (PLAYER_DATA.suit.eyes.texture === 0) {
                        PLAYER_DATA.suit.base.texture = 2;
                    } else {
                        PLAYER_DATA.suit.base.texture = 1;
                    }

                    loadSuit(player, PLAYER_DATA);
                    break;
            }

        }

        saveBuild(player, PLAYER_DATA);
        suitEditorMenu(player, PLAYER_DATA, context);
    });
}

async function customColorForm(player, PLAYER_DATA, context) {
    const suitPartIndex = context.sidebar;
    const suitPart = sidebarOptions[suitPartIndex].type;

    let color;
    if (context.sub) {
        color = PLAYER_DATA.webColor;
    } else {
        color = PLAYER_DATA.suit[suitPart].color;
    }

    const form = new ModalFormData()
        .title({ rawtext: [
            { text: '§e' },
            { translate: "spiderman.color.custom" },
        ]})
        .slider({ rawtext: [
            { text: '§c' },
            { translate: "spiderman.color.custom.red" },
        ]}, 0, 255, 1, color.red)
        .slider({ rawtext: [
            { text: '§a' },
            { translate: "spiderman.color.custom.green" },
        ]}, 0, 255, 1, color.green)
        .slider({ rawtext: [
            { text: '§b' },
            { translate: "spiderman.color.custom.blue" },
        ]}, 0, 255, 1, color.blue)
        .slider({ rawtext: [
            { text: '§f' },
            { translate: "spiderman.color.custom.alpha" },
        ]}, 0, 255, 1, color.alpha || 255);

    form.show(player).then(async (ModalFormResponse) => {
        const { formValues } = ModalFormResponse;
        if (!formValues) return suitEditorMenu(player, PLAYER_DATA, context);

        const [ red, green, blue, alpha ] = formValues;

        if (context.sub) {
            PLAYER_DATA.webColor = { red, green, blue };
            const colorMap = new MolangVariableMap();
            colorMap.setVector3("variable.plane", { x: red / 255, y: green / 255, z: blue / 255 });
            PLAYER_DATA.particleMap = colorMap;
        } else {
            PLAYER_DATA.suit[suitPart].color = { red, green, blue, alpha };
            loadSuit(player, PLAYER_DATA);
        }

        saveBuild(player, PLAYER_DATA);

        if (context.sub) return webColorForm(player, PLAYER_DATA);
        suitEditorMenu(player, PLAYER_DATA, context);
    });
}

const webColors = [
    {
        title: { translate: "spiderman.color.black" },
        description: { translate: "spiderman.color.black.desc" },
        texture: "textures/suit/colors/black",
        rgba: { red: 50, green: 50, blue: 50 }
    },
    {
        title: { translate: "spiderman.color.brown" },
        description: { translate: "spiderman.color.brown.desc" },
        texture: "textures/suit/colors/brown",
        rgba: { red: 139, green: 69, blue: 19 }
    },
    {
        title: { translate: "spiderman.color.red" },
        description: { translate: "spiderman.color.red.desc" },
        texture: "textures/suit/colors/red",
        rgba: { red: 155, green: 0, blue: 0 }
    },
    {
        title: { translate: "spiderman.color.orange" },
        description: { translate: "spiderman.color.orange.desc" },
        texture: "textures/suit/colors/orange",
        rgba: { red: 215, green: 85, blue: 0 }
    },
    {
        title: { translate: "spiderman.color.yellow" },
        description: { translate: "spiderman.color.yellow.desc" },
        texture: "textures/suit/colors/yellow",
        rgba: { red: 215, green: 185, blue: 0 }
    },
    {
        title: { translate: "spiderman.color.lime" },
        description: { translate: "spiderman.color.lime.desc" },
        texture: "textures/suit/colors/lime",
        rgba: { red: 50, green: 205, blue: 20 }
    },
    {
        title: { translate: "spiderman.color.green" },
        description: { translate: "spiderman.color.green.desc" },
        texture: "textures/suit/colors/green",
        rgba: { red: 90, green: 155, blue: 40 }
    },
    {
        title: { translate: "spiderman.color.cyan" },
        description: { translate: "spiderman.color.cyan.desc" },
        texture: "textures/suit/colors/cyan",
        rgba: { red: 22, green: 150, blue: 152 }
    },
    {
        title: { translate: "spiderman.color.light_blue" },
        description: { translate: "spiderman.color.light_blue.desc" },
        texture: "textures/suit/colors/light_blue",
        rgba: { red: 72, green: 193, blue: 228 }
    },
    {
        title: { translate: "spiderman.color.blue" },
        description: { translate: "spiderman.color.blue.desc" },
        texture: "textures/suit/colors/blue",
        rgba: { red: 60, green: 80, blue: 180 }
    },
    {
        title: { translate: "spiderman.color.purple" },
        description: { translate: "spiderman.color.purple.desc" },
        texture: "textures/suit/colors/purple",
        rgba: { red: 133, green: 50, blue: 180 }
    },
    {
        title: { translate: "spiderman.color.magenta" },
        description: { translate: "spiderman.color.magenta.desc" },
        texture: "textures/suit/colors/magenta",
        rgba: { red: 155, green: 60, blue: 155 }
    },
    {
        title: { translate: "spiderman.color.pink" },
        description: { translate: "spiderman.color.pink.desc" },
        texture: "textures/suit/colors/pink",
        rgba: { red: 255, green: 135, blue: 190}
    },
    {
        title: { translate: "spiderman.color.gray" },
        description: { translate: "spiderman.color.gray.desc" },
        texture: "textures/suit/colors/gray",
        rgba: { red: 110, green: 110, blue: 110 }
    },
    {
        title: { translate: "spiderman.color.white" },
        description: { translate: "spiderman.color.white.desc" },
        texture: "textures/suit/colors/white",
        rgba: { red: 255, green: 255, blue: 255 }
    }
]

function webColorForm(player, PLAYER_DATA) {
    const form = new ActionFormData()
        .title({ rawtext: [
            { text: '§e' },
            { translate: "spiderman.suit.prefix" },
            { translate: "spiderman.suit.web_color.title" },
            { text: '§c§u§s§t§o§m§i§z§e' },
        ]})
        .body({ translate: "spiderman.suit.web_color.desc" });

    let removeLength = 1;
    form.button({ rawtext: [
        { text: '§0§6' },
        { translate: "spiderman.suit.back" },
        { text: '\n§o§7' },
        { translate: "spiderman.suit.back.desc" },
    ]}, "textures/ui/spiderverse/back_button");

    if (config.allowCustomWebColors) {
        removeLength++;
        form.button({ rawtext: [
            { text: '§2§f' },
            { translate: "spiderman.suit.customize" },
        ]});
    }

    for (let i = 0; i < webColors.length; i++) {
        const option = webColors[i];
        const row = rows[ i % rows.length ];

        let flag = '';
        if (JSON.stringify(option.rgba) == JSON.stringify(PLAYER_DATA.webColor)) flag += '§s§e§l§e§c§t§e§d';

        form.button({ rawtext: [
            { text: '§6' },
            option.title,
            { text: '\n§o§7' },
            option.description,
            { text: `${row}${flag}` }
        ]}, option.texture);
    }

    form.show(player).then((result) => {
        if (result.canceled) return;
        const { selection } = result;

        if (selection === 0) {
            return suitEditorMenu(player, PLAYER_DATA);
        }

        if (selection === 1 && config.allowCustomWebColors) {
            return customColorForm(player, PLAYER_DATA, { sidebar: 1, sub: true });
        }

        const color = webColors[selection - removeLength].rgba;
        const colorMap = new MolangVariableMap();
        colorMap.setVector3("variable.plane", { x: color.red / 255, y: color.green / 255, z: color.blue / 255 });
        PLAYER_DATA.particleMap = colorMap;
        PLAYER_DATA.webColor = color;
        
        saveBuild(player, PLAYER_DATA);
        webColorForm(player, PLAYER_DATA);
    });
}

// Devillas
const upgradeOptions = [
    {
        title: { translate: "spiderman.suit.speed.title" },
        description: { translate: "spiderman.suit.speed.desc" },
        type: "speed",
        texture: "textures/suit/upgrades/speed",
    },
    {
        title: { translate: "spiderman.suit.strength.title" },
        description: { translate: "spiderman.suit.strength.desc" },
        type: "strength",
        texture: "textures/suit/upgrades/strength",
    },
    {
        title: { translate: "spiderman.suit.range.title" },
        description: { translate: "spiderman.suit.range.desc" },
        type: "range",
        texture: "textures/suit/upgrades/range",
    },
    {
        title: { translate: "spiderman.suit.capacity.title" },
        description: { translate: "spiderman.suit.capacity.desc" },
        type: "capacity",
        texture: "textures/suit/upgrades/capacity",
    },
    {
        title: { translate: "spiderman.suit.refill.title" },
        description: { translate: "spiderman.suit.refill.desc" },
        type: "refill",
        texture: "textures/suit/upgrades/refill",
    }
]

function upgradeShooterForm(player, PLAYER_DATA) {
    const form = new ActionFormData()
        .title({ rawtext: [
            { text: '§e' },
            { translate: "spiderman.suit.prefix" },
            { translate: "spiderman.suit.upgrade.title" },
            { text: '§c§u§s§t§o§m§i§z§e' },
        ]})
        .body({ translate: "spiderman.suit.upgrade.desc" });

    form.button({ rawtext: [
        { text: '§0§6' },
        { translate: "spiderman.suit.back" },
        { text: '\n§o§7' },
        { translate: "spiderman.suit.back.desc" },
    ]}, "textures/ui/spiderverse/back_button");

    form.button({ rawtext: [
        { text: '§2§f' },
        { translate: "spiderman.suit.reset" },
    ]});

    for (let i = 0; i < upgradeOptions.length; i++) {
        const option = upgradeOptions[i];
        const row = rows[ i % rows.length ];

        let flag = '';
        if (PLAYER_DATA.webShooterUpgrade == upgradeOptions[i].type) flag += '§s§e§l§e§c§t§e§d';

        form.button({ rawtext: [
            { text: '§6' },
            option.title,
            { text: '\n§o§7' },
            option.description,
            { text: `${row}${flag}` }
        ]}, option.texture);
    }

    form.show(player).then((result) => {
        if (result.canceled) return;
        const { selection } = result;

        if (selection === 0) {
            return suitEditorMenu(player, PLAYER_DATA, { sidebar: 0 });
        }

        if (selection === 1) {
            PLAYER_DATA.webShooterUpgrade = undefined;
            saveBuild(player, PLAYER_DATA);
            return upgradeShooterForm(player, PLAYER_DATA);
        }

        const upgrade = upgradeOptions[selection - 2];
        PLAYER_DATA.webShooterUpgrade = upgrade.type;

        if (PLAYER_DATA.webShooterUpgrade == "capacity") {
            PLAYER_DATA.upgradeLevel = 2;
        } else {
            PLAYER_DATA.upgradeLevel = 0;
        }

        switch (upgrade.type) {
            case 'speed':
                break;
            case 'strength':
                break;
            case 'range':
                break;
            case 'capacity':
                break;
            case 'refill':
                break;
        }
        
        saveBuild(player, PLAYER_DATA);
        upgradeShooterForm(player, PLAYER_DATA);
    });
}