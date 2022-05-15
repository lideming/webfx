// file: utils.ts

const _object_assign = Object.assign;
const _object_hasOwnProperty = Object.prototype.hasOwnProperty;

// Time & formatting utils:

export function strPadLeft(str: string, len: number, ch: string = ' ') {
    while (str.length < len) {
        str = ch + str;
    }
    return str;
}

export function formatDuration(sec: number | any) {
    if (typeof sec !== 'number' || isNaN(sec)) return '--:--';
    sec = Math.round(sec);
    var min = Math.floor(sec / 60);
    sec %= 60;
    return strPadLeft(min.toString(), 2, '0') + ':' + strPadLeft(sec.toString(), 2, '0');
}

const fileSizeUnits = ['B', 'KB', 'MB', 'GB'];
export function formatFileSize(size: number | any) {
    if (typeof size !== "number" || isNaN(size)) return 'NaN';
    var unit = 0;
    while (unit < fileSizeUnits.length - 1 && size >= 1024) {
        unit++;
        size /= 1024;
    }
    return size.toFixed(2) + ' ' + fileSizeUnits[unit];
}

export function formatDateTime(date: Date) {
    var now = new Date();
    var sameday = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    return sameday ? date.toLocaleTimeString() : date.toLocaleString();
}

export function numLimit(num: number, min: number, max: number) {
    return (num < min || typeof num != 'number' || isNaN(num)) ? min :
        (num > max) ? max : num;
}

export function createName(nameFunc: (num: number) => string, existsFunc: (str: string) => boolean) {
    for (let num = 0; ; num++) {
        let str = nameFunc(num);
        if (!existsFunc(str)) return str;
    }
}

/** 
 * btoa, but supports Unicode and uses UTF-8 encoding.
 * @see https://stackoverflow.com/questions/30106476
 */
export function base64EncodeUtf8(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(('0x' + p1) as any);
        }));
}

export function sleepAsync(time: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

export function arrayRemove<T>(array: T[], val: T) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === val) {
            array.splice(i, 1);
            i--;
        }
    }
}

export function arrayInsert<T>(array: T[], val: T, pos?: number) {
    if (pos === undefined) array.push(val);
    else array.splice(pos, 0, val);
}

export function arrayMap<T, TRet>(arr: Iterable<T>, func: (item: T, idx: number) => TRet) {
    if (arr instanceof Array) return arr.map(func);
    var idx = 0;
    var ret = new Array<TRet>((arr as any).length);
    for (var item of arr) {
        ret[idx] = (func(item, idx));
        idx++;
    }
    return ret;
}

export function arrayForeach<T>(arr: Iterable<T>, func: (item: T, idx: number) => void) {
    var idx = 0;
    for (var item of arr) {
        func(item, idx++);
    }
}


export function foreachFlaten<T>(arr: T[], func: Action<T>) {
    for (const it of arr) {
        if (it instanceof Array) {
            foreachFlaten(it as T[], func);
        } else {
            func(it);
        }
    }
}

export function arrayFind<T>(arr: Iterable<T>, func: (item: T, idx: number) => any): T | null {
    if (arr instanceof Array) return arr.find(func);
    var idx = 0;
    for (var item of arr) {
        if (func(item, idx++)) return item;
    }
    return null;
}

export function arraySum<T>(arr: Iterable<T>, func: (item: T) => number | null | undefined) {
    var sum = 0;
    arrayForeach(arr, (x) => {
        var val = func(x);
        if (val) sum += val;
    });
    return sum;
}

export function objectApply<T>(obj: Partial<T>, kv?: Partial<T>, keys?: Array<keyof T>) {
    if (kv) {
        if (!keys) return _object_assign(obj, kv);
        for (const key in kv as any) {
            if (_object_hasOwnProperty.call(kv, key) && (!keys || keys.indexOf(key as any) >= 0)) {
                const val = kv[key];
                obj[key] = val;
            }
        }
    }
    return obj;
}

export function objectInit<T>(obj: T, kv?: ObjectInit<T>, keys?: Array<keyof T>) {
    if (kv) {
        for (const key in kv as any) {
            if (_object_hasOwnProperty.call(kv, key) && (!keys || keys.indexOf(key as any) >= 0)) {
                const val = kv[key];
                if (key.startsWith("on") && obj[key] instanceof Callbacks) {
                    (obj[key] as Callbacks).add(val);
                } else {
                    obj[key] = val;
                }
            }
        }
    }
    return obj;
}

export function mod(a: number, b: number): number {
    if (a < 0) a = b + a;
    return a % b;
}

export function readBlobAsDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = (ev) => {
            resolve(reader.result as string);
        };
        reader.onerror = (ev) => reject();
        reader.readAsDataURL(blob);
    });
}

