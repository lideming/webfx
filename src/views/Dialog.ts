import { Action, Callbacks, fadeout, listenPointerEvents, numLimit } from "../lib/utils";
import { ContainerView, View } from "../lib/view";
import { I, i18n } from "@yuuza/i18n";
import { TextBtn, TextView } from "./Basics";
import { Overlay } from "./Overlay";
import { BuildDomExpr, IDOM, MountState } from "../lib/buildDOM";


export class Dialog extends View {
    parent: DialogParent = Dialog.defaultParent;
    overlay = new Overlay().setFlags({ centerChild: true, nobg: true });

    get domheader() { return this.header.dom; }
    header = new View({ tag: 'div.dialog-title.clearfix' });
    content = new View({ tag: 'div.dialog-content' });
    shown = false;

    btnTitle = new TextBtn({ active: true, clickable: false });
    btnClose = new TextBtn({ text: I`Close`, right: true });

    title = 'Dialog';
    allowClose = true;
    showCloseButton = true;
    onShown = new Callbacks<Action>();
    onClose = new Callbacks<Action>();
    autoFocus: View;

    focusTrap = new View({ tag: 'div.focustrap', tabIndex: 0 });

    static _defaultParent: DialogParent | null = null;
    static get defaultParent(): DialogParent {
        if (!Dialog._defaultParent)
            Dialog._defaultParent = new DialogParent();
        return Dialog._defaultParent;
    }
    static set defaultParent(val) {
        Dialog._defaultParent = val;
    }

    get width() { return this.dom.style.width; }
    set width(val) { this.dom.style.width = val; }

    get contentFlex() { return this.content.dom.classList.contains('flex'); }
    set contentFlex(val) { this.content.toggleClass('flex', !!val); }

    get resizable() { return this.dom.classList.contains('resize'); }
    set resizable(val) { this.toggleClass('resize', !!val); }

    constructor() {
        super();
        this.btnClose.onActive.add(() => this.allowClose && this.close());
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'div.dialog',
            tabIndex: 0,
            style: 'width: 300px',
            child: [
                this.header,
                this.content,
                this.focusTrap
            ]
        };
    }
    postCreateDom() {
        super.postCreateDom();
        this.addBtn(this.btnTitle);
        this.addBtn(this.btnClose);
        this.overlay.appendView(this);
        this.overlay.dom.addEventListener('mousedown', (ev) => {
            if (this.allowClose && ev.button === 0 && ev.target === this.overlay.dom) {
                ev.preventDefault();
                this.close();
            }
        });
        this.overlay.dom.addEventListener('keydown', (ev) => {
            if (this.allowClose && ev.keyCode === 27) { // ESC
                ev.preventDefault();
                this.close();
            } else if (ev.target === this.dom && ev.code === 'Tab' && ev.shiftKey) {
                ev.preventDefault();
                let tabables = this.dom.querySelectorAll('a, [tabindex]');
                if (tabables.length >= 2 && tabables[tabables.length - 2]['focus']) {
                    // the last tabable is `focusTrap`, so the index used here is `length - 2`
                    tabables[tabables.length - 2]['focus']();
                }
            }
        });

        // title bar pointer event handler:
        {
            let offset: { x: number; y: number; };
            listenPointerEvents(this.header.dom, (e) => {
                if (e.action === 'down') {
                    if (e.ev.target !== this.header.dom && e.ev.target !== this.btnTitle.dom)
                        return;
                    e.ev.preventDefault();
                    const rectOverlay = this.overlay.dom.getBoundingClientRect();
                    const rect = this.dom.getBoundingClientRect();
                    offset = {
                        x: e.point.pageX - rectOverlay.x - rect.x,
                        y: e.point.pageY - rectOverlay.y - rect.y
                    };
                    return 'track';
                } else if (e.action === 'move') {
                    e.ev.preventDefault();
                    const rect = this.overlay.dom.getBoundingClientRect();
                    const pageX = numLimit(e.point.pageX, rect.left, rect.right);
                    const pageY = numLimit(e.point.pageY, rect.top, rect.bottom);
                    this.setOffset(pageX - offset.x, pageY - offset.y);
                }
            });
        }

        this.focusTrap.dom.addEventListener('focus', (ev) => {
            this.dom.focus();
        });
    }
    updateDom() {
        super.updateDom();
        this.btnTitle.updateWith({ text: this.title });
        this.btnTitle.hidden = !this.title;
        this.btnClose.hidden = !(this.allowClose && this.showCloseButton);
    }
    addBtn(btn: TextBtn) {
        this.ensureDom();
        this.header.appendView(btn);
    }
    addContent(view: BuildDomExpr, replace?: boolean) {
        this.ensureDom();
        if (replace)
            this.content.removeAllView();
        this.content.addChild(view);
    }
    addChild(view: BuildDomExpr) {
        this.addContent(view);
    }
    setOffset(x: number, y: number) {
        this.dom.style.left = x ? x + 'px' : '';
        this.dom.style.top = y ? y + 'px' : '';
        this.overlay.setCenterChild(false);
    }
    getOffset() {
        var x = this.dom.style.left ? parseFloat(this.dom.style.left) : 0;
        var y = this.dom.style.top ? parseFloat(this.dom.style.top) : 0;
        return { x, y };
    }
    center() {
        this.setOffset(0, 0);
        this.overlay.setCenterChild(true);
    }
    show(ev?: MouseEvent) {
        if (this.shown)
            return;
        this.shown = true;
        this._cancelFadeout?.();
        this.ensureDom();
        this.parent.onDialogShowing(this);
        this.setTransformOrigin(ev);
        this.dom.focus();
        (this.autoFocus || this).dom.focus();
        this.onShown.invoke();
    }
    setTransformOrigin(ev?: MouseEvent) {
        if (ev) {
            const rect = this.dom.getBoundingClientRect();
            this.dom.style.transformOrigin = `${ev.x - rect.x}px ${ev.y - rect.y}px`;
        } else {
            this.dom.style.transformOrigin = '';
        }
    }
    private _cancelFadeout: Action<boolean | void>;
    close() {
        if (!this.shown)
            return;
        this.shown = false;
        this.setTransformOrigin(undefined);
        this.onClose.invoke();
        this._cancelFadeout = fadeout(this.overlay.dom)
            .onFinished(() => this.overlay.parentView?.removeView(this.overlay))
            .cancel;
        Dialog.defaultParent.onDialogClosing(this);
    }
    waitClose(): Promise<void> {
        return new Promise((resolve) => {
            var cb = this.onClose.add(() => {
                this.onClose.remove(cb);
                resolve();
            });
        });
    }
}


