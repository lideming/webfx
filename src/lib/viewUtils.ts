import { Action, Callbacks } from "@yuuza/utils";
import { buildDOM, IDOM } from "./buildDOM";
import { getDOM } from "./view";


export function clearChildren(node: Node) {
    while (node.lastChild) node.removeChild(node.lastChild);
}

/** Remove all children from the node (if needed) and append one (if present) */
export function replaceChild(node: Node, newChild?: Node) {
    clearChildren(node);
    if (newChild) node.appendChild(newChild);
}

/** Add or remove a classname for the element
 * @param force - true -> add; false -> remove; undefined -> toggle.
 */
export function toggleClass(element: HTMLElement, clsName: string, force?: boolean) {
    var clsList = element.classList;
    if (clsList.toggle) return clsList.toggle(clsName, force);
    if (force === undefined) force = !clsList.contains(clsName);
    if (force) clsList.add(clsName);
    else clsList.remove(clsName);
    return force;
}

export interface FadeOutOptions {
    className?: string;
    duration?: number;
    remove?: boolean;
}

export interface FadeoutResult {
    readonly finished: boolean;
    onFinished(callback: Action): this;
    cancel(finish?: boolean): void;
}

/** Fade out the element and remove it */
export function fadeout(element: HTMLElement, options?: FadeOutOptions): FadeoutResult {
    const { className = 'fading-out', duration = 500, remove = true } = options || {};
    element.classList.add(className);
    var cb: Action | null = null;
    var end: Action<boolean | void> | null = (finish = true) => {
        if (!end) return; // use a random variable as flag ;)
        end = null;
        element.removeEventListener('transitionend', onTransitionend);
        element.classList.remove(className);
        if (remove && finish) {
            element.remove();
        }
        finish && cb?.();
    };
    var onTransitionend = function (e: TransitionEvent) {
        if (e.eventPhase === Event.AT_TARGET) end?.();
    };
    element.addEventListener('transitionend', onTransitionend);
    setTimeout(end, duration); // failsafe
    return {
        get finished() { return !end; },
        onFinished(callback: Action) {
            if (!end) callback();
            else cb = callback;
            return this;
        },
        cancel(finish = false) {
            end?.(finish);
        }
    };
}

export function startBlockingDetect(threshold = 20) {
    var begin = Date.now();
    var lastRun = Date.now();
    setInterval(() => {
        var now = Date.now();
        if (now - lastRun >= threshold) {
            console.info(`[Blocking] ${(now - begin) / 1000}s: blocked for ${now - lastRun} ms`);
        }
        lastRun = now;
    }, 1);
}

export class Timer {
    callback: () => void;
    cancelFunc: (() => void) | undefined;
    constructor(callback: () => void) {
        this.callback = callback;
        this.cancelFunc = undefined;
    }
    timeout(time: number) {
        this.tryCancel();
        var handle = setTimeout(this.callback, time);
        this.cancelFunc = () => window.clearTimeout(handle);
    }
    interval(time: number) {
        this.tryCancel();
        var handle = setInterval(this.callback, time);
        this.cancelFunc = () => window.clearInterval(handle);
    }
    animationFrame() {
        this.tryCancel();
        var handle = requestAnimationFrame(this.callback);
        this.cancelFunc = () => cancelAnimationFrame(handle);
    }
    tryCancel() {
        if (this.cancelFunc) {
            this.cancelFunc();
            this.cancelFunc = undefined;
        }
    }
}

export type PtrEvent = ({
    type: 'mouse';
    ev: MouseEvent;
} | {
    type: 'touch';
    touch: 'start' | 'move' | 'end';
    ev: TouchEvent;
}) & {
    action: 'down' | 'move' | 'up';
    point: MouseEvent | Touch;
};

export function listenPointerEvents(element: HTMLElement, callback: (e: PtrEvent) => void | 'track', options?: AddEventListenerOptions) {
    var touchDown = false;
    var mouseDown = function (e: MouseEvent) {
        if (callback({ type: 'mouse', ev: e, point: e, action: 'down' }) === 'track') {
            var mousemove = function (e: MouseEvent) {
                callback({ type: 'mouse', ev: e, point: e, action: 'move' });
            };
            var mouseup = function (e: MouseEvent) {
                document.removeEventListener('mousemove', mousemove, true);
                document.removeEventListener('mouseup', mouseup, true);
                callback({ type: 'mouse', ev: e, point: e, action: 'up' });
            };
            document.addEventListener('mousemove', mousemove, true);
            document.addEventListener('mouseup', mouseup, true);
        }
    };
    var touchStart = function (e: TouchEvent) {
        var ct = e.changedTouches[0];
        var ret = callback({
            type: 'touch', touch: 'start', ev: e, point: ct,
            action: touchDown ? 'move' : 'down'
        });
        if (!touchDown && ret === 'track') {
            touchDown = true;
            var touchmove = function (e: TouchEvent) {
                var ct = e.changedTouches[0];
                callback({ type: 'touch', touch: 'move', ev: e, point: ct, action: 'move' });
            };
            var touchend = function (e: TouchEvent) {
                if (e.touches.length === 0) {
                    touchDown = false;
                    element.removeEventListener('touchmove', touchmove);
                    element.removeEventListener('touchend', touchend);
                    element.removeEventListener('touchcancel', touchend);
                }
                var ct = e.changedTouches[0];
                callback({
                    type: 'touch', touch: 'end', ev: e, point: ct,
                    action: touchDown ? 'move' : 'up'
                });
            };
            element.addEventListener('touchmove', touchmove, options);
            element.addEventListener('touchend', touchend, options);
            element.addEventListener('touchcancel', touchend, options);
        }
    };
    element.addEventListener('mousedown', mouseDown, options);
    element.addEventListener('touchstart', touchStart, options);
    return {
        remove: () => {
            element.removeEventListener('mousedown', mouseDown, options);
            element.removeEventListener('touchstart', touchStart, options);
        }
    };
}

