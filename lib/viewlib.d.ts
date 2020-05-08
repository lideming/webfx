import { BuildDomExpr, Action, Callbacks, Timer, BuildDOMCtx, IDOM } from "./utils";
export declare class View implements IDOM {
    constructor(dom?: BuildDomExpr);
    static getView(obj: IDOM): View;
    parentView?: ContainerView<View>;
    _position?: number;
    get position(): number | undefined;
    domctx: BuildDOMCtx;
    protected _dom: HTMLElement | undefined;
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
    _onactive: Action | undefined;
    _onActiveCbs: Action<any>[] | undefined;
    get onactive(): Action<void> | undefined;
    set onactive(val: Action<void> | undefined);
    handleKeyDown(e: KeyboardEvent, onactive: Action): void;
}
declare global {
    interface Node {
        appendView(view: View): any;
    }
    interface HTMLElement {
        getDOM(): HTMLElement;
    }
}
export declare class ContainerView<T extends View> extends View {
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
    find(func: (lvi: T, idx: number) => any): T | null;
    forEach(func: (lvi: T, idx: number) => void): void;
}
/** DragManager is used to help exchange information between views */
export declare var dragManager: {
    /** The item being dragged */
    _currentItem: any;
    _currentArray: any[] | null;
    readonly currentItem: any;
    readonly currentArray: any[] | null;
    onDragStart: Callbacks<Action<void>>;
    onDragEnd: Callbacks<Action<void>>;
    start(item: any): void;
    startArray(arr: any[]): void;
    end(): void;
};
export declare abstract class ListViewItem extends View implements ISelectable {
    get listview(): ListView<this>;
    get selectionHelper(): any;
    get dragData(): string | null;
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
export declare class ListView<T extends ListViewItem = ListViewItem> extends ContainerView<T> implements Iterable<T> {
    onItemClicked: null | ((item: T) => void);
    /**
     * Allow user to drag an item.
     */
    dragging: boolean;
    /**
     * Allow user to drag an item and change its position.
     */
    moveByDragging: boolean;
    selectionHelper: SelectionHelper<T>;
    onItemMoved: null | ((item: T, from: number) => void);
    /**
     * When dragover or drop
     */
    onDragover: null | ((arg: DragArg<T>) => void);
    onContextMenu: null | ((item: ListViewItem, ev: MouseEvent) => void);
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
    position?: number;
}
export declare class SelectionHelper<TItem extends ISelectable> {
    _enabled: boolean;
    get enabled(): boolean;
    set enabled(val: boolean);
    onEnabledChanged: Callbacks<Action<void>>;
    itemProvider: ((pos: number) => TItem) | null;
    ctrlForceSelect: boolean;
    selectedItems: TItem[];
    onSelectedItemsChanged: Callbacks<(action: "add" | "remove", item: TItem) => void>;
    get count(): number;
    /** For shift-click */
    lastToggledItem: TItem | null;
    /** Returns true if it's handled by the helper. */
    handleItemClicked(item: TItem, ev: MouseEvent): boolean;
    toggleItemSelection(item: TItem, force?: boolean): void;
}
export declare class ItemActiveHelper<T extends View> {
    funcSetActive: (item: T, val: boolean) => void;
    current: T | null;
    constructor(init?: Partial<ItemActiveHelper<T>>);
    set(item: T | null): void;
}
declare type SectionActionOptions = {
    text: string;
    onclick: Action;
};
export declare class Section extends View {
    titleView: TextView;
    headerView: View;
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
declare type LoadingIndicatorState = 'normal' | 'running' | 'error';
export declare class LoadingIndicator extends View {
    constructor(init?: Partial<LoadingIndicator>);
    private _status;
    get state(): LoadingIndicatorState;
    set state(val: LoadingIndicatorState);
    private _text;
    private _textdom;
    get content(): string;
    set content(val: string);
    onclick: ((e: MouseEvent) => void) | null;
    reset(): void;
    error(err: any, retry?: Action): void;
    action(func: () => Promise<void>): Promise<void>;
    createDom(): BuildDomExpr;
    postCreateDom(): void;
}
export declare class Overlay extends View {
    createDom(): {
        tag: string;
    };
    setCenterChild(centerChild: boolean): this;
    setNoBg(nobg: boolean): this;
}
export declare class EditableHelper {
    editing: boolean;
    beforeEdit: string | null;
    element: HTMLElement;
    onComplete: ((newName: string) => void) | null;
    constructor(element: HTMLElement);
    startEdit(onComplete?: this['onComplete']): void;
    startEditAsync(): Promise<string>;
}
export declare class MenuItem extends ListViewItem {
    text: string;
    cls: 'normal' | 'dangerous';
    onclick: Action | null;
    constructor(init: Partial<MenuItem>);
    createDom(): BuildDomExpr;
    postCreateDom(): void;
    private _lastcls;
    updateDom(): void;
}
export declare class MenuLinkItem extends MenuItem {
    link: string;
    download: string;
    constructor(init: Partial<MenuLinkItem>);
    createDom(): BuildDomExpr;
    updateDom(): void;
}
export declare class MenuInfoItem extends MenuItem {
    text: string;
    constructor(init: Partial<MenuInfoItem>);
    createDom(): BuildDomExpr;
    updateDom(): void;
}
export declare class ContextMenu extends ListView {
    keepOpen: boolean;
    useOverlay: boolean;
    private _visible;
    get visible(): boolean;
    overlay: Overlay | null;
    private _onclose;
    private _originalFocused;
    constructor(items?: MenuItem[]);
    show(arg: {
        x: number;
        y: number;
    } | {
        ev: MouseEvent;
    }): void;
    close(): void;
}
export declare class Dialog extends View {
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
    center(): void;
    show(): void;
    private _cancelFadeout;
    close(): void;
    waitClose(): Promise<void>;
}
export declare class DialogParent extends View {
    bgOverlay: Overlay;
    dialogCount: number;
    _cancelFadeout: Action | null;
    constructor(dom?: BuildDomExpr);
    onDialogShowing(dialog: Dialog): void;
    onDialogClosing(dialog: Dialog): void;
}
export declare class TabBtn extends View {
    text: string;
    clickable: boolean;
    active: boolean;
    right: boolean;
    onclick: Action | null;
    onClick: Callbacks<Action<void>>;
    constructor(init?: Partial<TabBtn>);
    createDom(): BuildDomExpr;
    postCreateDom(): void;
    updateDom(): void;
}
export declare class InputView extends View {
    dom: HTMLElement;
    multiline: boolean;
    type: string;
    placeholder: string;
    get value(): string;
    set value(val: string);
    constructor(init?: Partial<InputView>);
    createDom(): BuildDomExpr;
    updateDom(): void;
}
export declare class TextView extends View {
    get text(): string | null;
    set text(val: string | null);
}
export declare class ButtonView extends TextView {
    disabled: boolean;
    get onclick(): Action<void> | undefined;
    set onclick(val: Action<void> | undefined);
    type: 'normal' | 'big';
    constructor(init?: Partial<ButtonView>);
    createDom(): BuildDomExpr;
    updateDom(): void;
}
export declare class LabeledInput extends View {
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
export declare class ToastsContainer extends View {
    static default: ToastsContainer;
    parentDom: HTMLElement | null;
    toasts: Toast[];
    createDom(): {
        tag: string;
    };
    addToast(toast: Toast): void;
    removeToast(toast: Toast): void;
    show(): void;
    remove(): void;
}
export declare class Toast extends View {
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
export declare class MessageBox extends Dialog {
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
export {};
