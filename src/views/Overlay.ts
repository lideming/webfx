import { View } from "../lib/view";

export class Overlay extends View {
    createDom() {
        return { tag: 'div.overlay' };
    }

    /** @deprecated Use `setFlags` instead. */
    setCenterChild(centerChild: boolean) {
        return this.setFlags({ centerChild });
    }

    /** @deprecated Use `setFlags` instead. */
    setNoBg(nobg: boolean) {
        return this.setFlags({ nobg });
    }

    /** @deprecated Use `setFlags` instead. */
    setFixed(fixed: boolean) {
        return this.setFlags({ fixed });
    }

    setFlags(flags: { centerChild?: boolean, nobg?: boolean, fixed?: boolean, clickThrough?: boolean }) {
        for (const key in flags) {
            if (Object.prototype.hasOwnProperty.call(flags, key)) {
                this.toggleClass(key, flags[key]);
            }
        }
        return this;
    }
}