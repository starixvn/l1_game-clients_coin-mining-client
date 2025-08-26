import { _decorator, Label, UITransform } from "cc";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("NewLabel")
@executeInEditMode
export class NewLabel extends Label {
    @property
    minWidth = 0;

    @property
    maxWidth = 0;

    updateWidth() {
        this.overflow = Label.Overflow.NONE;
        this.updateRenderData();
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform.width > this.maxWidth) {
            this.overflow = Label.Overflow.SHRINK;
            uiTransform.width = this.maxWidth;
        } else if (uiTransform.width < this.minWidth) {
            this.overflow = Label.Overflow.CLAMP;
            uiTransform.width = this.minWidth;
        } else {
            this.overflow = Label.Overflow.NONE;
        }
    }

    get string(): string {
        return this._string;
    }

    set string(value) {
        if (value === null || value === undefined) {
            value = "";
        } else {
            value = value.toString();
        }

        if (this._string === value) {
            return;
        }

        this._string = value;
        this.markForUpdateRenderData();
        this.updateWidth();
    }
}
