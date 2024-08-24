import { saveArmor, loadArmor } from "../utils";
import { PLAYER_DATA_MAP } from "../index";

export const scriptEvent = (eventData) => {
    const { id, message, sourceEntity, sourceType } = eventData;

    if (!sourceEntity.hasTag("staff")) return;

    switch (id.replace("spider:", "")) {
        case "save_armor":
            saveArmor(sourceEntity, PLAYER_DATA_MAP[sourceEntity.id]);
            break;
        case "load_armor":
            loadArmor(sourceEntity, PLAYER_DATA_MAP[sourceEntity.id]);
            break;
        case "player_data":
            sourceEntity.sendMessage(JSON.stringify(PLAYER_DATA_MAP));
            break;
        case "player_data_length":
            const length = Object.keys(PLAYER_DATA_MAP).length;
            sourceEntity.sendMessage(`${length} players are currently stored in PLAYER_DATA.`);
            break;
        case "reset_tutorial":
            sourceEntity.setDynamicProperty("TutorialCompleted", false);
            break;
        case "test":
            sourceEntity.playAnimation("animation.spiderman.suit", { stopExpression: "query.property('suit:base_layer=1;query.property('suit:on=1;query.property('suit:base_layer_red=1;" });
            break;
        default:
            break;
    }
};