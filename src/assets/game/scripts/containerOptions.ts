import gc from "@sg/game-client-base";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import * as InstantWinFeature from "./index";
import { sharedContainer } from "../../scripts/shared-container";
import { settings } from "./game-settings";
import { NullRoundTimeHandlers } from "./handlers/null-round-time-handlers";


export const containerOptions: gc.IContainerOptions = {
    globalContainer: sharedContainer,
    onContainerCreated: (container) => {
        container.bind(gc.GameConfigs.GameSetting).toConstantValue(settings);
        container.bind(LogStore).to(LogStore);

        container.bind(gc.Rounds.RoundTimeHandlers).to(NullRoundTimeHandlers);
    },
    features: [InstantWinFeature, gc.BetDetailsNew, ...gc.defaultFeatures],
};
