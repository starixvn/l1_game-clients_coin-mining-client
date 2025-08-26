import inversify from "inversify";
import { VisibilityStore } from "./visibility-store";

const { injectable, inject } = inversify;

@injectable()
export class VisibilityHandlers {
    @inject(VisibilityStore) private readonly visibilityStore: VisibilityStore;

    updateVisibility(isVisible: boolean) {
        this.visibilityStore.isTabVisible = isVisible;
    }
}
