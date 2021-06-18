import { Action, Callbacks, objectApply, toggleClass, arrayFind, arrayForeach, arrayMap } from "./utils";
import { buildDOM, BuildDOMCtx, BuildDomExpr, IDOM, IView, MountState } from "./buildDOM";


export class View<T extends HTMLElement = HTMLElement> implements IView {
    constructor(dom?: BuildDomExpr) {
        this._domctx.view = this;
        if (dom) this.domExprCreated(dom);
    }

    static getView(obj: BuildDomExpr) { return obj instanceof View ? obj : new View(obj); }

    static debugging = false;

    public parentView?: View = undefined;
    public _position?: number = undefined;
    get position() { return this._position; }

    private _domctx = new BuildDOMCtx();

    protected _dom: T | undefined = undefined;
    public get dom() {
        this.ensureDom();
        return this._dom!;
    }
    public get domCreated() { return !!this._dom; }

    private _mountState: MountState = MountState.Unmounted;
    public get mountState() { return this._mountState; }

    public get hidden() { return this.dom.hidden; }
    public set hidden(val: boolean) { this.dom.hidden = val; }

    public ensureDom() {
        if (!this._dom) {
            var r = this.createDom();
            this.domExprCreated(r);
        }
    }

    private domExprCreated(r: BuildDomExpr) {
        this._dom = buildDOM(r, this._domctx) as T;
        this.postCreateDom();
        this.updateDom();
    }

    protected createDom(): BuildDomExpr {
        return document.createElement('div');
    }

    /** Will be called when the dom is created */
    protected postCreateDom() {
    }

    /** Will be called when the dom is created, after postCreateDom() */
    public updateDom() {
        this._domctx.update();
    }

    /** Will be called when the mounting state is changed  */
    public mountStateChanged(state: MountState) {
        if (state == this._mountState) {
            console.trace("mountState unchanged", state, this);
            return;
        }
        this._mountState = state;
        if (View.debugging) {
            if (this.dom.dataset)
                this.dom.dataset['webfxMount'] = MountState[state];
        }
        if (this._children) for (const child of this._children) {
            child.mountStateChanged(state);
        }
    }

    public getDomById(id: string): HTMLElement | null {
        this.ensureDom();
        return this._domctx.dict?.[id] ?? null;
    }

    /** Assign key-values and call `updateDom()` */
    updateWith(kv: Partial<this>) {
        objectApply(this, kv);
        this.updateDom();
    }
    toggleClass(clsName: string, force?: boolean) {
        toggleClass(this.dom, clsName, force);
    }

    // Implements `IDOMInstance`
    // appendView(view: View) { this.dom.appendChild(view.dom); }
    getDOM() { return this.dom; }
    addChild(child: BuildDomExpr) {
        this.appendView(View.getView(child));
    }

    private _onActive: Callbacks<Action<MouseEvent>> | undefined = undefined;
    get onActive() {
        if (!this._onActive) {
            this._onActive = new Callbacks<Action<MouseEvent>>();
            this.dom.addEventListener('click', (e: MouseEvent) => {
                this._onActive!.invoke(e);
            });
            this.dom.addEventListener('keydown', (e: KeyboardEvent) => {
                this.handleKeyDown(e);
            });
        }
        return this._onActive;
    }

    handleKeyDown(e: KeyboardEvent) {
        if (e.code === 'Enter') {
            const rect = this.dom.getBoundingClientRect();
            this._onActive?.invoke(new MouseEvent('click', {
                clientX: rect.x, clientY: rect.y,
                relatedTarget: this.dom
            }));
            e.preventDefault();
        }
    }

