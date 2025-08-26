import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CashOutHistoryStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    cashOutHistory: any[] = [];
}
