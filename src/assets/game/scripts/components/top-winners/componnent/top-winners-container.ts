import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, Tween, tween, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { TopWinner, TopWinnersStore } from "../top-winners-store";
import { TopWinnerItem } from "./top-winner-item";
const { ccclass, property } = _decorator;

const { Rounds, Player } = gc;
const { render, handle } = Observer;
const { MainPlayerStore } = Player;

@ccclass
export class TopWinnersContainer extends ObserverComponent {
    @property(Node)
    container: Node = null;

    @property(Prefab)
    topWinnerPrefab: Prefab = null;

    @property
    itemSize = 50;
    @property
    padding = 5;

    playerName = "";

    items: Node[] = [];

    @render(TopWinnersStore, (store) => store.winners)
    renderWinners(winners: TopWinner[]) {
        winners.forEach((winner) => {
            this.addItem(winner);
        });
    }

    @render(gc.Player.MainPlayerStore, (store) => store.name)
    renderPlayerName(name: string) {
        this.playerName = name;
    }

    private addItem(winner: TopWinner) {
        const winnerNode = instantiate(this.topWinnerPrefab);
        const count = this.container.children.length;
        const topWinnerItem = winnerNode.getComponent(TopWinnerItem);
        const isMainPlayer = winner.name === this.playerName;

        topWinnerItem.setData(winner, isMainPlayer);
        this.container.addChild(winnerNode);

        let lastItemPositionY = 0;
        if (count > 0) {
            lastItemPositionY = this.container.children[count - 1].position.y;
        }
        winnerNode.setPosition(0, lastItemPositionY - this.itemSize - this.padding, 0);

        this.items.push(winnerNode);
    }

    @render(TopWinnersStore, (store) => store.newTopWinner)
    renderNewTopWinner(newTopWinner: TopWinner) {
        if (!newTopWinner) {
            return;
        }
        this.addItem(newTopWinner);
        this.movingUp();
    }

    movingUp() {
        const count = this.items.length;
        const noMoving = count <= 10;

        if (noMoving) {
            return;
        }

        const oldest = this.items.shift();
        AnimationUtils.fadeOut(oldest, 0.5).then(() => {
            oldest.destroy();
        });

        this.items.forEach((child, index) => {
            const isNew = index === this.items.length - 1;
            if (isNew) {
                AnimationUtils.setOpacityNode(child, 1);
                AnimationUtils.fadeIn(child, 0.5);
            }
        });

        const destination = -this.items[0].position.y - this.itemSize - this.padding;
        Tween.stopAllByTarget(this.container);
        tween(this.container)
            .to(0.5, { position: v3(0, destination, 0) })
            .start();
    }
}