    private _children: View[] | undefined = undefined;
    get children() {
        if (!this._children) this._children = [];
        return this._children;
    }
    appendView(view: View) {
        this.addView(view);
    }
    addView(view: View, pos?: number) {
        const items = this.children;
        if (view.parentView) throw new Error('the view is already in a container view');
        view.parentView = this;
        if (pos === undefined) {
            view._position = items.length;
            items.push(view);
            this._insertToDom(view, items.length - 1);
        } else {
            items.splice(pos, 0, view);
            for (let i = pos; i < items.length; i++) {
                items[i]._position = i;
            }
            this._insertToDom(view, pos);
        }
        if (this._mountState != MountState.Unmounted) {
            view.mountStateChanged(this._mountState);
        }
    }
    _registerChild(view: View) {
        const items = this.children;
        if (view.parentView) throw new Error('the view is already in a container view');
        view.parentView = this;
        view._position = items.length;
        items.push(view);
        if (this._mountState != MountState.Unmounted) {
            view.mountStateChanged(this._mountState);
        }
    }
    removeView(view: View | number) {
        view = this._ensureItem(view);
        this._removeFromDom(view);
        var pos = view._position!;
        view.parentView = view._position = undefined;
        this.children.splice(pos, 1);
        for (let i = pos; i < this.children.length; i++) {
            this.children[i]._position = i;
        }
        if (this._mountState != MountState.Unmounted) {
            view.mountStateChanged(MountState.Unmounted);
        }
    }
    removeAllView() {
        while (this.children.length) this.removeView(this.children.length - 1);
    }
    updateChildrenDom() {
        for (const item of this.children) {
            item.updateDom();
        }
    }
    protected _insertToDom(item: View, pos: number) {
        if (pos == this.children.length - 1) this.dom.appendChild(item.dom);
        else this.dom.insertBefore(item.dom, this.children[pos + 1]?.dom || null);
    }
    protected _removeFromDom(item: View) {
        if (item.domCreated) item.dom.remove();
    }
    protected _ensureItem(item: View | number) {
        if (typeof item === 'number') item = this.children[item];
        else if (!item) throw new Error('item is null or undefined.');
        else if (item.parentView !== this) throw new Error('the item is not in this listview.');
        return item;
    }

}

export function tryGetDOM(idom: IDOM | null | undefined) {
    if (!idom) return idom;
    if (idom instanceof View) {
        return idom.getDOM();
    } else if (idom instanceof Node) {
        return idom;
    } else if (idom && "getDOM" in idom) {
        return idom.getDOM();
    }
}

export function getDOM(idom: IDOM) {
    var dom = tryGetDOM(idom);
    if (!dom) {
        console.error("getDOM(): unsupported parameter:", idom);
        throw new Error("getDOM(): unsupported parameter: " + idom);
    }
    return dom;
}

export function appendView(parent: IDOM, childView: View) {
    warnMountingView(parent, childView);
    getDOM(parent).appendChild(childView.dom);
}

export function addChild(parent: IDOM, child: BuildDomExpr) {
    // fast path
    if (parent instanceof View) parent.addChild(child);
    else if (parent instanceof Node) {
        warnMountingView(parent, child);
        parent.appendChild(buildDOM(child));
    }
    // slow path
    else if ('addChild' in parent) {
        parent.addChild(child);
    }
}

function warnMountingView(parent: IDOM, child: BuildDomExpr) {
    if (child instanceof View) {
        const data = { parent, child };
        if (parent instanceof Node)
            console.trace("Should use `mountView()` to mount a view to DOM.", data);
        else
            console.trace("Should use `View.addChild()` or `View.appendView()` to add a view into another view.", data);
    }
}

export function mountView(parent: Node, view: View) {
    view.mountStateChanged(MountState.Mounting);
    parent.appendChild(view.dom);
    view.mountStateChanged(MountState.Mounted);
}

export function unmountView(parent: Node, view: View) {
    view.dom.remove();
    view.mountStateChanged(MountState.Unmounted);
}

declare global {
    interface Node {
        /** @deprecated Use the exported function `getDOM()` instead. */
        getDOM(): this;
        /** @deprecated Use the exported function `appendView()` instead. */
        appendView(view: View);
        /** @deprecated Use the exported function `addChild()` instead. */
        addChild(child: BuildDomExpr): void;
    }
}


Node.prototype.getDOM = function () {
    console.trace("webfx: Node.getDOM() is deprecated. Please use the exported function `getDOM()` instead.");
    return this;
};

Node.prototype.addChild = function (child) {
    console.trace("webfx: Node.addChild() is deprecated. Please use the exported function `addChild()` instead.");
    addChild(this, child);
};

Node.prototype.appendView = function (this: Node, view: View) {
    console.trace("webfx: Node.appendView() is deprecated. Please use the exported function `appendView()` instead.");
    appendView(this, view);
};

export class ContainerView<T extends View> extends View {
    addView(view: T, pos?: number): void {
        return super.addView(view, pos);
    }
    removeView(view: T | number): void {
        super.removeView(view);
    }
    protected _insertToDom(item: T, pos: number): void {
        super._insertToDom(item, pos);
    }
    protected _removeFromDom(item: T): void {
        super._removeFromDom(item);
    }
    protected _ensureItem(item: T | number): T {
        return super._ensureItem(item) as T;
    }

    get items() { return this.children as T[]; }
    [Symbol.iterator]() { return (this.children as T[])[Symbol.iterator](); }
    get length() { return this.children.length; }
    get(idx: number) {
        return this.children[idx] as T;
    }
    map<TRet>(func: (lvi: T) => TRet) { return arrayMap(this, func); }
    find(func: (lvi: T, idx: number) => any) { return arrayFind(this, func); }
    forEach(func: (lvi: T, idx: number) => void) { return arrayForeach(this, func); }
}
