import { i18n, I } from "./I18n";
export { i18n, I };
/** The name "utils" tells it all. */
export declare var utils: {
    strPadLeft(str: string, len: number, ch?: string): string;
    formatTime(sec: any): string;
    fileSizeUnits: string[];
    formatFileSize(size: any): string;
    formatDateTime(date: Date): string;
    numLimit(num: number, min: number, max: number): number;
    createName(nameFunc: (num: number) => string, existsFunc: (str: string) => boolean): string;
    /**
     * btoa, but supports Unicode and uses UTF-8 encoding.
     * @see https://stackoverflow.com/questions/30106476
     */
    base64EncodeUtf8(str: any): string;
    Timer: typeof Timer;
    sleepAsync(time: number): Promise<void>;
    /**
     * Build a DOM tree from a JavaScript object.
     * @example utils.buildDOM({
            tag: 'div.item#firstitem',
            child: ['Name: ', { tag: 'span.name', textContent: name } ],
        })
     */
    buildDOM: <T extends BuildDomReturn = BuildDomReturn>(tree: BuildDomExpr, ctx?: BuildDOMCtx | undefined) => T;
    /** Remove all children from the node */
    clearChildren(node: Node): void;
    /** Remove all children from the node (if needed) and append one (if present) */
    replaceChild(node: Node, newChild?: Node | undefined): void;
    /** Add or remove a classname for the element
     * @param force - true -> add; false -> remove; undefined -> toggle.
     */
    toggleClass(element: HTMLElement, clsName: string, force?: boolean | undefined): boolean;
    /** Fade out the element and remove it */
    fadeout(element: HTMLElement): {
        readonly finished: boolean;
        onFinished(callback: Action<void>): void;
        cancel(): void;
    };
    listenPointerEvents(element: HTMLElement, callback: (e: PtrEvent) => void | "track"): void;
    addEvent<K extends "waiting" | "error" | "abort" | "cancel" | "progress" | "ended" | "change" | "input" | "select" | "fullscreenchange" | "fullscreenerror" | "animationcancel" | "animationend" | "animationiteration" | "animationstart" | "auxclick" | "blur" | "canplay" | "canplaythrough" | "click" | "close" | "contextmenu" | "cuechange" | "dblclick" | "drag" | "dragend" | "dragenter" | "dragexit" | "dragleave" | "dragover" | "dragstart" | "drop" | "durationchange" | "emptied" | "focus" | "focusin" | "focusout" | "gotpointercapture" | "invalid" | "keydown" | "keypress" | "keyup" | "load" | "loadeddata" | "loadedmetadata" | "loadstart" | "lostpointercapture" | "mousedown" | "mouseenter" | "mouseleave" | "mousemove" | "mouseout" | "mouseover" | "mouseup" | "pause" | "play" | "playing" | "pointercancel" | "pointerdown" | "pointerenter" | "pointerleave" | "pointermove" | "pointerout" | "pointerover" | "pointerup" | "ratechange" | "reset" | "resize" | "scroll" | "securitypolicyviolation" | "seeked" | "seeking" | "selectionchange" | "selectstart" | "stalled" | "submit" | "suspend" | "timeupdate" | "toggle" | "touchcancel" | "touchend" | "touchmove" | "touchstart" | "transitioncancel" | "transitionend" | "transitionrun" | "transitionstart" | "volumechange" | "wheel" | "copy" | "cut" | "paste">(element: HTMLElement, event: K, handler: (ev: HTMLElementEventMap[K]) => any): {
        remove: () => void;
    };
    arrayRemove<T_1>(array: T_1[], val: T_1): void;
    arrayInsert<T_2>(array: T_2[], val: T_2, pos?: number | undefined): void;
    arrayMap<T_3, TRet>(arr: Iterable<T_3>, func: (item: T_3, idx: number) => TRet): TRet[];
    arrayForeach<T_4>(arr: Iterable<T_4>, func: (item: T_4, idx: number) => void): void;
    arrayFind<T_5>(arr: Iterable<T_5>, func: (item: T_5, idx: number) => any): T_5 | null;
    arraySum<T_6>(arr: Iterable<T_6>, func: (item: T_6) => number | null | undefined): number;
    objectApply<T_7>(obj: Partial<T_7>, kv?: Partial<T_7> | undefined, keys?: (keyof T_7)[] | undefined): Partial<T_7>;
    mod(a: number, b: number): number;
    readBlobAsDataUrl(blob: Blob): Promise<string>;
};
declare global {
    interface Array<T> {
        /**
         * (Extension method) remove the specified item from array.
         * @param item The item to be removed from array
         */
        remove(item: T): void;
    }
}
export declare class Timer {
    callback: () => void;
    cancelFunc: (() => void) | undefined;
    constructor(callback: () => void);
    timeout(time: any): void;
    interval(time: any): void;
    tryCancel(): void;
}
export declare type PtrEvent = ({
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
export declare type AnyFunc = (...args: any) => any;
export declare type Action<T = void> = (arg: T) => void;
export declare type Func<TRet> = () => TRet;
export declare type AsyncFunc<T> = Func<Promise<T>>;
export declare type FuncOrVal<T> = T | Func<T>;
export declare type BuildDomExpr = string | BuildDomNode | HTMLElement | Node | IDOM;
export interface IDOM {
    getDOM(): HTMLElement;
}
export declare type BuildDomTag = string;
export declare type BuildDomReturn = HTMLElement | Text | Node;
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
export declare class BuildDOMCtx {
    dict: Record<string, HTMLElement>;
    actions: BuildDOMUpdateAction[];
    constructor(dict?: BuildDOMCtx['dict'] | {});
    static EnsureCtx(ctxOrDict: BuildDOMCtx | {}, origctx: BuildDOMCtx): BuildDOMCtx;
    setDict(key: string, node: HTMLElement): void;
    addUpdateAction(action: BuildDOMUpdateAction): void;
    update(): void;
    static executeAction(a: BuildDOMUpdateAction): void;
}
declare type BuildDOMUpdateAction = ['text', Node, Func<string>] | ['hidden', HTMLElement, Func<boolean>] | ['update', HTMLElement, Action<HTMLElement>];
export declare class SettingItem<T> {
    key: string;
    type: SiType<T>;
    data: T;
    isInitial: boolean;
    onRender: (obj: T) => void;
    constructor(key: string, type: 'bool' | 'str' | 'json' | SiType<T>, initial: T);
    readFromStorage(initial: T): void;
    render(fn: (obj: T) => void, dontRaiseNow?: boolean): this;
    bindToBtn(btn: HTMLElement, prefix: string[]): this;
    remove(): void;
    save(): void;
    set(data: T, dontSave?: boolean): void;
    get(): T;
    toggle(): void;
    loop(arr: any): void;
    static types: {
        bool: {
            serialize: (data: any) => "true" | "false";
            deserialize: (str: any) => boolean | undefined;
        };
        str: {
            serialize: (x: any) => any;
            deserialize: (x: any) => any;
        };
        json: {
            serialize: (x: any) => string;
            deserialize: (x: any) => any;
        };
    };
}
interface SiType<T> {
    serialize: (obj: T) => string;
    deserialize: (str: string) => T;
}
export declare class Callbacks<T extends AnyFunc = Action> {
    list: T[];
    invoke(...args: Parameters<T>): void;
    add(callback: T): T;
    remove(callback: T): void;
}
export declare class Lazy<T> {
    private _func?;
    private _value?;
    get computed(): boolean;
    get rawValue(): T | undefined;
    get value(): T;
    constructor(func: Func<T>);
}
export declare class Semaphore {
    queue: Action<void>[];
    maxCount: number;
    runningCount: number;
    constructor(init: Partial<Semaphore>);
    enter(): Promise<any>;
    exit(): void;
    run(func: () => Promise<any>): Promise<void>;
}
/** Just like CancellationToken[Source] on .NET */
export declare class CancelToken {
    cancelled: boolean;
    onCancelled: Callbacks<Action<void>>;
    cancel(): void;
    throwIfCancelled(): void;
}
export interface IId {
    id: keyof any;
}
export declare class DataUpdatingHelper<T extends IId, TData extends IId = T> {
    items: Iterable<T>;
    update(newData: Iterable<TData>): void;
    protected selectId(obj: T): any;
    protected dataSelectId(obj: TData): any;
    addItem(obj: TData, pos: number): void;
    updateItem(old: T, data: TData): void;
    removeItem(obj: T): void;
}
export declare class EventRegistrations {
    list: {
        event: Callbacks;
        func: AnyFunc;
    }[];
    add<T extends AnyFunc>(event: Callbacks<T>, func: T): T;
    removeAll(): void;
}
export declare class TextCompositionWatcher {
    dom: HTMLElement;
    isCompositing: boolean;
    constructor(dom: IDOM);
}
