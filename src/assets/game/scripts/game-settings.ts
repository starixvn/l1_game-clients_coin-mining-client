import gc from "@sg/game-client-base";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import * as InstantWinFeature from "../scripts";

import { sharedContainer } from "../../scripts/shared-container";
import { NullRoundTimeHandlers } from "./handlers/null-round-time-handlers";

const GAME_NAME = "CoinMining";

export const settings = {
    id: 109,
    name: GAME_NAME,
    observerNamespace: GAME_NAME,
    namespaces: [GAME_NAME],
    durations: {
        wholeRound: 14,
        lockingBet: 3,
        placingBet: 10,
        generatingResult: 0,
        startRound: 1,

        bigWinNotice: 5,
        normalWinNotice: 3,
        loseNotice: 1,
    },
    numberOfRoundHistory: 11,
    validateBalanceWhenBet: true,
};

export const containerOptions: gc.IContainerOptions = {
    globalContainer: sharedContainer,
    onContainerCreated: (container) => {
        container.bind(gc.GameConfigs.GameSetting).toConstantValue(settings);
        container.bind(LogStore).to(LogStore);

        container.bind(gc.Rounds.RoundTimeHandlers).to(NullRoundTimeHandlers);
    },
    features: [InstantWinFeature, gc.BetDetailsNew, ...gc.defaultFeatures],
};
