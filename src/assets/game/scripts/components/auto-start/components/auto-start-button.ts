import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetHandler } from "../../bets/bet-handler";
import { BetStore } from "../../bets/bet-store";

const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export class AutoStartButton extends ObserverComponent {
    @property(Node)
    buttonAutoStart: Node = null;

    @property(Node)
    iconAutoStartOn: Node = null;

    @property(Node)
    iconAutoStartOff: Node = null;

    onLoad() {
        super.onLoad();
        this.addEvent();
    }

    @handle(BetHandler, (handle) => handle.updateAutoStart())
    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(AudioIds.CLICK))
    onClickAutoStartButton() {}

    @render(BetStore, (store) => store.isAutoStart)
    updateIconAutoStart(isAutoStart: boolean) {
        this.iconAutoStartOn.active = isAutoStart;
        this.iconAutoStartOff.active = !isAutoStart;
    }

    addEvent() {
        this.buttonAutoStart.on(Node.EventType.MOUSE_MOVE, this.eventOnEnter, this);
        this.buttonAutoStart.on(Node.EventType.MOUSE_LEAVE, this.resetCursor, this);
    }

    eventOnEnter() {
        document.body.style.cursor = "pointer";
    }

    resetCursor() {
        document.body.style.cursor = "default";
    }
}
