import { Timer, ObjectInit, objectInit, fadeout } from "../lib/utils";
import { View } from "../lib/view";


export class ToastsContainer extends View {
    static default: ToastsContainer = new ToastsContainer();
    parentDom: HTMLElement | null = null;
    toasts: Toast[] = [];
    createDom() {
        return { tag: 'div.toasts-container' };
    }
    addToast(toast: Toast) {
        if (this.toasts.length === 0)
            this.show();
        this.toasts.push(toast);
    }
    removeToast(toast: Toast) {
        this.toasts.remove(toast);
        if (this.toasts.length === 0)
            this.remove();
    }
    show() {
        var parent = this.parentDom || document.body;
        parent.appendChild(this.dom);
    }
    remove() {
        this.dom.remove();
    }
}

export class Toast extends View {
    text: string = '';
    container: ToastsContainer;
    shown = false;
    timer = new Timer(() => this.close());
    constructor(init?: ObjectInit<Toast>) {
        super();
        objectInit(this, init);
        if (!this.container) this.container = ToastsContainer.default;
    }
    show(timeout?: number) {
        if (!this.shown) {
            this.container.addToast(this);
            this.container.appendView(this);
            this.shown = true;
        }
        if (timeout) this.timer.timeout(timeout);
        else this.timer.tryCancel();
    }
    close() {
        if (!this.shown) return;
        this.shown = false;
        fadeout(this.dom)
            .onFinished(() => this.container.removeToast(this));
    }
    createDom() {
        return { tag: 'div.toast' };
    }
    updateDom() {
        this.dom.textContent = this.text;
    }
    static show(text: string, timeout?: number) {
        var toast = new Toast({ text });
        toast.show(timeout);
        return toast;
    }
}