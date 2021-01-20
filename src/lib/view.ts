import { Action, Func, FuncOrVal, Callbacks, utils } from "./utils";

// BuildDOM types & implementation:
export type BuildDomExpr = string | BuildDomNode | HTMLElement | Node | IDOM;

export interface IDOM {
    getDOM(): HTMLElement;
    addChild(child: IDOM): void;
}

export type BuildDomTag = string;

export type BuildDomReturn = HTMLElement | Text | Node;

export interface BuildDomNode {
    tag?: BuildDomTag;
    child?: BuildDomExpr[] | BuildDomExpr;
    text?: FuncOrVal<string>;
    hidden?: FuncOrVal<boolean>;
    init?: Action<HTMLElement>;
    update?: Action<HTMLElement>;
    _ctx?: BuildDOMCtx | {};
    _key?: string;
    [key: string]: any;
}

export class BuildDOMCtx {
    dict: Record<string, HTMLElement>;
    actions: BuildDOMUpdateAction[];
    constructor(dict?: BuildDOMCtx['dict'] | {}) {
        this.dict = dict ?? {};
    }
    static EnsureCtx(ctxOrDict: BuildDOMCtx | {}, origctx: BuildDOMCtx | null): BuildDOMCtx {
        var ctx: BuildDOMCtx;
        if (ctxOrDict instanceof BuildDOMCtx) ctx = ctxOrDict;
        else ctx = new BuildDOMCtx(ctxOrDict);
        if (origctx) {
            if (!origctx.actions) origctx.actions = [];
            ctx.actions = origctx.actions;
        }
        return ctx;
    }
    setDict(key: string, node: HTMLElement) {
        if (!this.dict) this.dict = {};
        this.dict[key] = node;
    }
    addUpdateAction(action: BuildDOMUpdateAction) {
        if (!this.actions) this.actions = [];
        this.actions.push(action);
        // BuildDOMCtx.executeAction(action);
    }
    update() {
        if (!this.actions) return;
        for (const a of this.actions) {
            BuildDOMCtx.executeAction(a);
        }
    }
    static executeAction(a: BuildDOMUpdateAction) {
        switch (a[0]) {
            case 'text':
                a[1].textContent = a[2]();
                break;
            case 'hidden':
                a[1].hidden = a[2]();
                break;
            case 'update':
                a[2](a[1]);
                break;
            default:
                console.warn('unknown action', a);
                break;
        }
    }
}

type BuildDOMUpdateAction =
    | ['text', Node, Func<string>]
    | ['hidden', HTMLElement, Func<boolean>]
    | ['update', HTMLElement, Action<HTMLElement>];


