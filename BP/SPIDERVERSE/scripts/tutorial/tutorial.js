import { system } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

async function forceShow(player, form, timeout = Infinity) {
    const startTick = system.currentTick;
    while ((system.currentTick - startTick) < timeout) {
        const response = await (form.show(player));
        if (response.cancelationReason !== FormCancelationReason.UserBusy) {
            return response;
        }
    };
};

export const startTutorial = async (player, index = 1) => {
    if (index >= 17) {
        player.removeEffect("resistance");
        return;
    }

    player.addEffect("resistance", 20000000, { amplifier: 255, showParticles: false });

    const form = new ActionFormData();
    form.title({
        rawtext: [
            { "text": "§r§r§r§f" },
            { translate: `tutorial.main.${index}` },
        ]
    })
    form.button({
        rawtext: [
            { "text": "§f" },
            { translate: `tutorial.main.continue` },
        ]
    });

    const response = await forceShow(player, form);
    const { selection } = response;
    if (selection === undefined) return player.removeEffect("resistance");
    if (selection === 0) startTutorial(player, index + 1);
}