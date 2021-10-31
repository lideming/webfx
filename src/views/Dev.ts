import { Timer, Action, fadeout, ObjectInit, objectInit } from "../lib/utils";
import { ContainerView } from "../lib/view";
import { TextView } from "./Basics";
import { setPosition, PositionOptions } from "./helpers";


export class ToolTip extends TextView {
    createDom() {
        return {
            tag: 'div.tooltip'
        };
    }
    private _shown = false;
    private _timer = new Timer(() => this.close());
    get shown() { return this._shown; }
    show(options: PositionOptions & {
        parent?: HTMLElement, timeout?: number;
    }) {
        if (this.shown) return;
        this._shown = true;
        this._cancelClose?.();
        let { parent = document.body, timeout } = options;
        if (timeout) this._timer.timeout(timeout);
        const dom = this.dom;
        setPosition(dom, options);
        parent.appendChild(dom);
    }
    private _cancelClose: Action<boolean | void> | null = null;
    close(fadeOutOptions?: Parameters<typeof fadeout>[1]) {
        if (!this.shown) return;
        this._timer.tryCancel();
        this._shown = false;
        this._cancelClose = fadeout(this.dom, fadeOutOptions).cancel;
    }
}

export namespace FlagsInput {
    export class FlagsInput extends ContainerView<Flag> {
        constructor(flags?: string[] | Flag[]) {
            super();
            flags?.forEach(f => {
                var flag = f instanceof Flag ? f : new Flag({ text: Object.prototype.toString.call(f) });
                this.addView(flag);
            });
        }
        createDom() {
            return { tag: 'div.flags-input' };
        }
    }

    export class Flag extends TextView {
        get parentInput() { return this.parentView as (FlagsInput | undefined); }
        constructor(init?: ObjectInit<Flag>) {
            super();
            objectInit(this, init);
        }
        createDom() {
            return { tag: 'div.flags-input-item' };
        }
    }
}