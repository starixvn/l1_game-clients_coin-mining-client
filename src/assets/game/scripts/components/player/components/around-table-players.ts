import gc from "@sg/game-client-base";
import { _decorator, Node, sp } from "cc";
import { BalanceEffectHandlers } from "db://shared-components/game/balance-effect/scripts/handlers/balance-effect-handlers";
import { TBalanceEffect, TWinningEffect } from "db://shared-components/game/balance-effect/scripts/stores/balance-effect-store";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import { remove, values } from "lodash-es";
import Observer from "observer";
import { AroundTablePlayerComponent } from "../../../../../../extensions/shared-components/assets/game/around-table-player/scripts/components/around-table-player-component";
import {
    IAroundTablePlayers,
    IHiddenPlayers,
} from "../../../../../../extensions/shared-components/assets/game/around-table-player/scripts/stores/around-table-players-chip-store";
import { AroundTablePlayerUtils } from "../../../../../../extensions/shared-components/assets/game/around-table-player/scripts/utils/around-table-player-utils";
import { getCurrentAnimationLevel } from "../../../utils";
import { VisibilityStore } from "../../visibility/visibility-store";
import { PlayerHandlers } from "../player-handler";
import { Player, PlayerStore } from "../player-store";
const { ccclass, property } = _decorator;

const { Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class AroundTablePlayers extends ObserverComponent {
    protected hiddenPlayers: IHiddenPlayers = {};
    aroundTablePlayerComponents: AroundTablePlayerComponent[] = [];
    private axeLevel = 1;
    private currentAnimationName = "";
    private isTabVisible = false;

    onLoad(): void {
        super.onLoad();
        this.aroundTablePlayerComponents =
            this.node.getComponentsInChildren(AroundTablePlayerComponent).filter((component) => component && component.node.active) ?? [];
    }

    @handle(PlayerHandlers, (handle, isActive: boolean) => handle.updateUserActive(isActive))
    updateUserActive(isActive: boolean) {
        return isActive;
    }

    @render(VisibilityStore, (store) => store.isTabVisible)
    setIsTabVisible(isTabVisible: boolean) {
        this.isTabVisible = isTabVisible;
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.aroundTablePlayer)
    renderAroundTablePlayer(aroundTablePlayer: IAroundTablePlayers) {
        if (aroundTablePlayer) {
            this.addAroundTablePlayer(aroundTablePlayer);
            this.addNewPlayer(aroundTablePlayer);
        }
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.aroundTablePlayers)
    renderAroundTablePlayers(aroundTablePlayers: gc.GameServiceMessage.AroundTablePlayers) {
        if (aroundTablePlayers) {
            const players: IAroundTablePlayers[] = Object.values(aroundTablePlayers);
            // Real player is type equal false
            const sortedPlayers: IAroundTablePlayers[] = players.sort((playerA, playerB) => (playerA.type === false ? -1 : 1)); //NOSONAR

            sortedPlayers.forEach((player) => {
                this.addAroundTablePlayer(player);
                this.addNewPlayer(player);
            });
        }
    }

    @handle(PlayerHandlers, (handle, player: IAroundTablePlayers) => handle.addPlayer(player))
    addAroundTablePlayer(player: IAroundTablePlayers) {
        return player;
    }

    @handle(PlayerHandlers, (handle, id: string) => handle.removePlayer(id))
    removeAroundTablePlayer(id: string) {
        return id;
    }

    protected addNewPlayer(aroundTablePlayer: IAroundTablePlayers) {
        const emptySlot = AroundTablePlayerUtils.getEmptyPlayerSlot(this.aroundTablePlayerComponents);
        if (emptySlot) {
            AroundTablePlayerUtils.addAroundTablePlayerInfo({
                playerComp: emptySlot,
                value: aroundTablePlayer,
            });

            emptySlot.node.getChildByName("axe").active = false;
        }
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.outGamePlayerId)
    handleRemoveAroundTablePlayer(outGamePlayerId: gc.GameServiceMessage.RemoveAroundTablePlayer) {
        if (!outGamePlayerId) {
            return;
        }

        const playerSlot = AroundTablePlayerUtils.getAroundTablePlayerSlot(this.aroundTablePlayerComponents, outGamePlayerId.id);

        if (playerSlot) {
            AroundTablePlayerUtils.addAroundTablePlayerInfo({
                playerComp: playerSlot,
                value: null,
            });
            const playerIds = Object.keys(this.hiddenPlayers);

            if (playerIds.length > 0) {
                const newPlayerId = playerIds[0];
                const newPlayer = this.hiddenPlayers[newPlayerId];
                this.addNewPlayer(newPlayer);
                delete this.hiddenPlayers[newPlayerId];
            }
        } else {
            delete this.hiddenPlayers[outGamePlayerId.id];
            this.removeAroundTablePlayer(outGamePlayerId.id);
        }
    }

    updateHiddenPlayerStorage(playerChip: gc.GameServiceMessage.PlayerChip) {
        const player = this.hiddenPlayers?.[playerChip?.playerId];

        if (player) {
            player.idleCount = 0;
            player.red = playerChip.red;
            this.hiddenPlayers[playerChip.playerId] = player;
            AroundTablePlayerUtils.storePlayerToCache(player);
        }
    }

    @render(PlayerStore, (store) => ({ players: store.players, updatePlayerInfoIndex: store.updatePlayerInfoIndex }))
    renderAroundTablePlayerWhenStartBet(data: { players: Player[]; updatePlayerInfoIndex: number }) {
        if (data.updatePlayerInfoIndex !== -1) {
            this.figureOutAroundTablePlayers(data.players, data.updatePlayerInfoIndex);
        }
    }

    @handle(PlayerHandlers, (handle, index: number) => handle.updatePlayerInfo(index))
    updatePlayerInfo(index: number) {
        return index;
    }

    async updateMultiplier(multiplier: number, spineAxe: sp.Skeleton) {
        const level = getCurrentAnimationLevel(multiplier);
        if (this.axeLevel < level) {
            await this.playAxeTransformation(level, spineAxe);
        }
        this.axeLevel = level;
        await this.updateTapAnim(level, spineAxe);

        const needPlayTapAnimation = multiplier > 1.0;
        if (needPlayTapAnimation) {
            this.playTapAnimation(spineAxe);
        }
    }

    async updateTapAnim(level: number, spineAxe: sp.Skeleton) {
        try {
            const kickSpineInfo = this.getKickSpineInfo(level);
            this.currentAnimationName = kickSpineInfo.animation;
            const skeletonData = await this.loadAxeSpine(kickSpineInfo.name);
            spineAxe.skeletonData = skeletonData;
        } catch (e) {}
    }

    getKickSpineInfo(level: number) {
        return { name: `kick/pickaxe-${level}-kick-animation`, animation: `pickaxe-${level}-kick` };
    }

    getCrashSpineInfo(level: number) {
        return { name: `crash/pickaxe-${level}-crash-animation`, animation: `pickaxe-${level}-crash-animation` };
    }

    getTransformSpineInfo(level: number) {
        return { name: `transformation/pickaxe_transformation${level - 1}_${level}`, animation: `pickaxe_${level - 1}_${level}` };
    }

    loadAxeSpine(name: string) {
        return bundleManager.loadResourcesAsset<sp.SkeletonData>(`spines/axe/${name}`, sp.SkeletonData);
    }

    async playAxeTransformation(level: number, spineAxe: sp.Skeleton) {
        try {
            const spineInfo = this.getTransformSpineInfo(level);
            const skeletonData = await this.loadAxeSpine(spineInfo.name);
            spineAxe.skeletonData = skeletonData;
            await AnimationUtils.playSpine(spineAxe, spineInfo.animation, false);
        } catch (e) {}
    }

    playTapAnimation(spineAxe: sp.Skeleton) {
        spineAxe.setAnimation(0, this.currentAnimationName, false);
    }

    protected async figureOutAroundTablePlayers(players: Player[], updatePlayerInfoIndex: number) {
        const hiddenPlayers: IAroundTablePlayers[] = values(this.hiddenPlayers);
        const winningEffects: TWinningEffect[] = [];
        const balanceEffects: TBalanceEffect[] = [];
        for (const player of this.aroundTablePlayerComponents) {
            const aroundTablePlayer = player.aroundTablePlayer;

            if (!aroundTablePlayer) {
                return;
            }

            aroundTablePlayer.idleCount++;
            AroundTablePlayerUtils.storePlayerToCache(aroundTablePlayer);

            const index = players.findIndex((p) => p.id === aroundTablePlayer.id);
            if (index !== updatePlayerInfoIndex) {
                continue;
            }

            aroundTablePlayer.red = players[index].red;
            AroundTablePlayerUtils.updatePlayerSlotDataStorage(
                {
                    red: aroundTablePlayer.red,
                } as gc.GameServiceMessage.PlayerChip,
                player
            );

            this.handleWinAndBalanceEffects(player, players[index].status, winningEffects, balanceEffects);

            this.updatePlayerInfo(index);

            const axeNode = player.node.getChildByName("axe");
            await this.updateAxeNodeByMultiplier(axeNode, players[index].multiplier);
        }

        const botAroundTablePlayerPlayerComps = AroundTablePlayerUtils.getBotAroundTablePlayerComps(this.aroundTablePlayerComponents);
        const realPlayers = AroundTablePlayerUtils.getRealPlayer(hiddenPlayers);

        for (const botAroundTablePlayer of botAroundTablePlayerPlayerComps) {
            const aroundTablePlayer = botAroundTablePlayer.aroundTablePlayer;
            const realPlayer = AroundTablePlayerUtils.findIdleRealPlayer(realPlayers);
            if (realPlayer) {
                await this.updateAroundTablePlayerInfoAndSwap(aroundTablePlayer, realPlayer, botAroundTablePlayer);
                delete this.hiddenPlayers[realPlayer.id];
                remove(realPlayers, realPlayer);
            }
        }
    }

    @handle(BalanceEffectHandlers.AroundTablePlayersWinEffect)
    aroundTablePlayersShowWinningEffect(winningEffects: TWinningEffect[]) {
        return winningEffects;
    }

    @handle(BalanceEffectHandlers.AroundTablePlayersIncreaseBalance)
    updateAroundTablePlayersIncreaseBalance(balanceEffects: TBalanceEffect[]) {
        return balanceEffects;
    }

    protected handleWinAndBalanceEffects(
        playerComp: AroundTablePlayerComponent,
        status: Player["status"] | undefined,
        winningEffects: TWinningEffect[],
        balanceEffects: TBalanceEffect[]
    ) {
        if (status?.win && this.isTabVisible) {
            const nodeBalance = playerComp.node.getChildByName("balance");
            const nodeWinning = playerComp.node.getChildByName("winning");
            winningEffects.push({ effectNode: nodeWinning, status: true });
            balanceEffects.push({ effectNode: nodeBalance, balance: status.bet });
            this.aroundTablePlayersShowWinningEffect(winningEffects);
            this.updateAroundTablePlayersIncreaseBalance(balanceEffects);
        }
    }

    protected async updateAxeNodeByMultiplier(axeNode: Node, multiplier: number) {
        const shouldShowAxe = multiplier > 1.0;
        axeNode.active = shouldShowAxe;
        if (shouldShowAxe) {
            const spineAxe = axeNode.getChildByName("axe-skeleton").getComponent(sp.Skeleton);
            await this.updateMultiplier(multiplier, spineAxe);
        }
    }

    protected async handleIdleAroundTablePlayer(
        aroundTablePlayerComp: AroundTablePlayerComponent,
        aroundTablePlayer: IAroundTablePlayers,
        hiddenPlayers: IAroundTablePlayers[]
    ) {
        const oldPlayerData = aroundTablePlayer;
        const newPlayer = AroundTablePlayerUtils.findIdleHiddenPlayer(hiddenPlayers);

        if (newPlayer) {
            AroundTablePlayerUtils.addAroundTablePlayerInfo({
                playerComp: aroundTablePlayerComp,
                value: newPlayer,
            });
            delete this.hiddenPlayers[newPlayer.id];
            this.hiddenPlayers[oldPlayerData.id] = oldPlayerData;
            remove(hiddenPlayers, newPlayer);
        }
    }

    protected async updateAroundTablePlayerInfoAndSwap(
        aroundTablePlayer: IAroundTablePlayers,
        realPlayer: IAroundTablePlayers,
        botAroundTablePlayer: AroundTablePlayerComponent
    ) {
        this.hiddenPlayers[aroundTablePlayer.id] = aroundTablePlayer;
        AroundTablePlayerUtils.addAroundTablePlayerInfo({
            playerComp: botAroundTablePlayer,
            value: realPlayer,
        });
    }
}
