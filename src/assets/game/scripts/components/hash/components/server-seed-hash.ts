import { _decorator } from "cc";

import { LabelCopyComponent } from "db://shared-components/shared/common-components/copy-label/scripts/label-copy-component";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { HashStore } from "../hash-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass
export class ServerSeedHash extends ObserverComponent {
    @property(LabelCopyComponent)
    sshValue: LabelCopyComponent = null;

    @render(HashStore, (store) => store.hashValue)
    private renderSSH(hashValue: string) {
        this.sshValue?.setString(hashValue);
    }
}
