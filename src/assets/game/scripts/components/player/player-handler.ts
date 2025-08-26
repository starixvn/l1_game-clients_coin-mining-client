import gc from "@sg/game-client-base";
import inversify from "inversify";
import { IAroundTablePlayers } from "../../../../../extensions/shared-components/assets/game/around-table-player/scripts/stores/around-table-players-chip-store";
import { Player, PlayerChipMessage, PlayerMineMessage, PlayerStore, PlayerWinMessage } from "./player-store";

const { injectable, inject } = inversify;
const { NumberUtils } = gc.Shared.utils;

@injectable()
export class PlayerHandlers {
    @inject(PlayerStore) private readonly playerStore: PlayerStore;
    @inject(gc.Player.MainPlayerStore) private readonly mainPlayerStore: gc.Player.MainPlayerStore;

    addPlayer(player: IAroundTablePlayers) {
        this.playerStore.players.push(
            new Player({
                id: player.id,
                name: player.name,
                red: player.red,
                avatarId: player.avatarId,
                type: player.type,
                rate: player.rate,
                multiplier: 0,
            })
        );
    }

    removePlayer(id: string) {
        const index = this.playerStore.players.findIndex((p) => p.id === id);
        if (index !== -1) {
            this.playerStore.players.splice(index, 1);
        }
    }

    updatePlayerInfo(index: number) {
        this.playerStore.updatePlayerInfoIndex = -1;
        this.playerStore.players[index].status = null;
    }

    updatePlayerStatus(status: PlayerWinMessage) {
        const index = this.playerStore.players.findIndex((p) => p.id === status.playerId);
        if (index !== -1) {
            status.bet = NumberUtils.getValueByCurrency(status.bet, this.mainPlayerStore.rate, status.rate);
            this.playerStore.players[index].status = status;
            if (status.win) {
                this.playerStore.players[index].red += status.bet;
                this.playerStore.updatePlayerInfoIndex = index;
            }
            this.playerStore.players[index].multiplier = 0;
        }
    }

    updatePlayerRed(message: PlayerChipMessage) {
        const index = this.playerStore.players.findIndex((p) => p.id === message.playerId);
        if (index !== -1) {
            this.playerStore.players[index].red = message.red;
            this.playerStore.players[index].multiplier = message.multiplier ?? 0;
            this.playerStore.updatePlayerInfoIndex = index;
        }
    }

    updatePlayerMine(message: PlayerMineMessage) {
        const index = this.playerStore.players.findIndex((p) => p.id === message.playerId);
        if (index !== -1) {
            this.playerStore.players[index].multiplier = message.multiplier;
            this.playerStore.updatePlayerInfoIndex = index;
        }
    }

    updateUserActive(isActive: boolean) {
        this.playerStore.isUserActive = isActive;
    }

    eventHandleList = [
        {
            name: PlayerWinMessage.eventName,
            handle: this.updatePlayerStatus,
        },
        {
            name: PlayerChipMessage.eventName,
            handle: this.updatePlayerRed,
        },
        {
            name: PlayerMineMessage.eventName,
            handle: this.updatePlayerMine,
        },
    ];
}
