"use strict";
// file: utils.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const I18n_1 = require("./I18n");
exports.i18n = I18n_1.i18n;
exports.I = I18n_1.I;
const _object_assign = Object.assign;
const _object_hasOwnProperty = Object.prototype.hasOwnProperty;
/** The name "utils" tells it all. */
exports.utils = new class Utils {
    constructor() {
        // Time & formatting utils:
        this.fileSizeUnits = ['B', 'KB', 'MB', 'GB'];
    }
    strPadLeft(str, len, ch = ' ') {
        while (str.length < len) {
            str = ch + str;
        }
        return str;
    }
    formatTime(sec) {
        if (typeof sec !== 'number' || isNaN(sec))
            return '--:--';
        var sec = Math.round(sec);
        var min = Math.floor(sec / 60);
        sec %= 60;
        return this.strPadLeft(min.toString(), 2, '0') + ':' + this.strPadLeft(sec.toString(), 2, '0');
    }
    formatFileSize(size) {
        if (typeof size !== "number" || isNaN(size))
            return 'NaN';
        var unit = 0;
        while (unit < this.fileSizeUnits.length - 1 && size >= 1024) {
            unit++;
            size /= 1024;
        }
        return size.toFixed(2) + ' ' + this.fileSizeUnits[unit];
    }
    formatDateTime(date) {
        var now = new Date();
        var sameday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
        return sameday ? date.toLocaleTimeString() : date.toLocaleString();
    }
    numLimit(num, min, max) {
        return (num < min || typeof num != 'number' || isNaN(num)) ? min :
            (num > max) ? max : num;
    }
    createName(nameFunc, existsFunc) {
        for (let num = 0;; num++) {
            let str = nameFunc(num);
            if (!existsFunc(str))
                return str;
        }
    }
    /**
     * btoa, but supports Unicode and uses UTF-8 encoding.
     * @see https://stackoverflow.com/questions/30106476
     */
    base64EncodeUtf8(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
            return String.fromCharCode(('0x' + p1));
        }));
    }
    sleepAsync(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        });
    }
    /** Remove all children from the node */
    clearChildren(node) {
        while (node.lastChild)
            node.removeChild(node.lastChild);
    }
    /** Remove all children from the node (if needed) and append one (if present) */
    replaceChild(node, newChild) {
        this.clearChildren(node);
        if (newChild)
            node.appendChild(newChild);
    }
    /** Add or remove a classname for the element
     * @param force - true -> add; false -> remove; undefined -> toggle.
     */
    toggleClass(element, clsName, force) {
        var clsList = element.classList;
        if (clsList.toggle)
            return clsList.toggle(clsName, force);
        if (force === undefined)
            force = !clsList.contains(clsName);
        if (force)
            clsList.add(clsName);
        else
            clsList.remove(clsName);
        return force;
    }
    /** Fade out the element and remove it */
    fadeout(element) {
        element.classList.add('fading-out');
        var cb = null;
        var end = () => {
            if (!end)
                return; // use a random variable as flag ;)
            end = null;
            element.removeEventListener('transitionend', onTransitionend);
            element.classList.remove('fading-out');
            element.remove();
            cb && cb();
        };
        var onTransitionend = function (e) {
            if (e.eventPhase === Event.AT_TARGET)
                end();
        };
        element.addEventListener('transitionend', onTransitionend);
        setTimeout(end, 350); // failsafe
        return {
            get finished() { return !end; },
            onFinished(callback) {
                if (!end)
                    callback();
                else
                    cb = callback;
            },
            cancel() { end === null || end === void 0 ? void 0 : end(); }
        };
    }
    listenPointerEvents(element, callback) {
        element.addEventListener('mousedown', function (e) {
            if (callback({ type: 'mouse', ev: e, point: e, action: 'down' }) === 'track') {
                var mousemove = function (e) {
                    callback({ type: 'mouse', ev: e, point: e, action: 'move' });
                };
                var mouseup = function (e) {
                    document.removeEventListener('mousemove', mousemove, true);
                    document.removeEventListener('mouseup', mouseup, true);
                    callback({ type: 'mouse', ev: e, point: e, action: 'up' });
                };
                document.addEventListener('mousemove', mousemove, true);
                document.addEventListener('mouseup', mouseup, true);
            }
        });
        var touchDown = false;
        element.addEventListener('touchstart', function (e) {
            var ct = e.changedTouches[0];
            var ret = callback({
                type: 'touch', touch: 'start', ev: e, point: ct,
                action: touchDown ? 'move' : 'down'
            });
            if (!touchDown && ret === 'track') {
                touchDown = true;
                var touchmove = function (e) {
                    var ct = e.changedTouches[0];
                    callback({ type: 'touch', touch: 'move', ev: e, point: ct, action: 'move' });
                };
                var touchend = function (e) {
                    if (e.touches.length === 0) {
                        touchDown = false;
                        element.removeEventListener('touchmove', touchmove);
                        element.removeEventListener('touchend', touchend);
                    }
                    var ct = e.changedTouches[0];
                    callback({
                        type: 'touch', touch: 'end', ev: e, point: ct,
                        action: touchDown ? 'move' : 'up'
                    });
                };
                element.addEventListener('touchmove', touchmove);
                element.addEventListener('touchend', touchend);
            }
        });
    }
    addEvent(element, event, handler) {
        element.addEventListener(event, handler);
        return {
            remove: () => element.removeEventListener(event, handler)
        };
    }
    arrayRemove(array, val) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === val) {
                array.splice(i, 1);
                i--;
            }
        }
    }
    arrayInsert(array, val, pos) {
        if (pos === undefined)
            array.push(val);
        else
            array.splice(pos, 0, val);
    }
    arrayMap(arr, func) {
        if (arr instanceof Array)
            return arr.map(func);
        var idx = 0;
        var ret = new Array(arr.length);
        for (var item of arr) {
            ret[idx] = (func(item, idx));
            idx++;
        }
        return ret;
    }
    arrayForeach(arr, func) {
        var idx = 0;
        for (var item of arr) {
            func(item, idx++);
        }
    }
    arrayFind(arr, func) {
        if (arr instanceof Array)
            return arr.find(func);
        var idx = 0;
        for (var item of arr) {
            if (func(item, idx++))
                return item;
        }
    }
    arraySum(arr, func) {
        var sum = 0;
        this.arrayForeach(arr, (x) => {
            var val = func(x);
            if (val)
                sum += val;
        });
        return sum;
    }
    objectApply(obj, kv, keys) {
        if (kv) {
            if (!keys)
                return _object_assign(obj, kv);
            for (const key in kv) {
                if (_object_hasOwnProperty.call(kv, key) && (!keys || keys.indexOf(key) >= 0)) {
                    const val = kv[key];
                    obj[key] = val;
                }
            }
        }
        return obj;
    }
    mod(a, b) {
        if (a < 0)
            a = b + a;
        return a % b;
    }
    readBlobAsDataUrl(blob) {
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = (ev) => {
                resolve(reader.result);
            };
            reader.onerror = (ev) => reject();
            reader.readAsDataURL(blob);
        });
    }
};
Array.prototype.remove = function (item) {
    exports.utils.arrayRemove(this, item);
};
class Timer {
    constructor(callback) {
        this.callback = callback;
        this.cancelFunc = undefined;
    }
    timeout(time) {
        this.tryCancel();
        var handle = setTimeout(this.callback, time);
        this.cancelFunc = () => window.clearTimeout(handle);
    }
    interval(time) {
        this.tryCancel();
        var handle = setInterval(this.callback, time);
        this.cancelFunc = () => window.clearInterval(handle);
    }
    tryCancel() {
        if (this.cancelFunc) {
            this.cancelFunc();
            this.cancelFunc = undefined;
        }
    }
}
exports.Timer = Timer;
exports.utils.Timer = Timer;
class BuildDOMCtx {
    constructor(dict) {
        this.dict = dict !== null && dict !== void 0 ? dict : {};
    }
    static EnsureCtx(ctxOrDict, origctx) {
        var ctx;
        if (ctxOrDict instanceof BuildDOMCtx)
            ctx = ctxOrDict;
        else
            ctx = new BuildDOMCtx(ctxOrDict);
        if (origctx) {
            if (!origctx.actions)
                origctx.actions = [];
            ctx.actions = origctx.actions;
        }
        return ctx;
    }
    setDict(key, node) {
        if (!this.dict)
            this.dict = {};
        this.dict[key] = node;
    }
    addUpdateAction(action) {
        if (!this.actions)
            this.actions = [];
        this.actions.push(action);
        // BuildDOMCtx.executeAction(action);
    }
    update() {
        if (!this.actions)
            return;
        for (const a of this.actions) {
            BuildDOMCtx.executeAction(a);
        }
    }
    static executeAction(a) {
        switch (a[0]) {
            case 'text':
                a[1].textContent = a[2]();
                break;
            case 'hidden':
                a[1].hidden = a[2]();
                break;
            case 'update':
                a[2](a[1]);
                break;
            default:
                console.warn('unknown action', a);
                break;
        }
    }
}
exports.BuildDOMCtx = BuildDOMCtx;
exports.utils.buildDOM = (() => {
    var createElementFromTag = function (tag) {
        var reg = /[#\.^]?[\w\-]+/y;
        var match;
        var ele;
        while (match = reg.exec(tag)) {
            var val = match[0];
            var ch = val[0];
            if (ch === '.') {
                ele.classList.add(val.substr(1));
            }
            else if (ch === '#') {
                ele.id = val.substr(1);
            }
            else {
                if (ele)
                    throw new Error('unexpected multiple tags');
                ele = document.createElement(val);
            }
        }
        return ele;
    };
    var buildDomCore = function (obj, ttl, ctx) {
        if (ttl-- < 0)
            throw new Error('ran out of TTL');
        if (typeof (obj) === 'string') {
            return document.createTextNode(obj);
        }
        if (Node && obj instanceof Node)
            return obj;
        if (obj['getDOM'])
            return obj['getDOM']();
        var node = createElementFromTag(obj.tag);
        if (obj['_ctx'])
            ctx = BuildDOMCtx.EnsureCtx(obj['_ctx'], ctx);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var val = obj[key];
                if (key === 'child') {
                    if (val instanceof Array) {
                        val.forEach(function (x) {
                            node.appendChild(buildDomCore(x, ttl, ctx));
                        });
                    }
                    else {
                        node.appendChild(buildDomCore(val, ttl, ctx));
                    }
                }
                else if (key === '_key') {
                    ctx.setDict(val, node);
                }
                else if (key === 'text') {
                    if (typeof val === 'function') {
                        ctx.addUpdateAction(['text', node, val]);
                    }
                    else {
                        node.textContent = val;
                    }
                }
                else if (key === 'hidden' && typeof val === 'function') {
                    ctx.addUpdateAction(['hidden', node, val]);
                }
                else if (key === 'update' && typeof val === 'function') {
                    ctx.addUpdateAction(['update', node, val]);
                }
                else if (key === 'init') {
                    // no-op
                }
                else {
                    node[key] = val;
                }
            }
            const init = obj['init'];
            if (init)
                init(node);
        }
        return node;
    };
    return function (obj, ctx) {
        return buildDomCore(obj, 32, ctx);
    };
})();
class SettingItem {
    constructor(key, type, initial) {
        this.key = key;
        type = this.type = typeof type === 'string' ? SettingItem.types[type] : type;
        if (!type || !type.serialize || !type.deserialize)
            throw new Error("invalid 'type' arugment");
        this.readFromStorage(initial);
    }
    readFromStorage(initial) {
        var str = this.key ? localStorage.getItem(this.key) : null;
        this.isInitial = !str;
        this.set(str ? this.type.deserialize(str) : initial, true);
    }
    render(fn, dontRaiseNow) {
        if (!dontRaiseNow)
            fn(this.data);
        var oldFn = this.onRender;
        var newFn = fn;
        if (oldFn)
            fn = function (x) { oldFn(x); newFn(x); };
        this.onRender = fn;
        return this;
    }
    ;
    bindToBtn(btn, prefix) {
        if (this.type !== SettingItem.types.bool)
            throw new Error('only for bool type');
        var span = document.createElement('span');
        btn.insertBefore(span, btn.firstChild);
        this.render(function (x) {
            btn.classList.toggle('disabled', !x);
            prefix = prefix || ["❌", "✅"];
            span.textContent = prefix[+x];
        });
        var thiz = this;
        btn.addEventListener('click', function () { thiz.toggle(); });
        return this;
    }
    ;
    remove() {
        localStorage.removeItem(this.key);
    }
    save() {
        this.isInitial = false;
        localStorage.setItem(this.key, this.type.serialize(this.data));
    }
    set(data, dontSave) {
        this.data = data;
        this.isInitial = false;
        this.onRender && this.onRender(data);
        if (!dontSave && this.key)
            this.save();
    }
    ;
    get() {
        return this.data;
    }
    ;
    toggle() {
        if (this.type !== SettingItem.types.bool)
            throw new Error('only for bool type');
        this.set((!this.data));
    }
    ;
    loop(arr) {
        var curData = this.data;
        var oldIndex = arr.findIndex(function (x) { return x === curData; });
        var newData = arr[(oldIndex + 1) % arr.length];
        this.set(newData);
    }
    ;
}
exports.SettingItem = SettingItem;
SettingItem.types = {
    bool: {
        serialize: function (data) { return data ? 'true' : 'false'; },
        deserialize: function (str) { return str === 'true' ? true : str === 'false' ? false : undefined; }
    },
    str: {
        serialize: function (x) { return x; },
        deserialize: function (x) { return x; }
    },
    json: {
        serialize: function (x) { return JSON.stringify(x); },
        deserialize: function (x) { return JSON.parse(x); }
    }
};
class Callbacks {
    constructor() {
        this.list = [];
    }
    invoke(...args) {
        this.list.forEach((x) => x.apply(this, args));
    }
    add(callback) {
        this.list.push(callback);
        return callback;
    }
    remove(callback) {
        this.list.remove(callback);
    }
}
exports.Callbacks = Callbacks;
class Lazy {
    constructor(func) {
        if (typeof func != 'function')
            throw new Error('func is not a function');
        this._func = func;
        this._value = undefined;
    }
    get computed() { return !this._func; }
    get rawValue() { return this._value; }
    get value() {
        if (this._func) {
            this._value = this._func();
            this._func = undefined;
        }
        return this._value;
    }
}
exports.Lazy = Lazy;
class Semaphore {
    constructor(init) {
        this.queue = new Array();
        this.maxCount = 1;
        this.runningCount = 0;
        exports.utils.objectApply(this, init);
    }
    enter() {
        if (this.runningCount === this.maxCount) {
            var resolve;
            var prom = new Promise((res) => { resolve = res; });
            this.queue.push(resolve);
            return prom;
        }
        else {
            this.runningCount++;
            return Promise.resolve();
        }
    }
    exit() {
        if (this.runningCount === this.maxCount && this.queue.length) {
            if (window.queueMicrotask) {
                window.queueMicrotask(this.queue.shift());
            }
            else {
                setTimeout(this.queue.shift(), 0);
            }
        }
        else {
            this.runningCount--;
        }
    }
    run(func) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.enter();
            try {
                yield func();
            }
            finally {
                this.exit();
            }
        });
    }
}
exports.Semaphore = Semaphore;
/** Just like CancellationToken[Source] on .NET */
class CancelToken {
    constructor() {
        this.cancelled = false;
        this.onCancelled = new Callbacks();
    }
    cancel() {
        if (this.cancelled)
            return;
        this.cancelled = true;
        this.onCancelled.invoke();
    }
    throwIfCancelled() {
        if (this.cancelled)
            throw new Error("operation cancelled.");
    }
}
exports.CancelToken = CancelToken;
class DataUpdatingHelper {
    update(newData) {
        const oldData = this.items;
        var dataDict = {};
        for (const n of newData) {
            dataDict[this.dataSelectId(n)] = n;
        }
        var itemDict = {};
        var removed = [];
        for (const d of oldData) {
            const id = this.selectId(d);
            if (dataDict[id] !== undefined) {
                itemDict[id] = d;
            }
            else {
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
            }
            else {
                this.addItem(n, pos);
            }
            pos++;
        }
    }
    selectId(obj) { return obj.id; }
    dataSelectId(obj) { return obj.id; }
    addItem(obj, pos) { }
    updateItem(old, data) { }
    removeItem(obj) { }
}
exports.DataUpdatingHelper = DataUpdatingHelper;
class EventRegistrations {
    constructor() {
        this.list = [];
    }
    add(event, func) {
        this.list.push({ event, func });
        event.add(func);
        return func;
    }
    removeAll() {
        while (this.list.length) {
            var r = this.list.pop();
            r.event.remove(r.func);
        }
    }
}
exports.EventRegistrations = EventRegistrations;
