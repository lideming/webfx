import { Action, objectInit, ObjectInit } from "../lib/utils";
import { View } from "../lib/view";
import { I } from "@yuuza/i18n";
import { BuildDomExpr } from "../lib/buildDOM";

type LoadingIndicatorState = 'normal' | 'running' | 'error';

export class LoadingIndicator extends View {
    constructor(init?: ObjectInit<LoadingIndicator>) {
        super();
        if (init) objectInit(this, init);
    }
    private _status: LoadingIndicatorState = 'running';
    get state() { return this._status; }
    set state(val: LoadingIndicatorState) {
        this._status = val;
        ['running', 'error', 'normal'].forEach(x => this.toggleClass(x, val === x));
    }
    private _text: string;
    private _textdom: HTMLElement;
    get content() { return this._text; }
    set content(val: string) { this._text = val; this.ensureDom(); this._textdom.textContent = val; }
    onclick: ((e: MouseEvent) => void) | null = null;
    reset() {
        this.state = 'running';
        this.content = I`Loading`;
        this.onclick = null;
    }
    error(err, retry?: Action) {
        this.state = 'error';
        this.content = I`Oh no! Something just goes wrong:` + '\r\n' + err;
        if (retry) {
            this.content += '\r\n' + I`[Click here to retry]`;
        }
        this.onclick = retry as any;
    }
    async action(func: () => Promise<void>) {
        try {
            await func();
        } catch (error) {
            this.error(error, () => this.action(func));
        }
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'div.loading-indicator',
            child: [{
                tag: 'div.loading-indicator-inner',
                child: [{ tag: 'div.loading-indicator-text', _id: 'text' }]
            }],
            onclick: (e) => this.onclick?.(e)
        };
    }
    postCreateDom() {
        this._textdom = this.getDomById('text')!;
        this.reset();
    }
}