var createElementFromTag = function (tag: BuildDomTag): HTMLElement {
    var reg = /[#\.^]?[\w\-]+/y;
    var match;
    var ele;
    while (match = reg.exec(tag)) {
        var val = match[0];
        var ch = val[0];
        if (ch === '.') {
            ele.classList.add(val.substr(1));
        } else if (ch === '#') {
            ele.id = val.substr(1);
        } else {
            if (ele) throw new Error('unexpected multiple tags');
            ele = document.createElement(val);
        }
    }
    return ele;
};

function tryHandleValues(obj: BuildDomExpr, ctx: BuildDOMCtx | null) {
    if (typeof (obj) === 'string') { return document.createTextNode(obj); }
    if (typeof obj === 'function') {
        const val = (obj as any)();
        if (!val || typeof val !== 'object') {
            const node = document.createTextNode(val);
            ctx?.addUpdateAction(['text', node, obj]);
            return node;
        } else {
            throw new Error('Unexpected function return value');
        }
    }
    if (Node && obj instanceof Node) return obj as Node;
    return null;
}

var buildDomCore = function (obj: BuildDomExpr, ttl: number, ctx: BuildDOMCtx | null): BuildDomReturn {
    if (ttl-- < 0) throw new Error('ran out of TTL');
    var r = tryHandleValues(obj, ctx);
    if (r) return r;
    if (obj instanceof JsxNode) return obj.buildDom(ctx, ttl);
    if ('getDOM' in (obj as any)) return (obj as any).getDOM();
    const tag = (obj as BuildDomNode).tag;
    if (!tag) throw new Error('no tag');
    var node = createElementFromTag(tag);
    if (obj['_ctx']) ctx = BuildDOMCtx.EnsureCtx(obj['_ctx'], ctx);
    for (var key in obj as any) {
        if (obj.hasOwnProperty(key)) {
            var val = obj[key];
            buildDOMHandleKey(key, val, node, ctx, ttl);
        }
    }
    const init = obj['init'];
    if (init) init(node);

    return node;
};

var buildDOMHandleKey = function (key: string, val: any, node: HTMLElement, ctx: BuildDOMCtx | null, ttl: number) {
    if (key === 'child') {
        if (val instanceof Array) {
            val.forEach(function (val) {
                if (val instanceof Array) {
                    val.forEach(function (val) {
                        node.appendChild(buildDomCore(val, ttl, ctx));
                    });
                } else {
                    node.appendChild(buildDomCore(val, ttl, ctx));
                }
            });
        } else {
            node.appendChild(buildDomCore(val, ttl, ctx));
        }
    } else if (key === '_key') {
        ctx!.setDict(val, node);
    } else if (key === 'text') {
        if (typeof val === 'function') {
            ctx!.addUpdateAction(['text', node, val]);
        } else {
            node.textContent = val;
        }
    } else if (key === 'class') {
        node.className = val;
    } else if (key === 'hidden' && typeof val === 'function') {
        ctx!.addUpdateAction(['hidden', node, val]);
    } else if (key === 'update' && typeof val === 'function') {
        ctx!.addUpdateAction(['update', node, val]);
    } else if (key === 'init') {
        // no-op
    } else {
        node[key] = val;
    }
};

export const buildDOM: typeof utils['buildDOM'] = utils.buildDOM = function (obj: BuildDomExpr, ctx: BuildDOMCtx): any {
    return buildDomCore(obj, 32, ctx);
};

export class JsxNode<T extends IDOM> implements IDOM {
    tag: T | string;
    attrs: Record<any, any> | undefined;
    child: any[] | undefined;
    constructor(tag: any, attrs: Record<any, any> | undefined, childs: any[] | undefined) {
        this.tag = tag;
        this.attrs = attrs;
        this.child = childs;
    }
    getDOM(): HTMLElement {
        return this.buildDom(null, 64) as any;
    }
    buildDom(ctx: BuildDOMCtx | null, ttl: number) {
        return this.buildView(ctx, ttl).getDOM();
    }
    buildView(ctx: BuildDOMCtx | null, ttl: number)
        : T extends IDOM ? T : T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement {
        if (ttl-- < 0) throw new Error('ran out of TTL');
        let view: IDOM;
        if (typeof this.tag === 'string') {
            const dom = document.createElement(this.tag);
            view = dom;
            if (this.attrs) for (const key in this.attrs) {
                if (Object.prototype.hasOwnProperty.call(this.attrs, key)) {
                    const val = this.attrs[key];
                    buildDOMHandleKey(key, val, dom, ctx, ttl);
                }
            }
        } else {
            view = this.tag;
            if (this.attrs) for (const key in this.attrs) {
                if (Object.prototype.hasOwnProperty.call(this.attrs, key)) {
                    const val = this.attrs[key];
                    if (key.startsWith("on") && view[key] instanceof Callbacks) {
                        (view[key] as Callbacks).add(val);
                    } else {
                        view[key] = val;
                    }
                }
            }
        }
        if (this.child) for (const it of this.child) {
            if (it instanceof Array) {
                it.forEach(it => view.addChild(jsxBuildCore(it, ttl, ctx) as any));
            } else {
                view.addChild(jsxBuildCore(it, ttl, ctx) as any);
            }
        }
        return view as any;
    }
    addChild(child: IDOM): void {
        if (this.child == null) this.child = [];
        this.child.push(child);
    }
}

function jsxBuildCore(node: JsxNode<any> | BuildDomExpr, ttl: number, ctx: BuildDOMCtx | null) {
    if (ttl-- < 0) throw new Error('ran out of TTL');
    var r = tryHandleValues(node, ctx);
    if (r) return r;
    if (node instanceof JsxNode) {
        return node.buildView(ctx, ttl);
    } else {
        throw new Error("Unknown node type");
    }
}

export function jsxBuild<T extends IDOM>(node: JsxNode<T>, ctx?: BuildDOMCtx): T {
    return jsxBuildCore(node, 64, ctx || new BuildDOMCtx());
}

export type JsxTag = keyof HTMLElementTagNameMap | JsxCtorTag;
export type JsxCtorTag = { new(...args): IDOM; };

export type JsxTagInstance<T> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T]
    : T extends { new(...args): infer U; } ? U extends IDOM ? JsxNode<U> : never : never;

