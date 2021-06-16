import { Action, Callbacks, Func, FuncOrVal, Ref } from "./utils";
import { View } from "./view";

// BuildDOM types & implementation:
export type BuildDomExpr = string | BuildDomNode | HTMLElement | Node | IDOM;

export type IDOM = Node | View | IDOMInstance;

export interface IDOMInstance {
    /** @deprecated Use the static method `View.getDOM()` instaed. */
    getDOM(): HTMLElement;
    /** @deprecated Use the static method `View.addChild()` instead. */
    addChild(child: BuildDomExpr): void;
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

    ref?: Ref<HTMLElement | Text | Node>;

    _ctx?: BuildDOMCtx | {};

    _id?: string;
    /** @deprecated Use `_id` instead */
    _key?: string;

    [key: string]: any;
}

export class BuildDOMCtx {
    dict: Record<string, HTMLElement>;
    actions: DOMUpdateAction[];
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
    addUpdateAction(action: DOMUpdateAction) {
        if (!this.actions) this.actions = [];
        this.actions.push(action);
        // BuildDOMCtx.executeAction(action);
    }
    update() {
        if (!this.actions) return;
        for (const a of this.actions) {
            a.run();
        }
    }
}

interface DOMUpdateAction {
    run(): void;
}

class TextAction implements DOMUpdateAction {
    constructor(readonly node: Node, readonly func: Func<string>) { }
    run() {
        this.node.textContent = this.func();
    }
}

class HiddenAction implements DOMUpdateAction {
    constructor(readonly node: HTMLElement, readonly func: Func<boolean>) { }
    run() {
        this.node.hidden = this.func();
    }
}

class UpdateAction implements DOMUpdateAction {
    constructor(readonly node: HTMLElement, readonly func: Action<HTMLElement>) { }
    run() {
        this.func(this.node);
    }
}

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
            ctx?.addUpdateAction(new TextAction(node, obj));
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
    } else if (key === '_id' || key === '_key') {
        ctx!.setDict(val, node);
    } else if (key === 'ref') {
        (val as Ref<any>).value = node;
    } else if (key === 'text') {
        if (typeof val === 'function') {
            ctx!.addUpdateAction(new TextAction(node, val));
        } else {
            node.textContent = val;
        }
    } else if (key === 'class') {
        node.className = val;
    } else if (key === 'hidden' && typeof val === 'function') {
        ctx!.addUpdateAction(new HiddenAction(node, val));
    } else if (key === 'update' && typeof val === 'function') {
        ctx!.addUpdateAction(new UpdateAction(node, val));
    } else if (key === 'init') {
        // no-op
    } else {
        node[key] = val;
    }
};

/** 
 * Build a DOM tree from a JavaScript object.
 * @example
 * buildDOM({
 *     tag: 'div.item#firstitem',
 *     onclick: () => console.info('clicked'),
 *     child: [
 *         'Name: ',
 *         { tag: 'span.name', text: name },
 *     ],
 * });
 */
export function buildDOM<T extends BuildDomReturn = BuildDomReturn>(obj: BuildDomExpr, ctx?: BuildDOMCtx): T {
    return buildDomCore(obj, 32, ctx || null) as T;
};

export class JsxNode<T extends IDOM> implements IDOMInstance {
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
            // tag is an HTML tag
            const dom = document.createElement(this.tag);
            view = dom;
            if (this.attrs) {
                for (const key in this.attrs) {
                    if (Object.prototype.hasOwnProperty.call(this.attrs, key)) {
                        const val = this.attrs[key];
                        buildDOMHandleKey(key, val, dom, ctx, ttl);
                    }
                }
                const init = this.attrs['init'];
                if (init) init(dom);
            }
        } else {
            // tag is a View
            view = this.tag;
            if (this.attrs) {
                let init: Action<IDOM> | null = null;
                for (const key in this.attrs) {
                    if (Object.prototype.hasOwnProperty.call(this.attrs, key)) {
                        const val = this.attrs[key];
                        if (key == "init") {
                            init = val;
                        } else if (key == "ref") {
                            (val as Ref<any>).value = view;
                        } else if (key.startsWith("on") && view[key] instanceof Callbacks) {
                            (view[key] as Callbacks).add(val);
                        } else {
                            view[key] = val;
                        }
                    }
                }
                if (init) init(view);
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
    if (node instanceof View) return node;
    var r = tryHandleValues(node, ctx);
    if (r) return r;
    if (node instanceof JsxNode) {
        return node.buildView(ctx, ttl);
    } else {
        console.error("Unknown node type", node);
        throw new Error("Unknown node type");
    }
}

export function jsxBuild<T extends IDOM>(node: JsxNode<T>, ctx?: BuildDOMCtx): T {
    return jsxBuildCore(node, 64, ctx || new BuildDOMCtx());
}

export type JsxTag = JsxDOMTag | JsxCtorTag;
export type JsxCtorTag = new (...args) => IDOM;;
export type JsxDOMTag = keyof HTMLElementTagNameMap;

export type JsxTagInstance<T> =
    T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] :
    T extends (new (...args) => infer U) ? U extends IDOM ? U :
    never : never;

export type JsxAttrs<T extends JsxTag> =
    T extends JsxCtorTag ? JsxCtorAttrs<T> :
    T extends JsxDOMTag ? JsxDOMAttrs<T> :
    never;

export type JsxCtorAttrs<T extends JsxCtorTag> = {
    args?: ConstructorParameters<T>;
    init?: Action<JsxTagInstance<T>>;
} & JsxTagInstance<T>;

export type JsxDOMAttrs<T extends JsxDOMTag> = Omit<BuildDomNode, "key"> & Partial<JsxTagInstance<T>>;

export function jsxFactory<T extends JsxTag, TInstance extends IDOM = JsxTagInstance<T>>(tag: T, attrs: JsxAttrs<T>, ...childs: any)
    : JsxNode<TInstance> {
    if (typeof tag === 'string') {
        return new JsxNode(tag, attrs, childs) as any;
    } else {
        const view = attrs?.args ?
            new (tag as any)(...attrs.args) :
            new (tag as any)();
        return new JsxNode(view, attrs, childs) as any;
    }
}

export const jsx = jsxFactory;
