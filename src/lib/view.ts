import { Action, Callbacks, objectApply, toggleClass, arrayFind, arrayForeach, arrayMap } from "./utils";
import { buildDOM, BuildDOMCtx, BuildDomExpr, buildView, IDOM, IView, JsxNode, MountState } from "./buildDOM";


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

    private _baseView: View | undefined = undefined;
    public get baseView() { return this._baseView; }

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
        var view = buildView(r, this._domctx);
        if (view instanceof View) {
            this._baseView = view;
            this._dom = view.dom as T;
        } else {
            this._dom = view as T;
        }
        this.postCreateDom();
        this.updateDom();
    }

    protected createDom(): BuildDomExpr {
        return document.createElement('div');
    }

    /** Will be called when the dom is created */
    protected postCreateDom() {
        if (View.debugging) {
            if (this.dom.dataset)
                this.dom.dataset['webfx'] = MountState[this._mountState];
        }
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
            if (!this._baseView && this.domCreated && this.dom.dataset) {
                if (this.dom.dataset['webfx'] == MountState[state]) {
                    console.trace('mountState on the DOM is changed by other view', state, this);
                }
                this.dom.dataset['webfx'] = MountState[state];
            }
        }
        if (this._baseView) {
            // let the baseView do the rest
            this._baseView.mountStateChanged(state);
            return;
        }
        if (this._childViews) for (const child of this._childViews) {
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
    updateAllWith(kv: Partial<this>) {
        objectApply(this, kv);
        this.updateAll();
    }
    toggleClass(clsName: string, force?: boolean) {
        toggleClass(this.dom, clsName, force);
    }

    // Implements `IDOMInstance`
    // appendView(view: View) { this.dom.appendChild(view.dom); }
    getDOM() { return this.dom; }
    addChild(child: BuildDomExpr) {
        const view = buildView(child, this._domctx);
        if (view instanceof View) {
            this.appendView(view);
        } else {
            this.dom.appendChild(view);
        }
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

    private _childViews: View[] | undefined = undefined;
    get childViews(): View[] {
        // Return the childViews of the baseView if exists
        if (this._baseView) { return this._baseView.childViews; }

        // Lazy creating childViews array
        if (!this._childViews) this._childViews = [];
        return this._childViews;
    }
    appendView(view: View) {
        this.addView(view);
    }
    addView(view: View, pos?: number) {
        this._registerChild(view, pos, false);
        if (this._mountState == MountState.Mounted) view.mountStateChanged(MountState.Mounting);
        this._insertToDom(view, pos);
        if (this._mountState != MountState.Unmounted) view.mountStateChanged(this._mountState);
    }
    _registerChild(view: View, pos?: number, changeMountState = true) {
        const items = this.childViews;
        if (view.parentView) throw new Error('the view is already in a container view');
        view.parentView = this;
        if (pos === undefined) {
            view._position = items.length;
            items.push(view);
        } else {
            items.splice(pos, 0, view);
            for (let i = pos; i < items.length; i++) {
                items[i]._position = i;
            }
        }
        if (changeMountState && this._mountState != MountState.Unmounted) {
            view.mountStateChanged(this._mountState);
        }
    }
    removeView(view: View | number) {
        view = this._ensureItem(view);
        this._removeFromDom(view);
        var pos = view._position!;
        view.parentView = view._position = undefined;
        this.childViews.splice(pos, 1);
        for (let i = pos; i < this.childViews.length; i++) {
            this.childViews[i]._position = i;
        }
        if (this._mountState != MountState.Unmounted) {
            view.mountStateChanged(MountState.Unmounted);
        }
    }
    removeAllView() {
        while (this.childViews.length) this.removeView(this.childViews.length - 1);
    }
    removeFromParent() {
        if (this.parentView) this.parentView.removeView(this);
    }
    /** updateDom() then updateChildren() */
    updateAll() {
        this.updateDom();
        if (this.baseView) return this.baseView.updateAll();
        this.updateChildren();
    }
    /** Call updateDom() on the whole tree */
    updateChildren() {
        if (this._childViews) for (const child of this._childViews) {
            child.updateAll();
        }
    }
    protected _insertToDom(item: View, pos?: number) {
        if (pos == undefined) this.dom.appendChild(item.dom);
        else this.dom.insertBefore(item.dom, this.childViews[pos + 1]?.dom || null);
    }
    protected _removeFromDom(item: View) {
        if (item.domCreated) item.dom.remove();
    }
    protected _ensureItem(item: View | number) {
        if (typeof item === 'number') item = this.childViews[item];
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
        console.error("getDOM():", idom);
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
    } else {
        console.error("addChild():", { parent, child });
        throw new Error("addChild(): unsupported parent");
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

    get items() { return this.childViews as T[]; }
    [Symbol.iterator]() { return (this.childViews as T[])[Symbol.iterator](); }
    get length() { return this.childViews.length; }
    get(idx: number) {
        return this.childViews[idx] as T;
    }
    map<TRet>(func: (lvi: T) => TRet) { return arrayMap(this, func); }
    find(func: (lvi: T, idx: number) => any) { return arrayFind(this, func); }
    forEach(func: (lvi: T, idx: number) => void) { return arrayForeach(this, func); }
}
