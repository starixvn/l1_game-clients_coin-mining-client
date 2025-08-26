import inversify from "inversify";
import { BetStore } from "../bets/bet-store";
import { CashOutHistoryStore } from "./cash-out-history-store";
const { injectable, inject } = inversify;

@injectable()
export class CashOutHistoryHandlers {
    @inject(CashOutHistoryStore) protected readonly cashOutHistoryStore: CashOutHistoryStore;
    @inject(BetStore) protected readonly betStore: BetStore;

    private readonly maxCashOutHistory = 10;

    updateCashOutHistory(cashOutHistory: number[]) {
        this.cashOutHistoryStore.cashOutHistory = cashOutHistory;
    }

    addCashOutHistory() {
        const cashOutHistory = [...this.cashOutHistoryStore.cashOutHistory];
        cashOutHistory.push({
            multiplier: this.betStore.multiplier,
            roundId: this.betStore.roundId,
        });
        if (cashOutHistory.length > this.maxCashOutHistory) {
            cashOutHistory.shift();
        }
        this.updateCashOutHistory(cashOutHistory);
    }

    resetCashOutHistory() {
        this.cashOutHistoryStore.cashOutHistory = [];
    }
}
