import { Callbacks, listenEvent, ObjectInit, objectInit, toggleClass } from "../lib/utils";
import { View } from "../lib/view";
import { buildDOM } from "../lib/buildDOM";


export interface PositionOptions {
    x?: number;
    y?: number;
    anchor?: 'bottom';
}

export function setPosition(dom: HTMLElement, options: PositionOptions) {
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
        toggleClass(ele, 'editing', true);
        var input = buildDOM({
            tag: 'input', type: 'text', value: beforeEdit
        }) as HTMLInputElement;
        while (ele.firstChild) ele.removeChild(ele.firstChild);
        ele.appendChild(input);
        input.select();
        input.focus();
        var stopEdit = () => {
            this.editing = false;
            toggleClass(ele, 'editing', false);
            events.forEach(x => x.remove());
            input.remove();
            this.onComplete?.(input.value);
            onComplete?.(input.value);
        };
        var events = [
            listenEvent(input, 'keydown', (evv) => {
                if (evv.code === 'Enter') {
                    stopEdit();
                    evv.preventDefault();
                }
            }),
            listenEvent(input, 'focusout', (evv) => { stopEdit(); }),
        ];
    }
    startEditAsync() {
        return new Promise<string>((resolve) => this.startEdit(resolve));
    }
}

export class ViewToggle<T extends keyof any> {
    items: Record<T, View | View[]>;
    shownKeys: T[] = [];
    toggleMode: 'display' | 'hidden' | 'remove' = 'remove';
    container: View | null = null;
    constructor(init?: ObjectInit<ViewToggle<T>>) {
        objectInit(this, init);
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
            if (show != !!view.parentView) {
                if (show) {
                    this.container!.appendView(view);
                } else {
                    this.container!.removeView(view);
                }
            }
        } else {
            throw new Error('Unknown toggle mode');
        }
    }
}



export class ItemActiveHelper<T extends View> {
    funcSetActive = (item: T, val: boolean) => item.toggleClass('active', val);
    current: T | null = null;
    constructor(init?: ObjectInit<ItemActiveHelper<T>>) {
        objectInit(this, init);
    }
    set(item: T | null) {
        if (this.current === item) return;
        if (this.current) this.funcSetActive(this.current, false);
        this.current = item;
        if (this.current) this.funcSetActive(this.current, true);
    }
}
