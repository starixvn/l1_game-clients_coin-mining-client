import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

export class Player {
    id: string;
    name: string;
    red: number;
    avatarId: number;
    type: boolean;
    rate?: number;
    multiplier?: number;
    status?: PlayerWinMessage;
    mine?: PlayerMineMessage;
    chip?: PlayerChipMessage;

    constructor(config: { id: string; name: string; red: number; avatarId: number; type: boolean; rate?: number; multiplier?: number }) {
        Object.assign(this, config);
    }
}

export class PlayerWinMessage {
    bet: number;
    playerId: string;
    rate: number;
    reachMaxWin: boolean;
    win: boolean;

    static eventName = "winners";
}

export class PlayerChipMessage {
    maxBet: number;
    minBet: number;
    multiplier: number;
    name: string;
    playerId: string;
    rate: number;
    red: number;
    scoins: number;

    static eventName = "playerChip";
}

export class PlayerMineMessage {
    multiplier: number;
    playerId: string;
    reachMaxWin: boolean;
    winAmount: number;

    static eventName = "playerMine";
}

@injectable()
export class PlayerStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    players: Player[] = [];
    updatePlayerInfoIndex = -1;
    isUserActive = true;
}