export type JsxAttrs<T extends JsxTag> = {
    args: T extends JsxCtorTag ? ConstructorParameters<T> : never;
} & JsxTagInstance<T>;

export function jsxFactory<T extends JsxTag>(tag: T, attrs: JsxAttrs<T>, ...childs: any)
    : JsxTagInstance<T> {
    if (typeof tag === 'string') {
        return new JsxNode(tag, attrs, childs) as any;
    } else {
        const view = 'args' in attrs ?
            new (tag as any)(...attrs.args) :
            new (tag as any)();
        return new JsxNode(view, attrs, childs) as any;
    }
}

export const jsx = utils.jsx = utils.jsxFactory = jsxFactory;

export class View<T extends HTMLElement = HTMLElement> implements IDOM {
    constructor(dom?: BuildDomExpr) {
        if (dom) this.domExprCreated(dom);
    }

    static getView(obj: IDOM) { return obj instanceof View ? obj : new View(obj); }

    public parentView?: ContainerView<View> = undefined;
    public _position?: number = undefined;
    get position() { return this._position; }

    domctx = new BuildDOMCtx();
    protected _dom: T | undefined = undefined;
    public get domCreated() { return !!this._dom; }
    public get dom() {
        this.ensureDom();
        return this._dom!;
    }
    public get hidden() { return this.dom.hidden; }
    public set hidden(val: boolean) { this.dom.hidden = val; }
    public ensureDom() {
        if (!this._dom) {
            var r = this.createDom();
            this.domExprCreated(r);
        }
    }
    private domExprCreated(r: BuildDomExpr) {
        this._dom = utils.buildDOM(r, this.domctx) as T;
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
    /** Assign key-values and call `updateDom()` */
    updateWith(kv: Partial<this>) {
        utils.objectApply(this, kv);
        this.updateDom();
    }
    toggleClass(clsName: string, force?: boolean) {
        utils.toggleClass(this.dom, clsName, force);
    }
    appendView(view: View) { return this.dom.appendView(view); }
    getDOM() { return this.dom; }
    addChild(child: IDOM) {
        if (child instanceof View) {
            this.appendView(child);
        } else {
            this.dom.appendChild(utils.buildDOM(child));
        }
    }

    _onactive: Action<MouseEvent> | undefined = undefined;
    _onActiveCbs: Action<any>[] | undefined = undefined;
    get onactive() { return this._onactive; }
    set onactive(val) {
        if (!!this._onactive !== !!val) {
            if (val) {
                this._onActiveCbs = [
                    (e: MouseEvent) => {
                        this._onactive!(e);
                    },
                    (e: KeyboardEvent) => {
                        this.handleKeyDown(e, this._onactive!);
                    }
                ];
                this.dom.addEventListener('click', this._onActiveCbs[0]);
                this.dom.addEventListener('keydown', this._onActiveCbs[1]);
            } else {
                this.dom.removeEventListener('click', this._onActiveCbs![0]);
                this.dom.removeEventListener('keydown', this._onActiveCbs![1]);
                this._onActiveCbs = undefined;
            }
        }
        this._onactive = val;
    }

    handleKeyDown(e: KeyboardEvent, onactive: Action<MouseEvent | null>) {
        if (e.code === 'Enter') {
            const rect = this.dom.getBoundingClientRect();
            onactive(new MouseEvent('click', {
                clientX: rect.x, clientY: rect.y,
                relatedTarget: this.dom
            }));
            e.preventDefault();
        }
    }
}

declare global {
    interface Node {
        getDOM(): this;
        appendView(view: View);
        addChild(child: IDOM): void;
    }
}

Node.prototype.getDOM = function () { return this; };

Node.prototype.addChild = function (child) {
    this.appendChild(utils.buildDOM(child));
};

Node.prototype.appendView = function (this: Node, view: View) {
    this.appendChild(view.dom);
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
    map<TRet>(func: (lvi: T) => TRet) { return utils.arrayMap(this, func); }
    find(func: (lvi: T, idx: number) => any) { return utils.arrayFind(this, func); }
    forEach(func: (lvi: T, idx: number) => void) { return utils.arrayForeach(this, func); }
}
