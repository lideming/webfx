import { BuildDomExpr } from "../lib/buildDOM";
import { Func, FuncOrVal, ObjectInit, objectInit } from "@yuuza/utils";
import { View } from "../lib/view";

export class TextView extends View {
    private _text: string | null = "";
    get text() { return this.dom?.textContent ?? this._text; }
    set text(val: FuncOrVal<string> | null) {
        if (typeof val == 'function') {
            this._text = val();
            this.textFunc = val;
        } else {
            this._text = val;
            this.textFunc = null;
        }
        if (this.domCreated) {
            this.dom.textContent = this._text;
        }
    }

    textFunc: Func<string> | null = null;

    postCreateDom() {
        super.postCreateDom();
        if (this._text) this.dom.textContent = this._text;
    }

    updateDom() {
        super.updateDom();
        if (this.textFunc) {
            this.dom.textContent = this.textFunc();
        }
    }
}

export class ButtonView extends TextView {
    disabled: boolean = false;
    type: 'normal' | 'big' | 'inline' = 'normal';
    constructor(init?: ObjectInit<ButtonView>) {
        super();
        objectInit(this, init);
        this.updateDom();
    }
    createDom(): BuildDomExpr {
        return { tag: 'div.btn', tabIndex: 0 };
    }
    updateDom() {
        super.updateDom();
        this.toggleClass('disabled', this.disabled);
        this.toggleClass('btn-big', this.type === 'big');
        this.toggleClass('btn-inline', this.type === 'inline');
    }
}

export class TextBtn extends TextView {
    clickable = true;
    active = false;
    right = false;
    constructor(init?: ObjectInit<TextBtn>) {
        super();
        objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'span.textbtn.no-selection'
        };
    }
    updateDom() {
        super.updateDom();
        this.dom.tabIndex = this.clickable ? 0 : -1;
        this.toggleClass('clickable', this.clickable);
        this.toggleClass('active', this.active);
        this.dom.style.float = this.right ? 'right' : 'left';
    }
}

/** @deprecated Use `TextBtn` instead. */
export const TabBtn = TextBtn;

/** @deprecated Use `TextBtn` instead. */
export type TabBtn = TextBtn;
