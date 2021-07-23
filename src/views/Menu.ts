import { ObjectInit, objectInit, Callbacks, Action, fadeout } from "../lib/utils";
import { BuildDomExpr, BuildDomNode } from "../lib/buildDOM";
import { ListViewItem, ListView } from "./ListView";
import { Overlay } from "./Overlay";
import { mountView, unmountView } from "../lib/view";


export class MenuItem extends ListViewItem {
    text: string = '';
    cls: 'normal' | 'dangerous' = 'normal';
    keepOpen = false;
    constructor(init: ObjectInit<MenuItem>) {
        super();
        objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'div.item.no-selection',
            tabIndex: 0
        };
    }
    postCreateDom() {
        super.postCreateDom();
        this.onActive.add((ev) => {
            if (this.parentView instanceof ContextMenu) {
                if (!this.keepOpen && !this.parentView.keepOpen) this.parentView.close();
            }
        });
    }
    private _lastcls;
    updateDom() {
        super.updateDom();
        this.dom.textContent = this.text;
        if (this.cls !== this._lastcls) {
            if (this._lastcls) this.dom.classList.remove(this._lastcls);
            if (this.cls) this.dom.classList.add(this.cls);
        }
    }
}

export class MenuLinkItem extends MenuItem {
    link: string = '';
    download: string = '';
    constructor(init: ObjectInit<MenuLinkItem>) {
        super(init);
        objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        var dom = super.createDom() as BuildDomNode;
        dom.tag = 'a.item.no-selection';
        dom.target = "_blank";
        return dom;
    }
    updateDom() {
        super.updateDom();
        (this.dom as HTMLAnchorElement).href = this.link;
        (this.dom as HTMLAnchorElement).download = this.download;
    }
}

export class MenuInfoItem extends MenuItem {
    text: string = '';
    constructor(init: ObjectInit<MenuInfoItem>) {
        super(init);
        this.keepOpen = true;
        objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'div.menu-info'
        };
    }
    updateDom() {
        super.updateDom();
        this.dom.textContent = this.text;
    }
}


export class ContextMenu extends ListView {
    keepOpen = false;
    useOverlay = true;
    private _visible = false;
    get visible() { return this._visible; };
    overlay: Overlay | null = null;
    onClose = new Callbacks<Action>();
    private _originalFocused: Element | null = null;
    constructor(items?: MenuItem[]) {
        super({ tag: 'div.context-menu', tabIndex: 0 });
        items?.forEach(x => this.add(x));
    }
    postCreateDom() {
        super.postCreateDom();
        this.dom.addEventListener('focusout', (e) => {
            !this.dom.contains(e.relatedTarget as HTMLElement) && this.close();
        });
        this.dom.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }
    show(arg: { x: number, y: number; } | { ev: MouseEvent; }) {
        if (this._visible) {
            console.trace("[ContextMenu] show() called when it's already visible.");
            return;
        }
        if ('ev' in arg) arg = {
            x: arg.ev.clientX,
            y: arg.ev.clientY
        };
        this._visible = true;
        if (this.useOverlay) {
            if (!this.overlay) {
                this.overlay = new Overlay().setFixed(true);
                this.overlay.dom.style.background = 'rgba(0, 0, 0, .1)';
                this.overlay.dom.addEventListener('mousedown', (ev) => {
                    if (ev.eventPhase !== Event.AT_TARGET) return;
                    ev.preventDefault();
                    this.close();
                });
            }
            this.overlay.appendView(this);
            mountView(document.body, this.overlay);
        } else {
            mountView(document.body, this);
        }
        this._originalFocused = document.activeElement;
        this.setPosition(arg);
        this.dom.focus();
    }
    setPosition(arg: { x: number, y: number }) {
        if (!this._visible) {
            console.trace("[ContextMenu] setPosition() called when it's not visible.");
            return;
        }
        this.dom.style.left = '0';
        this.dom.style.top = '0';
        var parentWidth = document.body.offsetWidth;
        var parentHeight = document.body.offsetHeight;
        if (this.useOverlay) {
            const overlayDom = this.overlay!.dom;
            parentWidth = overlayDom.offsetWidth;
            parentHeight = overlayDom.offsetHeight;
        }
        this.dom.style.maxHeight = parentHeight + 'px';
        var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
        var x = arg.x, y = arg.y;
        if (x + width > parentWidth) x -= width;
        if (y + height > parentHeight) y -= height;
        if (x < 0) {
            if (arg.x > parentWidth / 2) x = 0;
            else x = parentWidth - width;
        }
        if (y < 0) {
            if (arg.y > parentHeight / 2) y = 0;
            else y = parentHeight - height;
        }
        this.dom.style.left = x + 'px';
        this.dom.style.top = y + 'px';
        this.dom.style.transformOrigin = `${arg.x - x}px ${arg.y - y}px`;
    }
    close() {
        if (this._visible) {
            this._visible = false;
            this.onClose.invoke();
            this._originalFocused?.['focus']?.();
            this._originalFocused = null;
            if (this.overlay) fadeout(this.overlay.dom).onFinished(() => unmountView(document.body, this.overlay!));
            fadeout(this.dom).onFinished(() => !this.overlay && unmountView(document.body, this));
        }
    }
}
