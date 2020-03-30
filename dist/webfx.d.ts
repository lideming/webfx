declare module "I18n" {
    export interface I18nData {
        [lang: string]: {
            [key: string]: string;
        };
    }
    /** Internationalization (aka i18n) helper class */
    export class I18n {
        data: I18nData;
        curLang: string;
        missing: Map<string, 1>;
        /** Get i18n string for `key`, return `key` when not found. */
        get(key: any, arg?: any[]): string;
        /** Get i18n string for `key`, return `null` when not found. */
        get2(key: any, arg?: any[], lang?: string): string;
        /** Fills data with an 2darray */
        add2dArray(array: [...string[][]]): void;
        renderElements(elements: any): void;
        /**
         * Detect the best available language using
         * the user language preferences provided by the browser.
         * @param langs Available languages
         */
        static detectLanguage(langs: string[]): string;
    }
    export var i18n: I18n;
    export function createStringBuilder(i18n: I18n): (literals: TemplateStringsArray, ...placeholders: any[]) => string;
    export function I(literals: TemplateStringsArray, ...placeholders: any[]): string;
}
declare module "utils" {
    import { i18n, I } from "I18n";
    export { i18n, I };
    /** The name "utils" tells it all. */
    export var utils: {
        strPadLeft(str: string, len: number, ch?: string): string;
        formatTime(sec: number): string;
        fileSizeUnits: string[];
        formatFileSize(size: number): string;
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
        buildDOM: <T extends BuildDomReturn = BuildDomReturn>(tree: BuildDomExpr, ctx?: BuildDOMCtx) => T;
        /** Remove all children from the node */
        clearChildren(node: Node): void;
        /** Remove all children from the node (if needed) and append one (if present) */
        replaceChild(node: Node, newChild?: Node): void;
        /** Add or remove a classname for the element
         * @param force - true -> add; false -> remove; undefined -> toggle.
         */
        toggleClass(element: HTMLElement, clsName: string, force?: boolean): boolean;
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
        arrayInsert<T_2>(array: T_2[], val: T_2, pos?: number): void;
        arrayMap<T_3, TRet>(arr: Iterable<T_3>, func: (item: T_3, idx: number) => TRet): TRet[];
        arrayForeach<T_4>(arr: Iterable<T_4>, func: (item: T_4, idx: number) => void): void;
        arrayFind<T_5>(arr: Iterable<T_5>, func: (item: T_5, idx: number) => any): T_5;
        arraySum<T_6>(arr: Iterable<T_6>, func: (item: T_6) => number): number;
        objectApply<T_7>(obj: Partial<T_7>, kv?: Partial<T_7>, keys?: (keyof T_7)[]): Partial<T_7>;
        mod(a: number, b: number): number;
        readBlobAsDataUrl(blob: Blob): Promise<string>;
    };
    global {
        interface Array<T> {
            /**
             * (Extension method) remove the specified item from array.
             * @param item The item to be removed from array
             */
            remove(item: T): void;
        }
    }
    export class Timer {
        callback: () => void;
        cancelFunc: (() => void) | undefined;
        constructor(callback: () => void);
        timeout(time: any): void;
        interval(time: any): void;
        tryCancel(): void;
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
    export type AnyFunc = (...args: any) => any;
    export type Action<T = void> = (arg: T) => void;
    export type Func<TRet> = () => TRet;
    export type AsyncFunc<T> = Func<Promise<T>>;
    export type FuncOrVal<T> = T | Func<T>;
    export type BuildDomExpr = string | BuildDomNode | HTMLElement | Node | IDOM;
    export interface IDOM {
        getDOM(): HTMLElement;
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
        constructor(dict?: BuildDOMCtx['dict'] | {});
        static EnsureCtx(ctxOrDict: BuildDOMCtx | {}, origctx: BuildDOMCtx): BuildDOMCtx;
        setDict(key: string, node: HTMLElement): void;
        addUpdateAction(action: BuildDOMUpdateAction): void;
        update(): void;
        static executeAction(a: BuildDOMUpdateAction): void;
    }
    type BuildDOMUpdateAction = ['text', Node, Func<string>] | ['hidden', HTMLElement, Func<boolean>] | ['update', HTMLElement, Action<HTMLElement>];
    export class SettingItem<T> {
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
                deserialize: (str: any) => boolean;
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
    export class Callbacks<T extends AnyFunc = Action> {
        list: T[];
        invoke(...args: Parameters<T>): void;
        add(callback: T): T;
        remove(callback: T): void;
    }
    export class Lazy<T> {
        private _func;
        private _value;
        get computed(): boolean;
        get rawValue(): T;
        get value(): T;
        constructor(func: Func<T>);
    }
    export class Semaphore {
        queue: Action<void>[];
        maxCount: number;
        runningCount: number;
        constructor(init: Partial<Semaphore>);
        enter(): Promise<any>;
        exit(): void;
        run(func: () => Promise<any>): Promise<void>;
    }
    /** Just like CancellationToken[Source] on .NET */
    export class CancelToken {
        cancelled: boolean;
        onCancelled: Callbacks<Action<void>>;
        cancel(): void;
        throwIfCancelled(): void;
    }
    export interface IId {
        id: keyof any;
    }
    export class DataUpdatingHelper<T extends IId, TData extends IId = T> {
        items: Iterable<T>;
        update(newData: Iterable<TData>): void;
        protected selectId(obj: T): any;
        protected dataSelectId(obj: TData): any;
        addItem(obj: TData, pos: number): void;
        updateItem(old: T, data: TData): void;
        removeItem(obj: T): void;
    }
    export class EventRegistrations {
        list: {
            event: Callbacks;
            func: AnyFunc;
        }[];
        add<T extends AnyFunc>(event: Callbacks<T>, func: T): T;
        removeAll(): void;
    }
}
declare module "viewlib" {
    import { BuildDomExpr, Action, Callbacks, Timer, BuildDOMCtx, IDOM } from "utils";
    export class View implements IDOM {
        constructor(dom?: BuildDomExpr);
        static getView(obj: IDOM): View;
        parentView?: ContainerView<View>;
        _position?: number;
        get position(): number;
        domctx: BuildDOMCtx;
        protected _dom: HTMLElement;
        get domCreated(): boolean;
        get dom(): HTMLElement;
        get hidden(): boolean;
        set hidden(val: boolean);
        ensureDom(): void;
        private domExprCreated;
        protected createDom(): BuildDomExpr;
        /** Will be called when the dom is created */
        protected postCreateDom(): void;
        /** Will be called when the dom is created, after postCreateDom() */
        updateDom(): void;
        /** Assign key-values and call `updateDom()` */
        updateWith(kv: Partial<this>): void;
        toggleClass(clsName: string, force?: boolean): void;
        appendView(view: View): any;
        getDOM(): HTMLElement;
        _onactive: Action;
        _onActiveCbs: Action<any>[];
        get onactive(): Action<void>;
        set onactive(val: Action<void>);
        handleKeyDown(e: KeyboardEvent, onactive: Action): void;
    }
    global {
        interface Node {
            appendView(view: View): any;
        }
        interface HTMLElement {
            getDOM(): HTMLElement;
        }
    }
    export class ContainerView<T extends View> extends View {
        items: T[];
        appendView(view: T): void;
        addView(view: T, pos?: number): void;
        removeView(view: T | number): void;
        removeAllView(): void;
        updateChildrenDom(): void;
        protected _ensureItem(item: T | number): T;
        [Symbol.iterator](): IterableIterator<T>;
        get length(): number;
        get(idx: number): T;
        map<TRet>(func: (lvi: T) => TRet): TRet[];
        find(func: (lvi: T, idx: number) => any): T;
        forEach(func: (lvi: T, idx: number) => void): void;
    }
    /** DragManager is used to help exchange information between views */
    export var dragManager: {
        /** The item being dragged */
        _currentItem: any;
        _currentArray: any[];
        readonly currentItem: any;
        readonly currentArray: any[];
        onDragStart: Callbacks<Action<void>>;
        onDragEnd: Callbacks<Action<void>>;
        start(item: any): void;
        startArray(arr: any[]): void;
        end(): void;
    };
    export abstract class ListViewItem extends View implements ISelectable {
        get listview(): ListView<this>;
        get selectionHelper(): any;
        get dragData(): string;
        onDragover: ListView['onDragover'];
        onContextMenu: ListView['onContextMenu'];
        dragging?: boolean;
        private _selected;
        get selected(): boolean;
        set selected(v: boolean);
        onSelectedChanged: Callbacks<Action<void>>;
        remove(): void;
        protected postCreateDom(): void;
        private enterctr;
        private dragoverPlaceholder;
        dragHandler(ev: DragEvent, type: string): void;
    }
    interface DragArg<T> {
        source: ListViewItem;
        target: T;
        drop: boolean;
        sourceItems: ListViewItem[];
        accept: boolean | 'move' | 'move-after';
        event: DragEvent;
    }
    export class ListView<T extends ListViewItem = ListViewItem> extends ContainerView<T> implements Iterable<T> {
        onItemClicked: (item: T) => void;
        /**
         * Allow user to drag an item.
         */
        dragging: boolean;
        /**
         * Allow user to drag an item and change its position.
         */
        moveByDragging: boolean;
        selectionHelper: SelectionHelper<T>;
        onItemMoved: (item: T, from: number) => void;
        /**
         * When dragover or drop
         */
        onDragover: (arg: DragArg<T>) => void;
        onContextMenu: (item: ListViewItem, ev: MouseEvent) => void;
        constructor(container?: BuildDomExpr);
        protected postCreateDom(): void;
        add(item: T, pos?: number): void;
        remove(item: T | number, keepSelected?: boolean): void;
        move(item: T | number, newpos: number): void;
        /** Remove all items */
        removeAll(): void;
        /** Remove all items and all DOM children */
        clear(): void;
        ReplaceChild(dom: IDOM): void;
    }
    export interface ISelectable {
        selected: boolean;
        position: number;
    }
    export class SelectionHelper<TItem extends ISelectable> {
        _enabled: boolean;
        get enabled(): boolean;
        set enabled(val: boolean);
        onEnabledChanged: Callbacks<Action<void>>;
        itemProvider: ((pos: number) => TItem);
        ctrlForceSelect: boolean;
        selectedItems: TItem[];
        onSelectedItemsChanged: Callbacks<(action: "add" | "remove", item: TItem) => void>;
        get count(): number;
        /** For shift-click */
        lastToggledItem: TItem;
        /** Returns true if it's handled by the helper. */
        handleItemClicked(item: TItem, ev: MouseEvent): boolean;
        toggleItemSelection(item: TItem, force?: boolean): void;
    }
    export class ItemActiveHelper<T extends View> {
        funcSetActive: (item: T, val: boolean) => void;
        current: T;
        constructor(init?: Partial<ItemActiveHelper<T>>);
        set(item: T): void;
    }
    type SectionActionOptions = {
        text: string;
        onclick: Action;
    };
    export class Section extends View {
        titleDom: HTMLSpanElement;
        constructor(arg?: {
            title?: string;
            content?: IDOM;
            actions?: SectionActionOptions[];
        });
        createDom(): BuildDomExpr;
        setTitle(text: string): void;
        setContent(view: IDOM): void;
        addAction(arg: SectionActionOptions): void;
    }
    type LoadingIndicatorState = 'normal' | 'running' | 'error';
    export class LoadingIndicator extends View {
        constructor(init?: Partial<LoadingIndicator>);
        private _status;
        get state(): LoadingIndicatorState;
        set state(val: LoadingIndicatorState);
        private _text;
        private _textdom;
        get content(): string;
        set content(val: string);
        onclick: (e: MouseEvent) => void;
        reset(): void;
        error(err: any, retry: Action): void;
        action(func: () => Promise<void>): Promise<void>;
        createDom(): BuildDomExpr;
        postCreateDom(): void;
    }
    export class Overlay extends View {
        createDom(): {
            tag: string;
        };
        setCenterChild(centerChild: boolean): this;
        setNoBg(nobg: boolean): this;
    }
    export class EditableHelper {
        editing: boolean;
        beforeEdit: string;
        element: HTMLElement;
        onComplete: (newName: string) => void;
        constructor(element: HTMLElement);
        startEdit(onComplete?: this['onComplete']): void;
        startEditAsync(): Promise<string>;
    }
    export class MenuItem extends ListViewItem {
        text: string;
        cls: 'normal' | 'dangerous';
        onclick: Action;
        constructor(init: Partial<MenuItem>);
        createDom(): BuildDomExpr;
        postCreateDom(): void;
        private _lastcls;
        updateDom(): void;
    }
    export class MenuLinkItem extends MenuItem {
        link: string;
        download: string;
        constructor(init: Partial<MenuLinkItem>);
        createDom(): BuildDomExpr;
        updateDom(): void;
    }
    export class MenuInfoItem extends MenuItem {
        text: string;
        constructor(init: Partial<MenuInfoItem>);
        createDom(): BuildDomExpr;
        updateDom(): void;
    }
    export class ContextMenu extends ListView {
        keepOpen: boolean;
        useOverlay: boolean;
        private _visible;
        get visible(): boolean;
        overlay: Overlay;
        private _onclose;
        private _originalFocused;
        constructor(items?: MenuItem[]);
        show(arg: {
            x?: number;
            y?: number;
            ev?: MouseEvent;
        }): void;
        close(): void;
    }
    export class Dialog extends View {
        overlay: Overlay;
        domheader: HTMLElement;
        content: ContainerView<View>;
        shown: boolean;
        btnTitle: TabBtn;
        btnClose: TabBtn;
        title: string;
        allowClose: boolean;
        showCloseButton: boolean;
        onShown: Callbacks<Action<void>>;
        onClose: Callbacks<Action<void>>;
        autoFocus: View;
        focusTrap: View;
        static defaultParent: DialogParent;
        get width(): string;
        set width(val: string);
        get contentFlex(): boolean;
        set contentFlex(val: boolean);
        get resizable(): boolean;
        set resizable(val: boolean);
        constructor();
        createDom(): BuildDomExpr;
        postCreateDom(): void;
        updateDom(): void;
        addBtn(btn: TabBtn): void;
        addContent(view: IDOM, replace?: boolean): void;
        setOffset(x: number, y: number): void;
        getOffset(): {
            x: number;
            y: number;
        };
        show(): void;
        private _cancelFadeout;
        close(): void;
        waitClose(): Promise<void>;
    }
    export class DialogParent extends View {
        bgOverlay: Overlay;
        dialogCount: number;
        _cancelFadeout: Action;
        constructor(dom?: BuildDomExpr);
        onDialogShowing(dialog: Dialog): void;
        onDialogClosing(dialog: Dialog): void;
    }
    export class TabBtn extends View {
        text: string;
        clickable: boolean;
        active: boolean;
        right: boolean;
        onclick: Action;
        onClick: Callbacks<Action<void>>;
        constructor(init?: Partial<TabBtn>);
        createDom(): BuildDomExpr;
        postCreateDom(): void;
        updateDom(): void;
    }
    export class InputView extends View {
        dom: HTMLInputElement;
        multiline: boolean;
        type: string;
        placeholder: string;
        get value(): string;
        set value(val: string);
        constructor(init?: Partial<InputView>);
        createDom(): {
            tag: string;
        };
        updateDom(): void;
    }
    export class TextView extends View {
        get text(): string;
        set text(val: string);
    }
    export class ButtonView extends TextView {
        disabled: boolean;
        get onclick(): Action<void>;
        set onclick(val: Action<void>);
        type: 'normal' | 'big';
        constructor(init?: Partial<ButtonView>);
        createDom(): BuildDomExpr;
        updateDom(): void;
    }
    export class LabeledInput extends View {
        label: string;
        type: string;
        input: InputView;
        get dominput(): HTMLInputElement;
        get value(): string;
        set value(val: string);
        constructor(init?: Partial<LabeledInput>);
        createDom(): BuildDomExpr;
        updateDom(): void;
    }
    export class ToastsContainer extends View {
        static default: ToastsContainer;
        parentDom: HTMLElement;
        toasts: Toast[];
        createDom(): {
            tag: string;
        };
        addToast(toast: Toast): void;
        removeToast(toast: Toast): void;
        show(): void;
        remove(): void;
    }
    export class Toast extends View {
        text: string;
        container: ToastsContainer;
        shown: boolean;
        timer: Timer;
        constructor(init?: Partial<Toast>);
        show(timeout?: number): void;
        close(): void;
        createDom(): {
            tag: string;
        };
        updateDom(): void;
        static show(text: string, timeout?: number): Toast;
    }
    export class MessageBox extends Dialog {
        allowClose: boolean;
        title: string;
        result: 'none' | 'no' | 'yes' | 'ok' | 'cancel';
        addResultBtns(results: this['result'][]): this;
        setTitle(title: string): this;
        addText(text: string): this;
        allowCloseWithResult(result: this['result'], showCloseButton?: boolean): this;
        addBtnWithResult(btn: TabBtn, result: this['result']): this;
        showAndWaitResult(): Promise<"none" | "cancel" | "no" | "yes" | "ok">;
    }
}
declare module "webfx" {
    export * from "utils";
    export * from "I18n";
    export * from "viewlib";
}
