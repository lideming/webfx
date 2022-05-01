import { buildDOM, BuildDomExpr, IDOM } from "../lib/buildDOM";
import { Action, Callbacks } from "@yuuza/utils";
import { View, ContainerView } from "../lib/view";
import { dragManager } from "./helpers";
import { clearChildren } from "../lib/viewUtils";

export abstract class ListViewItem extends View implements ISelectable {
    get listview() { return this.parentView instanceof ListView ? this.parentView as ListView<this> : null; }
    get selectionHelper() { return this.listview?.selectionHelper; }

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
            if (this.selected && this.selectionHelper) {
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
            onDragover(arg as DragArg<any>);
            if (drop || arg.accept) ev.preventDefault();
        }
        const onContextMenu = this.onContextMenu ?? this.listview?.onContextMenu;
        if (!arg.accept && items && items.indexOf(this) >= 0 && onContextMenu) {
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
                        buildDOM({ tag: 'div.dragover-placeholder' }) as HTMLElement,
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
        clearChildren(this.dom);
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