export class MessageBox extends Dialog {
    allowClose = false;
    title = 'Message';
    result: 'none' | 'no' | 'yes' | 'ok' | 'cancel' = 'none';
    addResultBtns(results: this['result'][]) {
        for (const r of results) {
            this.addBtnWithResult(new TextBtn({ text: i18n.get('msgbox_' + r), right: true }), r);
        }
        return this;
    }
    setTitle(title: string) {
        this.title = title;
        if (this.domCreated) this.updateDom();
        return this;
    }
    addText(text: string) {
        this.addContent(new TextView({ tag: 'div.messagebox-text', text }));
        return this;
    }
    allowCloseWithResult(result: this['result'], showCloseButton?: boolean) {
        this.result = result;
        this.allowClose = true;
        this.showCloseButton = !!showCloseButton;
        if (this.domCreated) this.updateDom();
        return this;
    }
    addBtnWithResult(btn: TextBtn, result: this['result']) {
        btn.onActive.add(() => { this.result = result; this.close(); });
        this.addBtn(btn);
        return this;
    }
    async showAndWaitResult() {
        this.show();
        await this.waitClose();
        return this.result;
    }
}

export class DialogParent {
    bgOverlay = new Overlay();
    dialogCount = 0;
    fixed = false;
    view: View;
    private _cancelFadeout: Action<boolean | void> | null = null;

    constructor(view: BuildDomExpr = document.body) {
        this.view = View.getView(view);
        if (view === document.body) {
            this.fixed = true;
            this.view.mountStateChanged(MountState.Mounted);
        }
    }
    onDialogShowing(dialog: Dialog) {
        if (this.dialogCount++ === 0) {
            this._cancelFadeout?.();
            this.bgOverlay.setFlags({ fixed: this.fixed, clickThrough: true });
            this.view.appendView(this.bgOverlay);
        }
        dialog.overlay.setFlags({ fixed: this.fixed });
        this.view.appendView(dialog.overlay);
    }
    onDialogClosing(dialog: Dialog) {
        if (--this.dialogCount === 0) {
            this._cancelFadeout = fadeout(this.bgOverlay.dom)
                .onFinished(() => this.view.removeView(this.bgOverlay))
                .cancel;
        }
    }
}