export function listenEvent<K extends keyof HTMLElementEventMap>(element: HTMLElement, event: K,
    handler: (ev: HTMLElementEventMap[K]) => any) {
    element.addEventListener(event, handler);
    return {
        remove: () => element.removeEventListener(event, handler)
    };
}

export function listenEvents<K extends Array<keyof HTMLElementEventMap>>(element: HTMLElement, events: K,
    handler: (ev: HTMLElementEventMap[K[number]]) => any) {
    events.forEach(event => element.addEventListener(event, handler));
    return {
        remove: () => events.forEach(event => element.removeEventListener(event, handler))
    };
}

export function injectCss(css: string, options?: { parent?: Node, tag?: string; }) {
    const parent = options?.parent ?? document.head;
    parent.appendChild(buildDOM({ tag: options?.tag ?? 'style', text: css }));
}

export class TextCompositionWatcher {
    dom: HTMLElement;
    onCompositingChanged = new Callbacks<Action>();
    private _isCompositing = false;
    get isCompositing() { return this._isCompositing; }
    set isCompositing(val) {
        this._isCompositing = val;
        this.onCompositingChanged.invoke();
    }
    constructor(dom: IDOM) {
        this.dom = getDOM(dom) as HTMLElement;
        this.dom.addEventListener('compositionstart', (ev) => {
            this.isCompositing = true;
        });
        this.dom.addEventListener('compositionend', (ev) => {
            this.isCompositing = false;
        });
    }
}

export class InputStateTracker {
    state = {
        mouseDown: false,
        mouseIn: false,
        focusIn: false,
    };
    private _removeEvents: Action | null = null;
    private _removePointerEvents: Action | null = null;
    readonly onChanged = new Callbacks<Action<keyof InputStateTracker['state']>>();
    constructor(readonly dom: HTMLElement) {
        this._removeEvents = listenEvents(dom, ['mouseenter', 'mouseleave', 'focusin', 'focusout'], (e) => {
            switch (e.type) {
                case 'mouseenter':
                    this.stateChanged('mouseIn', true);
                    break;
                case 'mouseleave':
                    this.stateChanged('mouseIn', false);
                    break;
                case 'focusin':
                    this.stateChanged('focusIn', true);
                    break;
                case 'focusout':
                    this.stateChanged('focusIn', false);
                    break;
            }
        }).remove;

        this._removePointerEvents = listenPointerEvents(dom, (e) => {
            if (e.action == 'down') {
                this.stateChanged('mouseDown', true);
                return 'track';
            } else if (e.action == 'up') {
                this.stateChanged('mouseDown', false);
            }
        }).remove;
    }
    private stateChanged<T extends keyof InputStateTracker['state']>(state: T, val: InputStateTracker['state'][T]) {
        this.state[state] = val;
        this.onChanged.invoke(state);
    }
    removeListeners() {
        this._removeEvents?.();
        this._removePointerEvents?.();
        this._removePointerEvents = this._removeEvents = null;
    }
}


export interface IId {
    id: keyof any;
}

export class DataUpdatingHelper<T extends IId, TData extends IId = T> {
    items: Iterable<T>;
    update(newData: Iterable<TData>) {
        const oldData = this.items;
        var dataDict: Record<keyof any, TData> = {};
        for (const n of newData) {
            dataDict[this.dataSelectId(n)] = n;
        }
        var itemDict: Record<any, T> = {};
        var removed: T[] = [];
        for (const d of oldData) {
            const id = this.selectId(d);
            if (dataDict[id] !== undefined) {
                itemDict[id] = d;
            } else {
                removed.push(d);
            }
        }
        for (let i = removed.length - 1; i >= 0; i--)
            this.removeItem(removed[i]);
        var pos = 0;
        for (const n of newData) {
            const d = itemDict[this.dataSelectId(n)];
            if (d !== undefined) {
                this.updateItem(d, n);
            } else {
                this.addItem(n, pos);
            }
            pos++;
        }
    }
    updateOrRebuildAll(newData: Iterable<TData>) {
        this.update(newData);
        if (!this.isSame(newData)) this.rebuildAll(newData);
    }
    isSame(newData: Iterable<TData>) {
        var t = this.items[Symbol.iterator]();
        for (const n of newData) {
            var d = t.next();
            if (d.done) return false;
            if (this.selectId(d.value) !== this.dataSelectId(n)) return false;
        }
        if (!t.next().done) return false;
        return true;
    }
    rebuildAll(newData: Iterable<TData>) {
        var oldData = this.items;
        if (oldData instanceof Array) {
            for (let i = oldData.length - 1; i >= 0; i--) {
                this.removeItem(oldData[i]);
            }
        } else {
            for (const o of oldData) {
                this.removeItem(o);
            }
        }
        let i = 0;
        for (const n of newData) {
            this.addItem(n, i++);
        }
    }
    protected selectId(obj: T): any { return obj.id; }
    protected dataSelectId(obj: TData): any { return obj.id; }
    addItem(obj: TData, pos: number) { }
    updateItem(old: T, data: TData) { }
    removeItem(obj: T) { }
}