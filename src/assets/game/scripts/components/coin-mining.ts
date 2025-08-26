import gc from "@sg/game-client-base";
import { _decorator, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass("coin_mining")
export class CoinMining extends ObserverComponent {
    @property(sp.Skeleton)
    spineTree: sp.Skeleton = null;

    async playAnim(animName: string, isLoop: boolean) {
        await AnimationUtils.playSpine(this.spineTree, animName, isLoop);
    }

    @render(gc.Bet.BetStore, (store) => store.isProcessingBet)
    playCoinMiningAnim(isProcessingBet: boolean) {
        if (isProcessingBet) {
            this.playAnim("shake", false);
        }
    }
}