Array.prototype.remove = function (item) {
    arrayRemove(this, item);
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

export type ObjectInit<T> = Partial<ConvertObjectWithCallbacks<T>>;

export type ConvertObjectWithCallbacks<T> = {
    [P in keyof T]: P extends `on${string}` ? CallbackInit<T[P]> : T[P];
};

export type CallbackInit<T> = T extends Callbacks<infer U> ? T | U : T;

// Some interesting function types:
export type AnyFunc = (...args: any) => any;
export type Action<T = void> = (arg: T) => void;
export type Func<TRet> = () => TRet;
export type AsyncFunc<T> = Func<Promise<T>>;

export type FuncOrVal<T> = T | Func<T>;

class CallbacksImpl<T extends AnyFunc = Action> {
    private _cbs: Set<T> | undefined = undefined;
    private _cbs_invoking: Set<T> | undefined = undefined;
    private _hook?: Callbacks<(adding: boolean, func: T) => void> = undefined;
    private _invoking = false;
    get onChanged() {
        this._hook ??= new Callbacks();
        return this._hook;
    }
    get length() { return this._cbs ? this._cbs.size : 0; }
    invoke(...args: Parameters<T>) {
        if (!this._cbs) return;
        if (this._invoking) throw new Error("Cannot invoke callbacks during invocation");
        this._invoking = true;
        this._cbs.forEach((x: (...args: any) => void) => {
            try {
                x.apply(this, args);
            } catch (error) {
                console.error("Error in callback", error);
            }
        });
        this._cbs_invoking?.clear();
        this._invoking = false;
    }
    add(callback: T) {
        if (this._cbs === undefined) {
            this._cbs = new Set<T>();
        }
        if (this._invoking) {
            this._cbs_invoking ??= new Set<T>();
            this._cbs_invoking.add(callback);
        } else {
            this._cbs.add(callback);
        }
        this._hook?.invoke(true, callback);
        return callback;
    }
    remove(callback: T) {
        if (this._cbs === undefined) return;
        if (this._invoking) {
            this._cbs_invoking?.delete(callback);
        }
        this._cbs.delete(callback);
        this._hook?.invoke(false, callback);
    }
}

export interface Callbacks<T extends AnyFunc = Action> {
    invoke(...args: Parameters<T>): void;
    add(callback: T): T;
    remove(callback: T): void;
    readonly length: number;
    readonly onChanged: Callbacks<(adding: boolean, func: T) => void>;
}
export const Callbacks: { new <T extends AnyFunc = Action>(): Callbacks<T>; } = CallbacksImpl;

export class Ref<T> {
    private _value: T | undefined = undefined;
    private _onChanged: Callbacks<Action<Ref<T>>> | undefined = undefined;
    constructor(value?: T) {
        this._value = value;
    }
    get onChanged() {
        if (!this._onChanged) this._onChanged = new Callbacks();
        return this._onChanged;
    }
    get value() { return this._value; }
    set value(val) {
        this._value = val;
        if (this._onChanged) this.onChanged.invoke(this);
    }
    static from<T>(value: T) {
        const ref = new Ref<T>();
        ref._value = value;
        return ref as (Ref<T> & { value: T });
    }
}

export class Lazy<T> {
    private _func?: Func<T>;
    private _value?: T;
    get computed() { return !this._func; }
    get rawValue() { return this._value; }
    get value(): T {
        if (this._func) {
            this._value = this._func();
            this._func = undefined;
        }
        return this._value!;
    }
    constructor(func: Func<T>) {
        this._func = func;
        this._value = undefined;
    }
}

export class Semaphore {
    queue = new Array<Action>();
    maxCount = 1;
    runningCount = 0;
    constructor(init: ObjectInit<Semaphore>) {
        objectInit(this, init);
    }
    enter(): Promise<any> {
        if (this.runningCount === this.maxCount) {
            var resolve: Action;
            var prom = new Promise((res) => { resolve = res; });
            this.queue.push(resolve!);
            return prom;
        } else {
            this.runningCount++;
            return Promise.resolve();
        }
    }
    exit() {
        if (this.runningCount === this.maxCount && this.queue.length) {
            if (window.queueMicrotask) {
                window.queueMicrotask(this.queue.shift() as any);
            } else {
                setTimeout(this.queue.shift()!, 0);
            }
        } else {
            this.runningCount--;
        }
    }
    async run(func: () => Promise<any>) {
        await this.enter();
        try {
            await func();
        } finally {
            this.exit();
        }
    }
}

/** Just like CancellationToken[Source] on .NET */
export class CancelToken {
    cancelled = false;
    onCancelled = new Callbacks();
    cancel() {
        if (this.cancelled) return;
        this.cancelled = true;
        this.onCancelled.invoke();
    }
    throwIfCancelled() {
        if (this.cancelled)
            throw new Error("operation cancelled.");
    }
}

export class AutoResetEvent {
    private _whenNotify: Promise<void> | null = null;
    private _callback: Action | null = null;

    wait() {
        if (!this._whenNotify) {
            this._whenNotify = new Promise(r => {
                this._callback = () => {
                    this._callback = this._whenNotify = null;
                    r();
                };
            });
        }
        return this._whenNotify;
    }
    set() {
        this._callback && this._callback();
    }
}

export class EventRegistrations {
    list: { event: Callbacks; func: AnyFunc; }[] = [];
    add<T extends AnyFunc>(event: Callbacks<T>, func: T) {
        this.list.push({ event, func });
        event.add(func);
        return func;
    }
    removeAll() {
        while (this.list.length) {
            var r = this.list.pop()!;
            r.event.remove(r.func);
        }
    }
}
