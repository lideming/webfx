// file: viewlib.ts

import { utils, Action, Callbacks, Timer, ObjectInit } from "./utils";
import { BuildDomExpr, BuildDomNode, ContainerView, IDOM, View } from "./view";
import { I, i18n } from "./I18n";
import css from "../style.css";

export function getWebfxCss() { return css; }
let cssInjected = false;
export function injectWebfxCss() {
    if (!cssInjected) {
        utils.injectCss(getWebfxCss(), { tag: 'style.webfx-injected-style' });
        cssInjected = true;
    }
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
        this._currentArray = null;
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

    dragging?: boolean = undefined;

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
                const direction = ev.code === 'ArrowUp' ? -1 : 1;
                const item = this.listview.get(this.position! + direction);
                if (item) {
                    item.dom.focus();
                    ev.preventDefault();
                }
            } else if (this.listview && (ev.code === 'PageUp' || ev.code === 'PageDown')) {
                const dir = ev.code === 'PageUp' ? -1 : 1;
                const scrollBox = this.listview.scrollBox;
                const targetY = dir > 0 ? (this.dom.offsetTop + scrollBox.offsetHeight)
                    : (this.dom.offsetTop + this.dom.offsetHeight - scrollBox.offsetHeight);
                const len = this.listview.length;
                let item = this;
                while (dir > 0 ? (targetY > item.dom.offsetTop + item.dom.offsetHeight)
                    : (targetY < item.dom.offsetTop)) {
                    const nextIdx = item.position! + dir;
                    if (nextIdx < 0 || nextIdx >= len) break;
                    item = this.listview.get(nextIdx);
                }
                if (item && item !== this) {
                    item.dom.focus();
                    ev.preventDefault();
                }
            } else if (this.listview && (ev.code === 'Home' || ev.code === 'End')) {
                this.listview.get(ev.code == 'Home' ? 0 : (this.listview.length - 1)).dom.focus();
                ev.preventDefault();
            } else if (this.listview && this.listview.selectionHelper.handleItemKeyDown(this, ev)) {
                // noop
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
                const selfInside = (items.indexOf(this) >= 0);
                const after = ev.clientY - this.dom.getBoundingClientRect().top > this.dom.offsetHeight / 2;
                if (!(selfInside && drop))
                    arg.accept = after ? 'move-after' : 'move';
                if (!drop) {
                    ev.dataTransfer!.dropEffect = 'move';
                } else {
                    if (items.indexOf(this) === -1) {
                        let newpos = this.position!;
                        if (after) newpos++;
                        for (const it of items) {
                            if (it !== this) {
                                if (newpos > it.position!) newpos--;
                                this.listview.move(it as this, newpos);
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
        if (!arg.accept && items.indexOf(this) >= 0 && onContextMenu) {
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
    onItemClicked: null | ((item: T) => void) = null;
    /**
     * Allow user to drag an item.
     */
    dragging = false;
    /**
     * Allow user to drag an item and change its position.
     */
    moveByDragging = false;

    selectionHelper = new SelectionHelper<T>();

    private _scrollBox: HTMLElement | null = null;

    get scrollBox() { return this._scrollBox || this.dom; }
    set scrollBox(val: HTMLElement) { this._scrollBox = val; }

    onItemMoved: null | ((item: T, from: number) => void) = null;
    /** 
     * When dragover or drop
     */
    onDragover: null | ((arg: DragArg<T>) => void) = null;
    onContextMenu: null | ((item: ListViewItem, ev: MouseEvent) => void) = null;
    constructor(container?: BuildDomExpr) {
        super(container);
        this.selectionHelper.itemProvider = this;
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
        this.onItemMoved?.(item, item.position!);
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

    itemProvider: null | {
        get: (pos: number) => TItem;
        length: number;
    } = null;

    ctrlForceSelect = false;

    selectedItems: TItem[] = [];
    onSelectedItemsChanged = new Callbacks<(action: 'add' | 'remove', item: TItem) => void>();
    get count() { return this.selectedItems.length; }

    /** For shift-click */
    lastToggledItem: TItem | null = null;

    /** Returns true if it's handled by the helper. */
    handleItemClicked(item: TItem, ev: MouseEvent | KeyboardEvent): boolean {
        if (!this.enabled) {
            if (!this.ctrlForceSelect || !ev.ctrlKey) return false;
            this.enabled = true;
        }
        if (ev.shiftKey && this.lastToggledItem && this.itemProvider) {
            var toSelect = !!this.lastToggledItem.selected;
            var start = item.position!, end = this.lastToggledItem.position!;
            if (start > end) [start, end] = [end, start];
            for (let i = start; i <= end; i++) {
                this.toggleItemSelection(this.itemProvider.get(i), toSelect);
            }
            this.lastToggledItem = item;
        } else {
            this.toggleItemSelection(item);
        }
        ev.preventDefault();
        return true;
    }

    /** Returns true if it's handled by the helper. */
    handleItemKeyDown(item: TItem, ev: KeyboardEvent): boolean {
        if (!this.enabled) return false;
        if (this.itemProvider && ev.ctrlKey && ev.code === 'KeyA') {
            const len = this.itemProvider.length;
            for (let i = 0; i < len; i++) {
                this.toggleItemSelection(this.itemProvider.get(i), true);
            }
            ev.preventDefault();
            return true;
        }
        return false;
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
    constructor(init?: ObjectInit<ItemActiveHelper<T>>) {
        utils.objectInit(this, init);
    }
    set(item: T | null) {
        if (this.current === item) return;
        if (this.current) this.funcSetActive(this.current, false);
        this.current = item;
        if (this.current) this.funcSetActive(this.current, true);
    }
}

export class LazyListView<T extends ListViewItem = ListViewItem> extends ListView<T> {
    private _loaded = 0;
    private _lazy = false;
    private _slowLoading: Promise<boolean> | null = null;
    private _autoLoad: { interval: number, batchSize: number; } | null = null;
    get loaded() { return this.loaded; }
    get slowLoading() { return this._slowLoading; }
    get autoLoad() { return this._autoLoad; }
    get lazy() { return this._lazy; }
    set lazy(val) {
        this._lazy = val;
        if (!val) this.ensureLoaded(this.length - 1);
    }
    ensureLoaded(pos: number) {
        if (pos >= this.length) pos = this.length - 1;
        while (this._loaded <= pos) {
            this.dom.appendChild(this.items[this._loaded].dom);
            this._loaded++;
        }
    }
    loadNext(batchSize = 50) {
        if (this._loaded < this.length) {
            this.ensureLoaded(Math.min(this.length - 1, this._loaded + batchSize - 1));
            return true;
        }
        return false;
    }
    slowlyLoad(interval = 30, batchSize = 50, autoLoad = false) {
        if (autoLoad) this.enableAutoLoad(interval, batchSize);
        if (this._slowLoading) return this._slowLoading;
        if (this._loaded >= this.length) return Promise.resolve(true);
        return this._slowLoading = new Promise<boolean>((r) => {
            var cancel: Action;
            var cont: Action;
            var callback = () => {
                if (!this._slowLoading || !this.loadNext(batchSize)) {
                    this.lazy = !!this._autoLoad;
                    cancel();
                    r(!!this._slowLoading);
                    this._slowLoading = null;
                } else {
                    cont();
                }
            };
            if (interval == -1 && window['requestIdleCallback']) {
                let handle: number;
                cancel = () => window['cancelIdleCallback'](handle);
                cont = () => {
                    handle = window['requestIdleCallback'](callback);
                };
                cont();
            } else {
                if (interval == -1) interval = 30;
                let timer = setInterval(callback, interval);
                cancel = () => clearInterval(timer);
                cont = () => { };
            }
        });
    }
    enableAutoLoad(interval = 30, batchSize = 50) {
        this._autoLoad = { interval, batchSize };
        this.slowlyLoad(interval, batchSize);
    }
    stopLoading() {
        this._slowLoading = null;
        this._autoLoad = null;
    }
    unload() {
        this.stopLoading();
        for (let i = this._loaded - 1; i >= 0; i--) {
            this.items[i].dom.remove();
        }
        this.lazy = true;
        this._loaded = 0;
    }
    protected _insertToDom(item: T, pos: number) {
        if (!this.lazy || pos < this._loaded) {
            super._insertToDom(item, pos);
            this._loaded++;
        } else {
            if (this._autoLoad) {
                this.slowlyLoad(this._autoLoad.interval, this._autoLoad.batchSize);
            }
        }
    }
    protected _removeFromDom(item: T) {
        if (item.position! < this._loaded) {
            super._removeFromDom(item);
            this._loaded--;
        }
    }
}

type SectionActionOptions = { text: string, onclick: Action<MouseEvent>; };

export class Section extends View {
    titleView = new TextView({ tag: 'span.section-title' });
    headerView = new View({
        tag: 'div.section-header',
        child: [
            this.titleView
        ]
    });
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
                this.headerView
            ]
        };
    }
    setTitle(text: string) {
        this.titleView.text = text;
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
        view.onActive.add(arg.onclick);
        this.headerView.dom.appendChild(view.dom);
    }
}

type LoadingIndicatorState = 'normal' | 'running' | 'error';

export class LoadingIndicator extends View {
    constructor(init?: ObjectInit<LoadingIndicator>) {
        super();
        if (init) utils.objectInit(this, init);
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
            onclick: (e) => this.onclick?.(e)
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
    setFixed(fixed: boolean) {
        this.toggleClass('fixed', fixed);
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
            utils.listenEvent(input, 'keydown', (evv) => {
                if (evv.code === 'Enter') {
                    stopEdit();
                    evv.preventDefault();
                }
            }),
            utils.listenEvent(input, 'focusout', (evv) => { stopEdit(); }),
        ];
    }
    startEditAsync() {
        return new Promise<string>((resolve) => this.startEdit(resolve));
    }
}

export class MenuItem extends ListViewItem {
    text: string = '';
    cls: 'normal' | 'dangerous' = 'normal';
    constructor(init: ObjectInit<MenuItem>) {
        super();
        utils.objectInit(this, init);
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
                if (!this.parentView.keepOpen) this.parentView.close();
            }
        });
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
    constructor(init: ObjectInit<MenuLinkItem>) {
        super(init);
        utils.objectInit(this, init);
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
        utils.objectInit(this, init);
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
            console.warn("[ContextMenu] show() called when it's already visible.");
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
            document.body.appendChild(this.overlay.dom);
        } else {
            document.body.appendChild(this.dom);
        }
        this._originalFocused = document.activeElement;
        this.dom.focus();
        var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
        var parentWidth = document.body.offsetWidth;
        var parentHeight = document.body.offsetHeight;
        if (this.useOverlay) {
            const overlayDom = this.overlay!.dom;
            parentWidth = overlayDom.offsetWidth;
            parentHeight = overlayDom.offsetHeight;
        }
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

    static _defaultParent: DialogParent | null = null;
    static get defaultParent(): DialogParent {
        if (!Dialog._defaultParent) Dialog._defaultParent = new DialogParent();
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
        this.content.addView(View.getView(view));
    }
    addChild(view: IDOM) {
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
        if (this.shown) return;
        this.shown = true;
        this._cancelFadeout?.();
        this.ensureDom();
        Dialog.defaultParent.onDialogShowing(this);
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
    private _cancelFadeout: Action;
    close() {
        if (!this.shown) return;
        this.shown = false;
        this.setTransformOrigin(undefined);
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
    fixed = false;
    private _cancelFadeout: Action | null = null;

    constructor(dom: BuildDomExpr = document.body) {
        super(dom);
        if (dom === document.body) {
            this.fixed = true;
        }
    }
    onDialogShowing(dialog: Dialog) {
        if (this.dialogCount++ === 0) {
            this._cancelFadeout?.();
            this.bgOverlay.setFixed(this.fixed);
            this.appendView(this.bgOverlay);
        }
        dialog.overlay.setFixed(this.fixed);
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
    constructor(init?: ObjectInit<TabBtn>) {
        super();
        utils.objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return {
            tag: 'span.tab.no-selection'
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
    multiline: boolean = false;
    type = 'text';
    placeholder = '';
    get value() { return (this.dom as HTMLInputElement).value; }
    set value(val) { (this.dom as HTMLInputElement).value = val; }
    constructor(init?: ObjectInit<InputView>) {
        super();
        utils.objectInit(this, init);
    }
    createDom(): BuildDomExpr {
        return this.multiline ? { tag: 'textarea.input-text' } : { tag: 'input.input-text' };
    }
    updateDom() {
        super.updateDom();
        if (this.dom instanceof HTMLInputElement) {
            this.dom.type = this.type;
            this.dom.placeholder = this.placeholder;
        }
    }
}

export class TextView extends View {
    get text() { return this.dom.textContent; }
    set text(val) { this.dom.textContent = val; }
}

export class ButtonView extends TextView {
    disabled: boolean = false;
    type: 'normal' | 'big' = 'normal';
    constructor(init?: ObjectInit<ButtonView>) {
        super();
        utils.objectInit(this, init);
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

export class LabeledInputBase<T extends View> extends View {
    label: string = '';
    input: T;
    get dominput(): HTMLInputElement { return this.input.dom as any; }
    constructor(init?: ObjectInit<LabeledInputBase<T>>) {
        super();
        utils.objectInit(this, init);
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
        this.input.domCreated && this.input.updateDom();
    }
}

export class LabeledInput extends LabeledInputBase<InputView> {
    type: string;
    get value() { return this.dominput.value; }
    set value(val) { this.dominput.value = val; }
    constructor(init?: ObjectInit<LabeledInput>) {
        super();
        utils.objectInit(this, init);
        if (!this.input) this.input = new InputView();
    }
    updateDom() {
        this.input.type = this.type;
        super.updateDom();
    }
}

export namespace FlagsInput {
    export class FlagsInput extends ContainerView<Flag> {
        constructor(flags?: string[] | Flag[]) {
            super();
            flags?.forEach(f => {
                var flag = f instanceof Flag ? f : new Flag({ text: Object.prototype.toString.call(f) });
                this.addView(flag);
            });
        }
        createDom() {
            return { tag: 'div.flags-input' };
        }
    }

    export class Flag extends TextView {
        get parentInput() { return this.parentView as (FlagsInput | undefined); }
        constructor(init?: ObjectInit<Flag>) {
            super();
            utils.objectInit(this, init);
        }
        createDom() {
            return { tag: 'div.flags-input-item' };
        }
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
    constructor(init?: ObjectInit<Toast>) {
        super();
        utils.objectInit(this, init);
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

export class ViewToggle<T extends keyof any> {
    items: Record<T, View | View[]>;
    shownKeys: T[] = [];
    toggleMode: 'display' | 'hidden' | 'remove' = 'remove';
    container: View | null = null;
    constructor(init?: ObjectInit<ViewToggle<T>>) {
        utils.objectInit(this, init);
        this.setShownKeys(this.shownKeys);
    }
    add(key: T, view: View) {
        const oldVal = this.items[key];
        if (oldVal) {
            if (oldVal instanceof Array) {
                (this.items[key] as View[]).push(view);
            } else {
                this.items[key] = [oldVal as View, view];
            }
        } else {
            this.items[key] = view;
        }
        this.toggleView(view, this.shownKeys.indexOf(key) >= 0);
    }
    setShownKeys(keys: T[]) {
        this.shownKeys = keys;
        const items = this.items;
        for (const key in items) {
            const show = keys.indexOf(key) >= 0;
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                const val = items[key];
                if (val) {
                    if (val instanceof Array) {
                        for (const v of val) {
                            this.toggleView(v, show);
                        }
                    } else if (val) {
                        this.toggleView(val as View, show);
                    }
                }
            }
        }
    }
    toggleView(view: View, show: boolean, mode?: ViewToggle<T>['toggleMode']) {
        if (!mode) mode = this.toggleMode;
        if (mode == 'display') {
            view.dom.style.display = show ? '' : 'none';
        } else if (mode == 'hidden') {
            view.dom.hidden = !show;
        } else if (mode == 'remove') {
            if (show) {
                this.container!.appendView(view);
            } else {
                view.dom.remove();
            }
        } else {
            throw new Error('Unknown toggle mode');
        }
    }
}

export class ToolTip extends TextView {
    createDom() {
        return {
            tag: 'div.tooltip'
        };
    }
    private _shown = false;
    private _timer = new Timer(() => this.close());
    get shown() { return this._shown; }
    show(options: PositionOptions & {
        parent?: HTMLElement, timeout?: number;
    }) {
        if (this.shown) return;
        this._shown = true;
        this._cancelClose?.();
        let { parent = document.body, timeout } = options;
        if (timeout) this._timer.timeout(timeout);
        const dom = this.dom;
        setPosition(dom, options);
        parent.appendChild(dom);
    }
    private _cancelClose: Action | null = null;
    close(fadeOutOptions?: Parameters<typeof utils.fadeout>[1]) {
        if (!this.shown) return;
        this._timer.tryCancel();
        this._shown = false;
        this._cancelClose = utils.fadeout(this.dom, fadeOutOptions).cancel;
    }
}

export interface PositionOptions {
    x?: number;
    y?: number;
    anchor?: 'bottom';
}

function setPosition(dom: HTMLElement, options: PositionOptions) {
    let { x = 0, y = 0, anchor = 'bottom' } = options;
    dom.style.left = x + 'px';
    dom.style.top = y + 'px';
    if (!dom.classList.contains('anchor-' + anchor)) {
        dom.classList.forEach(x => {
            if (x.startsWith('anchor-')) {
                dom.classList.remove(x);
            }
        });
        dom.classList.add('anchor-' + anchor);
    }
}
