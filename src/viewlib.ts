// file: viewlib.ts

import { BuildDomExpr, utils, Action, I, Callbacks, BuildDomNode, Timer, BuildDOMCtx, IDOM } from "./utils";
import { i18n } from "./I18n";

export class View implements IDOM {
    constructor(dom?: BuildDomExpr) {
        if (dom) this.domExprCreated(dom);
    }

    static getView(obj: IDOM) { return obj instanceof View ? obj : new View(obj); }

    public parentView?: ContainerView<View> = undefined;
    public _position?: number = undefined;
    get position() { return this._position; }

    domctx = new BuildDOMCtx();
    protected _dom: HTMLElement | undefined = undefined;
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
        this._dom = utils.buildDOM(r, this.domctx) as HTMLElement;
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

    _onactive: Action | undefined = undefined;
    _onActiveCbs: Action<any>[] | undefined = undefined;
    get onactive() { return this._onactive; }
    set onactive(val) {
        if (!!this._onactive !== !!val) {
            if (val) {
                this._onActiveCbs = [
                    (e: MouseEvent) => {
                        this._onactive!();
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

    handleKeyDown(e: KeyboardEvent, onactive: Action) {
        if (e.code === 'Enter') {
            onactive();
            e.preventDefault();
        }
    }
}

declare global {
    interface Node {
        appendView(view: View);
    }
    interface HTMLElement {
        getDOM(): HTMLElement;
    }
}

HTMLElement.prototype.getDOM = function () { return this; };

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
            this.dom.appendChild(view.dom);
        } else {
            items.splice(pos, 0, view);
            this.dom.insertBefore(view.dom, items[pos + 1]?.dom || null);
            for (let i = pos; i < items.length; i++) {
                items[i]._position = i;
            }
        }
    }
    removeView(view: T | number) {
        view = this._ensureItem(view);
        view.dom.remove();
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

/** DragManager is used to help exchange information between views */
export var dragManager = new class DragManager {
    /** The item being dragged */
    _currentItem: any | null = null;
    _currentArray: any[] | null = null;
    get currentItem() { return this._currentItem ?? this._currentArray?.[0] ?? null; };
    get currentArray() {
        if (this._currentItem) return [this._currentItem];
        return this._currentArray;
    }
    onDragStart = new Callbacks();
    onDragEnd = new Callbacks();
    start(item: any) {
        this._currentItem = item;
        console.log('drag start', item);
        this.onDragStart.invoke();
    }
    startArray(arr: any[]) {
        this._currentArray = arr;
        console.log('drag start array', arr);
        this.onDragStart.invoke();
    }
    end() {
        this._currentItem = null;
        console.log('drag end');
        this.onDragEnd.invoke();
    }
};

export abstract class ListViewItem extends View implements ISelectable {
    get listview() { return this.parentView as ListView<this>; }
    get selectionHelper() { return this.listview.selectionHelper; }

    get dragData() { return this.dom.textContent; }

    onDragover: ListView['onDragover'];
    onContextMenu: ListView['onContextMenu'];

    dragging?: boolean;

    private _selected: boolean = false;
    public get selected(): boolean { return this._selected; }
    public set selected(v: boolean) {
        this._selected = v;
        this.domCreated && this.updateDom();
        this.onSelectedChanged.invoke();
    }
    onSelectedChanged = new Callbacks();


    remove() {
        if (!this.listview) return;
        this.listview.remove(this);
    }

    protected postCreateDom() {
        super.postCreateDom();
        this.dom.setAttribute('role', 'listitem');
        this.dom.addEventListener('click', (ev) => {
            if (this.listview?.selectionHelper.handleItemClicked(this, ev)) return;
            this.listview?.onItemClicked?.(this);
        });
        this.dom.addEventListener('keydown', (ev) => {
            if (ev.code === 'Enter') {
                if (ev.altKey) {
                    const rect = this.dom.getBoundingClientRect();
                    const mouseev = new MouseEvent('contextmenu', {
                        clientX: rect.left, clientY: rect.top,
                        relatedTarget: this.dom
                    });
                    (this.onContextMenu ?? this.listview?.onContextMenu)?.(this, mouseev);
                } else {
                    if (this.listview?.selectionHelper.handleItemClicked(this, ev)) return;
                    this.listview?.onItemClicked?.(this);
                }
                ev.preventDefault();
            } else if (this.listview && (ev.code === 'ArrowUp' || ev.code === 'ArrowDown')) {
                var offset = ev.code === 'ArrowUp' ? -1 : 1;
                var item = this.listview.get(this.position! + offset);
                if (item) {
                    item.dom.focus();
                    ev.preventDefault();
                }
            }
        });
        this.dom.addEventListener('contextmenu', (ev) => {
            (this.onContextMenu ?? this.listview?.onContextMenu)?.(this, ev);
        });
        this.dom.addEventListener('dragstart', (ev) => {
            if (!(this.dragging ?? this.listview?.dragging)) {
                ev.preventDefault();
                return;
            }
            var arr: ListViewItem[] = [];
            if (this.selected) {
                arr = [...this.selectionHelper.selectedItems];
                arr.sort((a, b) => a.position! - b.position!); // remove this line to get a new feature!
            } else {
                arr = [this];
            }
            dragManager.startArray(arr);
            ev.dataTransfer!.setData('text/plain', arr.map(x => x.dragData).join('\r\n'));
            arr.forEach(x => x.dom.style.opacity = '.5');
        });
        this.dom.addEventListener('dragend', (ev) => {
            var arr = dragManager.currentArray as ListViewItem[];
            dragManager.end();
            ev.preventDefault();
            arr.forEach(x => x.dom.style.opacity = '');
        });
        this.dom.addEventListener('dragover', (ev) => {
            this.dragHandler(ev, 'dragover');
        });
        this.dom.addEventListener('dragenter', (ev) => {
            this.dragHandler(ev, 'dragenter');
        });
        this.dom.addEventListener('dragleave', (ev) => {
            this.dragHandler(ev, 'dragleave');
        });
        this.dom.addEventListener('drop', (ev) => {
            this.dragHandler(ev, 'drop');
        });
    }
    // https://stackoverflow.com/questions/7110353
    private enterctr = 0;
    private dragoverPlaceholder: [HTMLElement, 'move' | 'move-after'] | null = null;
    dragHandler(ev: DragEvent, type: string) {
        const item = dragManager.currentItem;
        let items = dragManager.currentArray! as ListViewItem[];
        const drop = type === 'drop';
        const arg: DragArg<ListViewItem> = {
            source: item, target: this,
            sourceItems: items,
            event: ev, drop: drop,
            accept: false
        };
        if (item instanceof ListViewItem) {
            if (this.listview?.moveByDragging && item.listview === this.listview) {
                ev.preventDefault();
                arg.accept = (items.indexOf(this) === -1) ? 'move' : true;
                if (arg.accept === 'move' && ev.clientY - this.dom.getBoundingClientRect().top > this.dom.offsetHeight / 2)
                    arg.accept = 'move-after';
                if (!drop) {
                    ev.dataTransfer!.dropEffect = 'move';
                } else {
                    if (items.indexOf(this) === -1) {
                        let newpos = this.position!;
                        if (arg.accept == 'move-after') newpos++;
                        for (const it of items) {
                            if (it !== this) {
                                if (newpos > it.position!) newpos--;
                                this.listview.move(it, newpos);
                                newpos++;
                            }
                        }
                    }
                }
            }
        }
        const onDragover = this.onDragover ?? this.listview?.onDragover;
        if (!arg.accept && onDragover) {
            onDragover(arg);
            if (drop || arg.accept) ev.preventDefault();
        }
        const onContextMenu = this.onContextMenu ?? this.listview?.onContextMenu;
        if (!arg.accept && item === this && onContextMenu) {
            if (drop) onContextMenu(this, ev);
            else ev.preventDefault();
        }
        if (type === 'dragenter' || type == 'dragover' || type === 'dragleave' || drop) {
            if (type === 'dragenter') {
                this.enterctr++;
            } else if (type === 'dragleave') {
                this.enterctr--;
            } else if (type === 'drop') {
                this.enterctr = 0;
            }
            let hover = this.enterctr > 0;
            this.toggleClass('dragover', hover);
            arg.event.stopPropagation
            let placeholder = hover && (arg.accept === 'move' || arg.accept === 'move-after') && arg.accept;
            if (placeholder != (this.dragoverPlaceholder?.[1] ?? false)) {
                this.dragoverPlaceholder?.[0].remove();
                this.dragoverPlaceholder = null;
                if (placeholder) {
                    this.dragoverPlaceholder = [
                        utils.buildDOM({ tag: 'div.dragover-placeholder' }) as HTMLElement,
                        placeholder
                    ];
                    var before = this.dom as Element;
                    if (arg.accept === 'move-after') before = before.nextElementSibling!;
                    this.dom.parentElement!.insertBefore(this.dragoverPlaceholder[0], before);
                }
            }
        }
    };
}

interface DragArg<T> {
    source: ListViewItem, target: T, drop: boolean,
    sourceItems: ListViewItem[],
    accept: boolean | 'move' | 'move-after', event: DragEvent;
}

export class ListView<T extends ListViewItem = ListViewItem> extends ContainerView<T> implements Iterable<T> {
    // private items: Array<T> = [];
    onItemClicked: (item: T) => void;
    /**
     * Allow user to drag an item.
     */
    dragging = false;
    /**
     * Allow user to drag an item and change its position.
     */
    moveByDragging = false;

    selectionHelper = new SelectionHelper<T>();

    onItemMoved: (item: T, from: number) => void;
    /** 
     * When dragover or drop
     */
    onDragover: (arg: DragArg<T>) => void;
    onContextMenu: (item: ListViewItem, ev: MouseEvent) => void;
    constructor(container?: BuildDomExpr) {
        super(container);
        this.selectionHelper.itemProvider = this.get.bind(this);
    }
    protected postCreateDom() {
        super.postCreateDom();
        this.dom.setAttribute('role', 'list');
    }
    add(item: T, pos?: number) {
        this.addView(item, pos);
        if (this.dragging) item.dom.draggable = true;
    }
    remove(item: T | number, keepSelected?: boolean) {
        item = this._ensureItem(item);
        if (!keepSelected && item.selected) this.selectionHelper.toggleItemSelection(item);
        this.removeView(item);
    }
    move(item: T | number, newpos: number) {
        item = this._ensureItem(item);
        this.remove(item, true);
        this.add(item, newpos);
        this.onItemMoved(item, item.position!);
    }
    /** Remove all items */
    removeAll() {
        while (this.length) this.remove(this.length - 1);
    }
    /** Remove all items and all DOM children */
    clear() {
        this.removeAll();
        utils.clearChildren(this.dom);
    }
    ReplaceChild(dom: IDOM) {
        this.clear();
        this.dom.appendChild(dom.getDOM());
    }
}

export interface ISelectable {
    selected: boolean;
    position?: number;
}

export class SelectionHelper<TItem extends ISelectable> {
    _enabled: boolean = false;
    get enabled() { return this._enabled; }
    set enabled(val) {
        if (!!val === !!this._enabled) return;
        this._enabled = val;
        while (this.selectedItems.length)
            this.toggleItemSelection(this.selectedItems[0], false);
        this.lastToggledItem = null;
        this.onEnabledChanged.invoke();
    }
    onEnabledChanged = new Callbacks();

    itemProvider: ((pos: number) => TItem) | null = null;

    ctrlForceSelect = false;

    selectedItems = [] as TItem[];
    onSelectedItemsChanged = new Callbacks<(action: 'add' | 'remove', item: TItem) => void>();
    get count() { return this.selectedItems.length; }

    /** For shift-click */
    lastToggledItem: TItem | null = null;

    /** Returns true if it's handled by the helper. */
    handleItemClicked(item: TItem, ev: MouseEvent): boolean {
        if (!this.enabled) {
            if (!this.ctrlForceSelect || !ev.ctrlKey) return false;
            this.enabled = true;
        }
        if (ev.shiftKey && this.lastToggledItem && this.itemProvider) {
            var toSelect = !!this.lastToggledItem.selected;
            var start = item.position!, end = this.lastToggledItem.position!;
            if (start > end) [start, end] = [end, start];
            for (let i = start; i <= end; i++) {
                this.toggleItemSelection(this.itemProvider(i), toSelect);
            }
            this.lastToggledItem = item;
        } else {
            this.toggleItemSelection(item);
        }
        return true;
    }

    toggleItemSelection(item: TItem, force?: boolean) {
        if (force !== undefined && force === !!item.selected) return;
        if (item.selected) {
            item.selected = false;
            this.selectedItems.remove(item);
            this.onSelectedItemsChanged.invoke('remove', item);
        } else {
            item.selected = true;
            this.selectedItems.push(item);
            this.onSelectedItemsChanged.invoke('add', item);
        }
        this.lastToggledItem = item;
        if (this.count === 0 && this.ctrlForceSelect) this.enabled = false;
    }
}

export class ItemActiveHelper<T extends View> {
    funcSetActive = (item: T, val: boolean) => item.toggleClass('active', val);
    current: T | null = null;
    constructor(init?: Partial<ItemActiveHelper<T>>) {
        utils.objectApply(this, init);
    }
    set(item: T | null) {
        if (this.current) this.funcSetActive(this.current, false);
        this.current = item;
        if (this.current) this.funcSetActive(this.current, true);
    }
}

type SectionActionOptions = { text: string, onclick: Action; };

export class Section extends View {
    titleDom: HTMLSpanElement;
    constructor(arg?: { title?: string, content?: IDOM, actions?: SectionActionOptions[]; }) {
        super();
        this.ensureDom();
        if (arg) {
            if (arg.title) this.setTitle(arg.title);
            if (arg.content) this.setContent(arg.content);
            if (arg.actions) arg.actions.forEach(x => this.addAction(x));
        }
    }
    createDom(): BuildDomExpr {
        return {
            _ctx: this,
            tag: 'div.section',
            child: [
                {
                    tag: 'div.section-header',
                    child: [
                        { tag: 'span.section-title', _key: 'titleDom' }
                    ]
                }
                // content element(s) here
            ]
        };
    }
    setTitle(text: string) {
        this.titleDom.textContent = text;
    }
    setContent(view: IDOM) {
        var dom = this.dom;
        var firstChild = dom.firstChild;
        while (dom.lastChild !== firstChild) dom.removeChild(dom.lastChild!);
        dom.appendChild(view.getDOM());
    }
    addAction(arg: SectionActionOptions) {
        var view = new View({
            tag: 'div.section-action.clickable',
            text: arg.text,
            tabIndex: 0
        });
        view.onactive = arg.onclick;
        this.titleDom.parentElement!.appendChild(view.dom);
    }
}

type LoadingIndicatorState = 'normal' | 'running' | 'error';

export class LoadingIndicator extends View {
    constructor(init?: Partial<LoadingIndicator>) {
        super();
        if (init) utils.objectApply(this, init);
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
            _ctx: this,
            tag: 'div.loading-indicator',
            child: [{
                tag: 'div.loading-indicator-inner',
                child: [{ tag: 'div.loading-indicator-text', _key: '_textdom' }]
            }],
            onclick: (e) => this.onclick && this.onclick(e)
        };
    }
    postCreateDom() {
        this.reset();
    }
}

export class Overlay extends View {
    createDom() {
        return { tag: 'div.overlay' };
    }
    setCenterChild(centerChild: boolean) {
        this.toggleClass('centerchild', centerChild);
        return this;
    }
    setNoBg(nobg: boolean) {
        this.toggleClass('nobg', nobg);
        return this;
    }
}

export class EditableHelper {
    editing = false;
    beforeEdit: string | null = null;
    element: HTMLElement;
    onComplete: ((newName: string) => void) | null = null;
    constructor(element: HTMLElement) {
        this.element = element;
    }
    startEdit(onComplete?: this['onComplete']) {
        if (this.editing) return;
        this.editing = true;
        var ele = this.element;
        var beforeEdit = this.beforeEdit = ele.textContent!;
        utils.toggleClass(ele, 'editing', true);
        var input = utils.buildDOM({
            tag: 'input', type: 'text', value: beforeEdit
        }) as HTMLInputElement;
        while (ele.firstChild) ele.removeChild(ele.firstChild);
        ele.appendChild(input);
        input.select();
        input.focus();
        var stopEdit = () => {
            this.editing = false;
            utils.toggleClass(ele, 'editing', false);
            events.forEach(x => x.remove());
            input.remove();
            this.onComplete?.(input.value);
            onComplete?.(input.value);
        };
        var events = [
            utils.addEvent(input, 'keydown', (evv) => {
                if (evv.code === 'Enter') {
                    stopEdit();
                    evv.preventDefault();
                }
            }),
            utils.addEvent(input, 'focusout', (evv) => { stopEdit(); }),
        ];
    }
    startEditAsync() {
        return new Promise<string>((resolve) => this.startEdit(resolve));
    }
}

export class MenuItem extends ListViewItem {
    text: string = '';
    cls: 'normal' | 'dangerous' = 'normal';
    onclick: Action;
    constructor(init: Partial<MenuItem>) {
        super();
        utils.objectApply(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'div.item.no-selection',
            tabIndex: 0
        };
    }
    postCreateDom() {
        super.postCreateDom();
        this.onactive = () => {
            if (this.parentView instanceof ContextMenu) {
                if (!this.parentView.keepOpen) this.parentView.close();
            }
            this.onclick?.();
        };
    }
    private _lastcls;
    updateDom() {
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
    constructor(init: Partial<MenuLinkItem>) {
        super(init);
        utils.objectApply(this, init);
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
    constructor(init: Partial<MenuInfoItem>) {
        super(init);
        utils.objectApply(this, init);
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
    private _onclose: Action | null = null;
    private _originalFocused: Element | null = null;
    constructor(items?: MenuItem[]) {
        super({ tag: 'div.context-menu', tabIndex: 0 });
        items?.forEach(x => this.add(x));
    }
    show(arg: { x: number, y: number; } | { ev: MouseEvent; }) {
        if ('ev' in arg) arg = {
            x: arg.ev.pageX,
            y: arg.ev.pageY
        };
        this.close();
        this._visible = true;
        if (this.useOverlay) {
            if (!this.overlay) {
                this.overlay = new Overlay();
                this.overlay.dom.style.background = 'rgba(0, 0, 0, .1)';
                this.overlay.dom.addEventListener('mousedown', (ev) => {
                    if (ev.eventPhase !== Event.AT_TARGET) return;
                    ev.preventDefault();
                    this.close();
                });
            }
            this.overlay.appendView(this);
            document.body.appendChild(this.overlay.dom);
        } else {
            document.body.appendChild(this.dom);
        }
        this._originalFocused = document.activeElement;
        this.dom.focus();
        var onfocusout = (e) => {
            !this.dom.contains(e.relatedTarget as HTMLElement) && this.close();
        };
        var onkeydown = (e: KeyboardEvent) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                this.close();
            }
        };
        this.dom.addEventListener('focusout', onfocusout);
        this.dom.addEventListener('keydown', onkeydown);
        this._onclose = () => {
            this.dom.removeEventListener('focusout', onfocusout);
            this.dom.removeEventListener('keydown', onkeydown);
        };
        var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
        if (arg.x + width > document.body.offsetWidth) arg.x -= width;
        if (arg.y + height > document.body.offsetHeight) arg.y -= height;
        if (arg.x < 0) arg.x = 0;
        if (arg.y < 0) arg.y = 0;
        this.dom.style.left = arg.x + 'px';
        this.dom.style.top = arg.y + 'px';
    }
    close() {
        if (this._visible) {
            this._visible = false;
            this._onclose?.();
            this._onclose = null;
            this._originalFocused?.['focus']?.();
            this._originalFocused = null;
            if (this.overlay) utils.fadeout(this.overlay.dom);
            utils.fadeout(this.dom);
        }
    }
}

export class Dialog extends View {
    overlay: Overlay;
    domheader: HTMLElement;
    content = new ContainerView({ tag: 'div.dialog-content' });
    shown = false;

    btnTitle = new TabBtn({ active: true, clickable: false });
    btnClose = new TabBtn({ text: I`Close`, right: true });

    title = 'Dialog';
    allowClose = true;
    showCloseButton = true;
    onShown = new Callbacks<Action>();
    onClose = new Callbacks<Action>();
    autoFocus: View;

    focusTrap = new View({ tag: 'div.focustrap', tabIndex: 0 });

    static defaultParent: DialogParent;

    get width() { return this.dom.style.width; }
    set width(val) { this.dom.style.width = val; }

    get contentFlex() { return this.content.dom.classList.contains('flex'); }
    set contentFlex(val) { this.content.toggleClass('flex', !!val); }

    get resizable() { return this.dom.classList.contains('resize'); }
    set resizable(val) { this.toggleClass('resize', !!val); }

    constructor() {
        super();
        this.btnClose.onClick.add(() => this.allowClose && this.close());
    }
    createDom(): BuildDomExpr {
        return {
            _ctx: this,
            _key: 'dialog',
            tag: 'div.dialog',
            tabIndex: 0,
            style: 'width: 300px',
            child: [
                {
                    _key: 'domheader',
                    tag: 'div.dialog-title',
                    child: [
                        { tag: 'div', style: 'clear: both;' }
                    ]
                },
                this.content,
                this.focusTrap
            ]
        };
    }
    postCreateDom() {
        super.postCreateDom();
        this.addBtn(this.btnTitle);
        this.addBtn(this.btnClose);
        this.overlay = new Overlay().setCenterChild(true).setNoBg(true);
        this.overlay.dom.appendView(this);
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
            utils.listenPointerEvents(this.domheader, (e) => {
                if (e.action === 'down') {
                    if (e.ev.target !== this.domheader && e.ev.target !== this.btnTitle.dom) return;
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
                    const pageX = utils.numLimit(e.point.pageX, rect.left, rect.right);
                    const pageY = utils.numLimit(e.point.pageY, rect.top, rect.bottom);
                    this.setOffset(pageX - offset.x, pageY - offset.y);
                }
            });
        }

        this.dom.addEventListener('resize', () => {
            if (this.dom.style.width)
                this.width = this.dom.style.width;
        });
        this.focusTrap.dom.addEventListener('focus', (ev) => {
            this.dom.focus();
        });
    }
    updateDom() {
        this.btnTitle.updateWith({ text: this.title });
        this.btnTitle.hidden = !this.title;
        this.btnClose.hidden = !(this.allowClose && this.showCloseButton);
    }
    addBtn(btn: TabBtn) {
        this.ensureDom();
        this.domheader.insertBefore(btn.dom, this.domheader.lastChild);
    }
    addContent(view: IDOM, replace?: boolean) {
        this.ensureDom();
        if (replace) this.content.removeAllView();
        this.content.appendView(View.getView(view));
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
    show() {
        if (this.shown) return;
        this.shown = true;
        this._cancelFadeout?.();
        this.ensureDom();
        Dialog.defaultParent.onDialogShowing(this);
        this.dom.focus();
        (this.autoFocus || this).dom.focus();
        this.onShown.invoke();
    }
    private _cancelFadeout: Action;
    close() {
        if (!this.shown) return;
        this.shown = false;
        this.onClose.invoke();
        this._cancelFadeout = utils.fadeout(this.overlay.dom).cancel;
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

export class DialogParent extends View {
    bgOverlay = new Overlay();
    dialogCount = 0;
    _cancelFadeout: Action;

    constructor(dom?: BuildDomExpr) {
        super(dom ?? document.body);
    }
    onDialogShowing(dialog: Dialog) {
        if (this.dialogCount++ === 0) {
            this._cancelFadeout?.();
            this.appendView(this.bgOverlay);
        }
        this.appendView(dialog.overlay);
    }
    onDialogClosing(dialog: Dialog) {
        if (--this.dialogCount === 0) {
            this._cancelFadeout = utils.fadeout(this.bgOverlay.dom).cancel;
        }
    }
}

export class TabBtn extends View {
    text: string = '';
    clickable = true;
    active = false;
    right = false;
    onclick: Action;
    onClick = new Callbacks<Action>();
    constructor(init?: Partial<TabBtn>) {
        super();
        utils.objectApply(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'span.tab.no-selection'
        };
    }
    postCreateDom() {
        this.onactive = () => {
            this.onclick?.();
            this.onClick.invoke();
        };
    }
    updateDom() {
        this.dom.textContent = this.text;
        this.dom.tabIndex = this.clickable ? 0 : -1;
        this.toggleClass('clickable', this.clickable);
        this.toggleClass('active', this.active);
        this.dom.style.float = this.right ? 'right' : 'left';
    }
}

export class InputView extends View {
    dom: HTMLInputElement;
    multiline: boolean = false;
    type = 'text';
    placeholder = '';
    get value() { return this.dom.value; }
    set value(val) { this.dom.value = val; }
    constructor(init?: Partial<InputView>) {
        super();
        utils.objectApply(this, init);
    }
    createDom() {
        return this.multiline ? { tag: 'textarea.input-text' } : { tag: 'input.input-text' };
    }
    updateDom() {
        super.updateDom();
        if (!this.multiline) this.dom.type = this.type;
        this.dom.placeholder = this.placeholder;
    }
}

export class TextView extends View {
    get text() { return this.dom.textContent; }
    set text(val) { this.dom.textContent = val; }
}

export class ButtonView extends TextView {
    disabled: boolean = false;
    get onclick() { return this.onactive; }
    set onclick(val) { this.onactive = val; }
    type: 'normal' | 'big' = 'normal';
    constructor(init?: Partial<ButtonView>) {
        super();
        utils.objectApply(this, init);
        this.updateDom();
    }
    createDom(): BuildDomExpr {
        return { tag: 'div.btn', tabIndex: 0 };
    }
    updateDom() {
        super.updateDom();
        this.toggleClass('disabled', this.disabled);
        this.toggleClass('btn-big', this.type === 'big');
    }
}

export class LabeledInput extends View {
    label: string = '';
    type = 'text';
    input = new InputView();
    get dominput(): HTMLInputElement { return this.input.dom as any; }
    get value() { return this.dominput.value; }
    set value(val) { this.dominput.value = val; }
    constructor(init?: Partial<LabeledInput>) {
        super();
        utils.objectApply(this, init);
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
        this.input.type = this.type;
        this.input.domCreated && this.input.updateDom();
    }
}

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
    constructor(init?: Partial<Toast>) {
        super();
        utils.objectApply(this, init);
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
        utils.fadeout(this.dom)
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

export class MessageBox extends Dialog {
    allowClose = false;
    title = 'Message';
    result: 'none' | 'no' | 'yes' | 'ok' | 'cancel' = 'none';
    addResultBtns(results: this['result'][]) {
        for (const r of results) {
            this.addBtnWithResult(new TabBtn({ text: i18n.get('msgbox_' + r), right: true }), r);
        }
        return this;
    }
    setTitle(title: string) {
        this.title = title;
        if (this.domCreated) this.updateDom();
        return this;
    }
    addText(text: string) {
        this.addContent(new TextView({ tag: 'div.messagebox-text', textContent: text }));
        return this;
    }
    allowCloseWithResult(result: this['result'], showCloseButton?: boolean) {
        this.result = result;
        this.allowClose = true;
        this.showCloseButton = !!showCloseButton;
        if (this.domCreated) this.updateDom();
        return this;
    }
    addBtnWithResult(btn: TabBtn, result: this['result']) {
        btn.onClick.add(() => { this.result = result; this.close(); });
        this.addBtn(btn);
        return this;
    }
    async showAndWaitResult() {
        this.show();
        await this.waitClose();
        return this.result;
    }
}