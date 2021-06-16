import { BuildDomExpr } from "../lib/buildDOM";
import { ObjectInit, objectInit } from "../lib/utils";
import { View } from "../lib/view";


export class InputView extends View {
    multiline: boolean = false;
    type = 'text';
    placeholder = '';
    get value() { return (this.dom as HTMLInputElement).value; }
    set value(val) { (this.dom as HTMLInputElement).value = val; }
    constructor(init?: ObjectInit<InputView>) {
        super();
        objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return this.multiline ? { tag: 'textarea.input-text' } : { tag: 'input.input-text' };
    }
    updateDom() {
        super.updateDom();
        if (this.dom instanceof HTMLInputElement) {
            this.dom.type = this.type;
            this.dom.placeholder = this.placeholder;
        }
    }
}

export class LabeledInputBase<T extends View> extends View {
    label: string = '';
    input: T;
    get dominput(): HTMLInputElement { return this.input.dom as any; }
    constructor(init?: ObjectInit<LabeledInputBase<T>>) {
        super();
        objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            _ctx: this,
            tag: 'div.labeled-input',
            child: [
                { tag: 'div.input-label', text: () => this.label },
                this.input
            ]
        };
    }
    updateDom() {
        super.updateDom();
        this.input.domCreated && this.input.updateDom();
    }
}

export class LabeledInput extends LabeledInputBase<InputView> {
    type: string;
    get value() { return this.dominput.value; }
    set value(val) { this.dominput.value = val; }
    constructor(init?: ObjectInit<LabeledInput>) {
        super();
        objectInit(this, init);
        if (!this.input) this.input = new InputView();
    }
    updateDom() {
        this.input.type = this.type;
        super.updateDom();
    }
}
