import { Action, Callbacks, objectApply, toggleClass, arrayFind, arrayForeach, arrayMap } from "./utils";
import { buildDOM, BuildDOMCtx, BuildDomExpr, IDOM, IView } from "./buildDOM";


export class View<T extends HTMLElement = HTMLElement> implements IView {
    constructor(dom?: BuildDomExpr) {
        if (dom) this.domExprCreated(dom);
    }

    static getView(obj: BuildDomExpr) { return obj instanceof View ? obj : new View(obj); }

    public parentView?: ContainerView<View> = undefined;
    public _position?: number = undefined;
    get position() { return this._position; }

    domctx = new BuildDOMCtx();
    
    protected _dom: T | undefined = undefined;
    public get dom() {
        this.ensureDom();
        return this._dom!;
    }
    public get domCreated() { return !!this._dom; }

    public get hidden() { return this.dom.hidden; }
    public set hidden(val: boolean) { this.dom.hidden = val; }

    public ensureDom() {
        if (!this._dom) {
            var r = this.createDom();
            this.domExprCreated(r);
        }
    }

    private domExprCreated(r: BuildDomExpr) {
        this._dom = buildDOM(r, this.domctx) as T;
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
        this.domctx.update();
    }

    public getDomById(id: string): HTMLElement {
        this.ensureDom();
        return this.domctx.dict[id];
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
    appendView(view: View) { this.dom.appendChild(view.dom); }
    getDOM() { return this.dom; }
    addChild(child: BuildDomExpr) {
        if (child instanceof View) {
            this.appendView(child);
        } else {
            this.dom.appendChild(buildDOM(child));
        }
    }

    _onActive: Callbacks<Action<MouseEvent>> | undefined = undefined;
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
    getDOM(parent).appendChild(childView.dom);
}

export function addChild(parent: IDOM, child: BuildDomExpr) {
    // fast path
    if (parent instanceof View) parent.addChild(child);
    else if (parent instanceof Node) parent.appendChild(buildDOM(child));
    // slow path
    else if ('addChild' in parent) {
        parent.addChild(child);
    }
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
    items: T[] = [];
    appendView(view: T) {
        this.addView(view as any);
    }
    addView(view: T, pos?: number) {
        const items = this.items;
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
    }
    removeView(view: T | number) {
        view = this._ensureItem(view);
        this._removeFromDom(view);
        var pos = view._position!;
        view.parentView = view._position = undefined;
        this.items.splice(pos, 1);
        for (let i = pos; i < this.items.length; i++) {
            this.items[i]._position = i;
        }
    }
    removeAllView() {
        while (this.length) this.removeView(this.length - 1);
    }
    updateChildrenDom() {
        for (const item of this.items) {
            item.updateDom();
        }
    }
    protected _insertToDom(item: T, pos: number) {
        if (pos == this.items.length - 1) this.dom.appendChild(item.dom);
        else this.dom.insertBefore(item.dom, this.items[pos + 1]?.dom || null);
    }
    protected _removeFromDom(item: T) {
        if (item.domCreated) item.dom.remove();
    }
    protected _ensureItem(item: T | number) {
        if (typeof item === 'number') item = this.items[item];
        else if (!item) throw new Error('item is null or undefined.');
        else if (item.parentView !== this) throw new Error('the item is not in this listview.');
        return item;
    }

    [Symbol.iterator]() { return this.items[Symbol.iterator](); }
    get length() { return this.items.length; }
    get(idx: number) {
        return this.items[idx];
    }
    map<TRet>(func: (lvi: T) => TRet) { return arrayMap(this, func); }
    find(func: (lvi: T, idx: number) => any) { return arrayFind(this, func); }
    forEach(func: (lvi: T, idx: number) => void) { return arrayForeach(this, func); }
}
