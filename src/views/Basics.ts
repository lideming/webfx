import { BuildDomExpr } from "../lib/buildDOM";
import { ObjectInit, objectInit } from "../lib/utils";
import { View } from "../lib/view";

export class TextView extends View {
    get text() { return this.dom.textContent; }
    set text(val) { this.dom.textContent = val; }
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

export class TextBtn extends View {
    text: string = '';
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
        this.dom.textContent = this.text;
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
