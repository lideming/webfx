(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.webfx = {}));
}(this, (function (exports) { 'use strict';

    // file: utils.ts
    var __awaiter$1 = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const _object_assign = Object.assign;
    const _object_hasOwnProperty = Object.prototype.hasOwnProperty;
    /** The name "utils" tells it all. */
    var utils = new class Utils {
        constructor() {
            // Time & formatting utils:
            this.fileSizeUnits = ['B', 'KB', 'MB', 'GB'];
            /**
             * Build a DOM tree from a JavaScript object.
             * @example utils.buildDOM({
                    tag: 'div.item#firstitem',
                    child: ['Name: ', { tag: 'span.name', textContent: name } ],
                })
             */
            this.buildDOM = null; // It will be initialized by view.ts
            this.jsxFactory = null;
            this.jsx = null;
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
            sec = Math.round(sec);
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
            var sameday = date.getFullYear() === now.getFullYear()
                && date.getMonth() === now.getMonth()
                && date.getDate() === now.getDate();
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
        fadeout(element, options) {
            const { className = 'fading-out', duration = 500, waitTransition = true } = options || {};
            element.classList.add(className);
            var cb = null;
            var end = () => {
                if (!end)
                    return; // use a random variable as flag ;)
                end = null;
                if (waitTransition)
                    element.removeEventListener('transitionend', onTransitionend);
                element.classList.remove(className);
                element.remove();
                cb && cb();
            };
            if (waitTransition) {
                var onTransitionend = function (e) {
                    if (e.eventPhase === Event.AT_TARGET)
                        end();
                };
                element.addEventListener('transitionend', onTransitionend);
            }
            setTimeout(end, duration); // failsafe
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
        listenPointerEvents(element, callback, options) {
            var touchDown = false;
            var mouseDown = function (e) {
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
            };
            var touchStart = function (e) {
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
        listenEvent(element, event, handler) {
            element.addEventListener(event, handler);
            return {
                remove: () => element.removeEventListener(event, handler)
            };
        }
        listenEvents(element, events, handler) {
            events.forEach(event => element.addEventListener(event, handler));
            return {
                remove: () => events.forEach(event => element.removeEventListener(event, handler))
            };
        }
        injectCss(css, options) {
            var _a;
            document.head.appendChild(utils.buildDOM({ tag: (_a = options === null || options === void 0 ? void 0 : options.tag) !== null && _a !== void 0 ? _a : 'style', text: css }));
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
            return null;
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
        objectInit(obj, kv, keys) {
            if (kv) {
                for (const key in kv) {
                    if (_object_hasOwnProperty.call(kv, key) && (!keys || keys.indexOf(key) >= 0)) {
                        const val = kv[key];
                        if (key.startsWith("on") && obj[key] instanceof Callbacks) {
                            obj[key].add(val);
                        }
                        else {
                            obj[key] = val;
                        }
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
        utils.arrayRemove(this, item);
    };
    function startBlockingDetect(threshold = 20) {
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
    utils.Timer = Timer;
    class SettingItem {
        constructor(key, type, initial) {
            this.onRender = null;
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
            const oldFn = this.onRender;
            const newFn = fn;
            if (oldFn)
                fn = function (x) { oldFn(x); newFn(x); };
            this.onRender = fn;
            return this;
        }
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
        get() {
            return this.data;
        }
        toggle() {
            if (this.type !== SettingItem.types.bool)
                throw new Error('only for bool type');
            this.set((!this.data));
        }
        loop(arr) {
            var curData = this.data;
            var oldIndex = arr.findIndex(function (x) { return x === curData; });
            var newData = arr[(oldIndex + 1) % arr.length];
            this.set(newData);
        }
    }
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
    class CallbacksImpl extends Array {
        constructor() {
            super(...arguments);
            this._hook = undefined;
        }
        get onChanged() {
            var _a;
            (_a = this._hook) !== null && _a !== void 0 ? _a : (this._hook = new Callbacks());
            return this._hook;
        }
        invoke(...args) {
            this.forEach((x) => {
                try {
                    x.apply(this, args);
                }
                catch (error) {
                    console.error("Error in callback", error);
                }
            });
        }
        add(callback) {
            var _a;
            this.push(callback);
            (_a = this._hook) === null || _a === void 0 ? void 0 : _a.invoke(true, callback);
            return callback;
        }
        remove(callback) {
            var _a;
            super.remove(callback);
            (_a = this._hook) === null || _a === void 0 ? void 0 : _a.invoke(false, callback);
        }
    }
    const Callbacks = CallbacksImpl;
    class Ref {
        constructor() {
            this._value = undefined;
            this._onChanged = undefined;
        }
        get onChanged() {
            if (!this._onChanged)
                this._onChanged = new Callbacks();
            return this._onChanged;
        }
        get value() { return this._value; }
        set value(val) {
            this._value = val;
        }
    }
    class Lazy {
        constructor(func) {
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
    class Semaphore {
        constructor(init) {
            this.queue = new Array();
            this.maxCount = 1;
            this.runningCount = 0;
            utils.objectInit(this, init);
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
            return __awaiter$1(this, void 0, void 0, function* () {
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
        updateOrRebuildAll(newData) {
            this.update(newData);
            if (!this.isSame(newData))
                this.rebuildAll(newData);
        }
        isSame(newData) {
            var t = this.items[Symbol.iterator]();
            for (const n of newData) {
                var d = t.next();
                if (d.done)
                    return false;
                if (this.selectId(d.value) !== this.dataSelectId(n))
                    return false;
            }
            if (!t.next().done)
                return false;
            return true;
        }
        rebuildAll(newData) {
            var oldData = this.items;
            if (oldData instanceof Array) {
                for (let i = oldData.length - 1; i >= 0; i--) {
                    this.removeItem(oldData[i]);
                }
            }
            else {
                for (const o of oldData) {
                    this.removeItem(o);
                }
            }
            let i = 0;
            for (const n of newData) {
                this.addItem(n, i++);
            }
        }
        selectId(obj) { return obj.id; }
        dataSelectId(obj) { return obj.id; }
        addItem(obj, pos) { }
        updateItem(old, data) { }
        removeItem(obj) { }
    }
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
    class TextCompositionWatcher {
        constructor(dom) {
            this.onCompositingChanged = new Callbacks();
            this._isCompositing = false;
            this.dom = dom.getDOM();
            this.dom.addEventListener('compositionstart', (ev) => {
                this.isCompositing = true;
            });
            this.dom.addEventListener('compositionend', (ev) => {
                this.isCompositing = false;
            });
        }
        get isCompositing() { return this._isCompositing; }
        set isCompositing(val) {
            this._isCompositing = val;
            this.onCompositingChanged.invoke();
        }
    }
    class InputStateTracker {
        constructor(dom) {
            this.dom = dom;
            this.state = {
                mouseDown: false,
                mouseIn: false,
                focusIn: false,
            };
            this._removeEvents = null;
            this._removePointerEvents = null;
            this.onChanged = new Callbacks();
            this._removeEvents = utils.listenEvents(dom, ['mouseenter', 'mouseleave', 'focusin', 'focusout'], (e) => {
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
            this._removePointerEvents = utils.listenPointerEvents(dom, (e) => {
                if (e.action == 'down') {
                    this.stateChanged('mouseDown', true);
                    return 'track';
                }
                else if (e.action == 'up') {
                    this.stateChanged('mouseDown', false);
                }
            }).remove;
        }
        stateChanged(state, val) {
            this.state[state] = val;
            this.onChanged.invoke(state);
        }
        removeListeners() {
            var _a, _b;
            (_a = this._removeEvents) === null || _a === void 0 ? void 0 : _a.call(this);
            (_b = this._removePointerEvents) === null || _b === void 0 ? void 0 : _b.call(this);
            this._removePointerEvents = this._removeEvents = null;
        }
    }

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
    function tryHandleValues(obj, ctx) {
        if (typeof (obj) === 'string') {
            return document.createTextNode(obj);
        }
        if (typeof obj === 'function') {
            const val = obj();
            if (!val || typeof val !== 'object') {
                const node = document.createTextNode(val);
                ctx === null || ctx === void 0 ? void 0 : ctx.addUpdateAction(['text', node, obj]);
                return node;
            }
            else {
                throw new Error('Unexpected function return value');
            }
        }
        if (Node && obj instanceof Node)
            return obj;
        return null;
    }
    var buildDomCore = function (obj, ttl, ctx) {
        if (ttl-- < 0)
            throw new Error('ran out of TTL');
        var r = tryHandleValues(obj, ctx);
        if (r)
            return r;
        if (obj instanceof JsxNode)
            return obj.buildDom(ctx, ttl);
        if ('getDOM' in obj)
            return obj.getDOM();
        const tag = obj.tag;
        if (!tag)
            throw new Error('no tag');
        var node = createElementFromTag(tag);
        if (obj['_ctx'])
            ctx = BuildDOMCtx.EnsureCtx(obj['_ctx'], ctx);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var val = obj[key];
                buildDOMHandleKey(key, val, node, ctx, ttl);
            }
        }
        const init = obj['init'];
        if (init)
            init(node);
        return node;
    };
    var buildDOMHandleKey = function (key, val, node, ctx, ttl) {
        if (key === 'child') {
            if (val instanceof Array) {
                val.forEach(function (val) {
                    if (val instanceof Array) {
                        val.forEach(function (val) {
                            node.appendChild(buildDomCore(val, ttl, ctx));
                        });
                    }
                    else {
                        node.appendChild(buildDomCore(val, ttl, ctx));
                    }
                });
            }
            else {
                node.appendChild(buildDomCore(val, ttl, ctx));
            }
        }
        else if (key === '_key') {
            ctx.setDict(val, node);
        }
        else if (key === 'ref') {
            val.value = node;
        }
        else if (key === 'text') {
            if (typeof val === 'function') {
                ctx.addUpdateAction(['text', node, val]);
            }
            else {
                node.textContent = val;
            }
        }
        else if (key === 'class') {
            node.className = val;
        }
        else if (key === 'hidden' && typeof val === 'function') {
            ctx.addUpdateAction(['hidden', node, val]);
        }
        else if (key === 'update' && typeof val === 'function') {
            ctx.addUpdateAction(['update', node, val]);
        }
        else if (key === 'init') ;
        else {
            node[key] = val;
        }
    };
    const buildDOM = utils.buildDOM = function (obj, ctx) {
        return buildDomCore(obj, 32, ctx);
    };
    class JsxNode {
        constructor(tag, attrs, childs) {
            this.tag = tag;
            this.attrs = attrs;
            this.child = childs;
        }
        getDOM() {
            return this.buildDom(null, 64);
        }
        buildDom(ctx, ttl) {
            return this.buildView(ctx, ttl).getDOM();
        }
        buildView(ctx, ttl) {
            if (ttl-- < 0)
                throw new Error('ran out of TTL');
            let view;
            if (typeof this.tag === 'string') {
                const dom = document.createElement(this.tag);
                view = dom;
                if (this.attrs) {
                    for (const key in this.attrs) {
                        if (Object.prototype.hasOwnProperty.call(this.attrs, key)) {
                            const val = this.attrs[key];
                            buildDOMHandleKey(key, val, dom, ctx, ttl);
                        }
                    }
                    const init = this.attrs['init'];
                    if (init)
                        init(dom);
                }
            }
            else {
                view = this.tag;
                if (this.attrs) {
                    let init = null;
                    for (const key in this.attrs) {
                        if (Object.prototype.hasOwnProperty.call(this.attrs, key)) {
                            const val = this.attrs[key];
                            if (key == "init") {
                                init = val;
                            }
                            else if (key == "ref") {
                                val.value = view;
                            }
                            else if (key.startsWith("on") && view[key] instanceof Callbacks) {
                                view[key].add(val);
                            }
                            else {
                                view[key] = val;
                            }
                        }
                    }
                    if (init)
                        init(view);
                }
            }
            if (this.child)
                for (const it of this.child) {
                    if (it instanceof Array) {
                        it.forEach(it => view.addChild(jsxBuildCore(it, ttl, ctx)));
                    }
                    else {
                        view.addChild(jsxBuildCore(it, ttl, ctx));
                    }
                }
            return view;
        }
        addChild(child) {
            if (this.child == null)
                this.child = [];
            this.child.push(child);
        }
    }
    function jsxBuildCore(node, ttl, ctx) {
        if (ttl-- < 0)
            throw new Error('ran out of TTL');
        var r = tryHandleValues(node, ctx);
        if (r)
            return r;
        if (node instanceof JsxNode) {
            return node.buildView(ctx, ttl);
        }
        else {
            throw new Error("Unknown node type");
        }
    }
    function jsxBuild(node, ctx) {
        return jsxBuildCore(node, 64, ctx || new BuildDOMCtx());
    }
    function jsxFactory(tag, attrs, ...childs) {
        if (typeof tag === 'string') {
            return new JsxNode(tag, attrs, childs);
        }
        else {
            const view = (attrs === null || attrs === void 0 ? void 0 : attrs.args) ?
                new tag(...attrs.args) :
                new tag();
            return new JsxNode(view, attrs, childs);
        }
    }
    const jsx = utils.jsx = utils.jsxFactory = jsxFactory;
    class View {
        constructor(dom) {
            this.parentView = undefined;
            this._position = undefined;
            this.domctx = new BuildDOMCtx();
            this._dom = undefined;
            this._onActive = undefined;
            if (dom)
                this.domExprCreated(dom);
        }
        static getView(obj) { return obj instanceof View ? obj : new View(obj); }
        get position() { return this._position; }
        get domCreated() { return !!this._dom; }
        get dom() {
            this.ensureDom();
            return this._dom;
        }
        get hidden() { return this.dom.hidden; }
        set hidden(val) { this.dom.hidden = val; }
        ensureDom() {
            if (!this._dom) {
                var r = this.createDom();
                this.domExprCreated(r);
            }
        }
        domExprCreated(r) {
            this._dom = utils.buildDOM(r, this.domctx);
            this.postCreateDom();
            this.updateDom();
        }
        createDom() {
            return document.createElement('div');
        }
        /** Will be called when the dom is created */
        postCreateDom() {
        }
        /** Will be called when the dom is created, after postCreateDom() */
        updateDom() {
            this.domctx.update();
        }
        /** Assign key-values and call `updateDom()` */
        updateWith(kv) {
            utils.objectApply(this, kv);
            this.updateDom();
        }
        toggleClass(clsName, force) {
            utils.toggleClass(this.dom, clsName, force);
        }
        appendView(view) { return this.dom.appendView(view); }
        getDOM() { return this.dom; }
        addChild(child) {
            if (child instanceof View) {
                this.appendView(child);
            }
            else {
                this.dom.appendChild(utils.buildDOM(child));
            }
        }
        get onActive() {
            if (!this._onActive) {
                this._onActive = new Callbacks();
                this.dom.addEventListener('click', (e) => {
                    this._onActive.invoke(e);
                });
                this.dom.addEventListener('keydown', (e) => {
                    this.handleKeyDown(e);
                });
            }
            return this._onActive;
        }
        handleKeyDown(e) {
            var _a;
            if (e.code === 'Enter') {
                const rect = this.dom.getBoundingClientRect();
                (_a = this._onActive) === null || _a === void 0 ? void 0 : _a.invoke(new MouseEvent('click', {
                    clientX: rect.x, clientY: rect.y,
                    relatedTarget: this.dom
                }));
                e.preventDefault();
            }
        }
    }
    Node.prototype.getDOM = function () { return this; };
    Node.prototype.addChild = function (child) {
        this.appendChild(utils.buildDOM(child));
    };
    Node.prototype.appendView = function (view) {
        this.appendChild(view.dom);
    };
    class ContainerView extends View {
        constructor() {
            super(...arguments);
            this.items = [];
        }
        appendView(view) {
            this.addView(view);
        }
        addView(view, pos) {
            const items = this.items;
            if (view.parentView)
                throw new Error('the view is already in a container view');
            view.parentView = this;
            if (pos === undefined) {
                view._position = items.length;
                items.push(view);
                this._insertToDom(view, items.length - 1);
            }
            else {
                items.splice(pos, 0, view);
                for (let i = pos; i < items.length; i++) {
                    items[i]._position = i;
                }
                this._insertToDom(view, pos);
            }
        }
        removeView(view) {
            view = this._ensureItem(view);
            this._removeFromDom(view);
            var pos = view._position;
            view.parentView = view._position = undefined;
            this.items.splice(pos, 1);
            for (let i = pos; i < this.items.length; i++) {
                this.items[i]._position = i;
            }
        }
        removeAllView() {
            while (this.length)
                this.removeView(this.length - 1);
        }
        updateChildrenDom() {
            for (const item of this.items) {
                item.updateDom();
            }
        }
        _insertToDom(item, pos) {
            var _a;
            if (pos == this.items.length - 1)
                this.dom.appendChild(item.dom);
            else
                this.dom.insertBefore(item.dom, ((_a = this.items[pos + 1]) === null || _a === void 0 ? void 0 : _a.dom) || null);
        }
        _removeFromDom(item) {
            if (item.domCreated)
                item.dom.remove();
        }
        _ensureItem(item) {
            if (typeof item === 'number')
                item = this.items[item];
            else if (!item)
                throw new Error('item is null or undefined.');
            else if (item.parentView !== this)
                throw new Error('the item is not in this listview.');
            return item;
        }
        [Symbol.iterator]() { return this.items[Symbol.iterator](); }
        get length() { return this.items.length; }
        get(idx) {
            return this.items[idx];
        }
        map(func) { return utils.arrayMap(this, func); }
        find(func) { return utils.arrayFind(this, func); }
        forEach(func) { return utils.arrayForeach(this, func); }
    }

    // file: I18n.ts
    /** Internationalization (aka i18n) helper class */
    class I18n {
        constructor() {
            this.data = {};
            this.curLang = 'en';
            this.missing = new Map();
        }
        /** Get i18n string for `key`, return `key` when not found. */
        get(key, arg) {
            return this.get2(key, arg) || key;
        }
        /** Get i18n string for `key`, return `null` when not found. */
        get2(key, arg, lang) {
            lang = lang || this.curLang;
            var langObj = this.data[lang];
            if (!langObj) {
                console.log('i18n missing lang: ' + lang);
                return null;
            }
            var r = langObj[key];
            if (!r) {
                if (!this.missing.has(key)) {
                    this.missing.set(key, 1);
                    console.log('i18n missing key: ' + key);
                }
                return null;
            }
            if (arg) {
                for (const key in arg) {
                    if (arg.hasOwnProperty(key)) {
                        const val = arg[key];
                        r = r.replace('{' + key + '}', val);
                        // Note that it only replaces the first occurrence.
                    }
                }
            }
            return r;
        }
        /** Fills data with an 2darray */
        add2dArray(array) {
            const langObjs = [];
            const langs = array[0];
            for (const lang of langs) {
                langObjs.push(this.data[lang] = this.data[lang] || {});
            }
            for (let i = 1; i < array.length; i++) {
                const line = array[i];
                const key = line[0];
                for (let j = 0; j < line.length; j++) {
                    const val = line[j];
                    langObjs[j][key] = val;
                }
            }
        }
        renderElements(elements) {
            console.log('i18n elements rendering');
            elements.forEach(x => {
                for (const node of x.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // console.log('node', node);
                        var r = this.get2(node.beforeI18n || node.textContent);
                        if (r) {
                            node.beforeI18n = node.beforeI18n || node.textContent;
                            node.textContent = r;
                        }
                        else {
                            if (node.beforeI18n) {
                                node.textContent = node.beforeI18n;
                            }
                            console.log('missing key for node', node);
                        }
                    }
                }
            });
        }
        /**
         * Detect the best available language using
         * the user language preferences provided by the browser.
         * @param langs Available languages
         */
        static detectLanguage(langs) {
            var cur = null;
            var curIdx = -1;
            var languages = [];
            // ['en-US'] -> ['en-US', 'en']
            (navigator.languages || [navigator.language]).forEach(lang => {
                languages.push(lang);
                if (lang.indexOf('-') > 0)
                    languages.push(lang.substr(0, lang.indexOf('-')));
            });
            langs.forEach((l) => {
                var idx = languages.indexOf(l);
                if (!cur || (idx !== -1 && idx < curIdx)) {
                    cur = l;
                    curIdx = idx;
                }
            });
            return cur || langs[0];
        }
    }
    function createStringBuilder(i18n) {
        var arrBuilder = createArrayBuilder(i18n);
        return function (literals, ...placeholders) {
            if (placeholders.length === 0) {
                return i18n.get(literals[0]);
            }
            return arrBuilder(literals, ...placeholders).join('');
        };
    }
    function createArrayBuilder(i18n) {
        var formatCache = new WeakMap();
        var parseCache = new Map();
        return function (literals, ...placeholders) {
            if (placeholders.length === 0) {
                return [i18n.get(literals[0])];
            }
            // Generate format string from template string if it's not cached:
            let format = formatCache.get(literals);
            if (format === undefined) {
                format = '';
                for (let i = 0; i < literals.length; i++) {
                    const lit = literals[i];
                    format += lit;
                    if (i < placeholders.length) {
                        format += '{' + i + '}';
                    }
                }
                formatCache.set(literals, format);
            }
            const translatedFormat = i18n.get(format);
            // Also cache parsed template
            let parsed = parseCache.get(translatedFormat);
            if (parsed === undefined) {
                parsed = parseTemplate(translatedFormat);
            }
            return parsed.map(x => typeof x == 'number' ? placeholders[x] : x);
        };
    }
    function parseTemplate(template) {
        const result = [];
        let state = 0; // 0: normal / 1: after '{' / 2: after '}' / 3: after '{' and numbers
        let buf = '';
        for (let i = 0; i < template.length; i++) {
            const ch = template[i];
            switch (ch) {
                case '{':
                    if (state == 0)
                        state = 1;
                    else if (state == 1) {
                        state = 0;
                        buf += '{';
                    }
                    else
                        throw new Error(`Expected number, got '${ch}' at ${i}`);
                    break;
                case '}':
                    if (state == 3) {
                        state = 0;
                        result.push(+buf);
                        buf = '';
                    }
                    else if (state == 0) {
                        state = 2;
                    }
                    else if (state == 2) {
                        state = 0;
                        buf += '}';
                    }
                    else
                        throw new Error(`Expected number, got '${ch}' at ${i}`);
                    break;
                default:
                    if (state == 2)
                        throw new Error(`Expected '}', got '${ch}' at ${i}`);
                    else if (state == 1) {
                        state = 3;
                        if (buf)
                            result.push(buf);
                        buf = '';
                    }
                    buf += ch;
            }
        }
        if (state != 0)
            throw new Error("Unexpected end of template string");
        if (buf)
            result.push(buf);
        return result;
    }
    var i18n = new I18n();
    const I = createStringBuilder(i18n);

    const version = "1.6.0";

    var css = ":root {--color-bg: white;--color-text: black;--color-text-gray: #666;--color-bg-selection: hsl(5, 100%, 85%);--color-primary: hsl(5, 100%, 67%);--color-primary-darker: hsl(5, 100%, 60%);--color-primary-dark: hsl(5, 100%, 40%);--color-primary-dark-depends: hsl(5, 100%, 40%);--color-primary-verydark: hsl(5, 100%, 20%);--color-primary-light: hsl(5, 100%, 83%);--color-primary-lighter: hsl(5, 100%, 70%);--color-fg-11: #111111;--color-fg-22: #222222;--color-fg-33: #333333;--color-bg-cc: #cccccc;--color-bg-dd: #dddddd;--color-bg-ee: #eeeeee;--color-bg-f8: #f8f8f8;--color-shadow: rgba(0, 0, 0, .5);}.no-selection {user-select: none;-ms-user-select: none;-moz-user-select: none;-webkit-user-select: none;}/* listview item */.item {display: block;position: relative;padding: 10px;/* background: #ddd; *//* animation: showing .3s forwards; */text-decoration: none;line-height: 1.2;}a.item {color: inherit;}.clickable, .item {cursor: pointer;transition: transform .3s;-webkit-tap-highlight-color: transparent;}.item:hover, .dragover {background: var(--color-bg-ee);}.keyboard-input .item:focus {outline-offset: -2px;}.dragover-placeholder {/* border-top: 2px solid gray; */position: relative;}.dragover-placeholder::before {content: \"\";display: block;position: absolute;transform: translate(0, -1px);height: 2px;width: 100%;background: gray;z-index: 100;pointer-events: none;}.clickable:active, .item:active {transition: transform .07s;transform: scale(.97);}.item:active {background: var(--color-bg-dd);}.item.no-transform:active {transform: none;}.item.active {background: var(--color-bg-dd);}.loading-indicator {position: relative;margin: .3em;margin-top: 3em;margin-bottom: 1em;text-align: center;white-space: pre-wrap;cursor: default;animation: loading-fadein .3s;}.loading-indicator-text {margin: 0 auto;}.loading-indicator.running .loading-indicator-inner {display: inline-block;position: relative;vertical-align: bottom;}.loading-indicator.running .loading-indicator-inner::after {content: \"\";height: 1px;margin: 0%;background: var(--color-text);display: block;animation: fadein .5s 1s backwards;}.loading-indicator.running .loading-indicator-text {margin: 0 .5em;animation: fadein .3s, loading-first .3s .5s cubic-bezier(0.55, 0.055, 0.675, 0.19) reverse, loading-second .3s .8s cubic-bezier(0.55, 0.055, 0.675, 0.19), loading .25s 1.1s cubic-bezier(0.55, 0.055, 0.675, 0.19) alternate-reverse infinite;}.loading-indicator.error {color: red;}.loading-indicator.fading-out {transition: max-height;animation: loading-fadein .3s reverse;}@keyframes loading-fadein {0% {opacity: 0;max-height: 0;}100% {opacity: 1;max-height: 200px;}}@keyframes fadein {0% {opacity: 0;}100% {opacity: 1;}}@keyframes loading-first {0% {transform: translate(0, -2em) scale(1) rotate(360deg);}100% {transform: translate(0, 0) scale(1) rotate(0deg);}}@keyframes loading-second {0% {transform: translate(0, -2em);}100% {transform: translate(0, 0);}}@keyframes loading {0% {transform: translate(0, -1em);}100% {transform: translate(0, 0);}}@keyframes showing {0% {opacity: .3;transform: translate(-20px, 0)}100% {opacity: 1;transform: translate(0, 0)}}@keyframes showing-top {0% {opacity: .3;transform: translate(0, -20px)}100% {opacity: 1;transform: translate(0, 0)}}@keyframes showing-right {0% {opacity: .3;transform: translate(20px, 0)}100% {opacity: 1;transform: translate(0, 0)}}.overlay {background: rgba(0, 0, 0, .2);position: absolute;top: 0;left: 0;right: 0;bottom: 0;animation: fadein .3s;z-index: 10001;overflow: hidden;contain: strict;will-change: transform;}.overlay.fixed {position: fixed;}.overlay.nobg {background: none;will-change: auto;}.overlay.centerchild {display: flex;align-items: center;justify-content: center;}.dialog * {box-sizing: border-box;}.dialog {font-size: 14px;position: relative;overflow: auto;background: var(--color-bg);border-radius: 5px;box-shadow: 0 0 12px var(--color-shadow);animation: dialogin .2s ease-out;z-index: 10001;display: flex;flex-direction: column;max-height: 100%;contain: content;will-change: transform;}.dialog.resize {resize: both;}.fading-out .dialog {transition: transform .3s ease-in;transform: scale(.85);}.dialog-title, .dialog-content, .dialog-bottom {padding: 10px;}.dialog-title {background: var(--color-bg-ee);}.dialog-content {flex: 1;padding: 5px 10px;overflow: auto;}.dialog-content.flex {display: flex;flex-direction: column;}.dialog-bottom {padding: 5px 10px;}@keyframes dialogin {0% {transform: scale(.85);}100% {transform: scale(1);}}.input-label {font-size: 80%;color: var(--color-text-gray);margin: 5px 0 3px 0;}.input-text {display: block;width: 100%;padding: 5px;border: solid 1px gray;background: var(--color-bg);color: var(--color-text);}.dialog .input-text {margin: 5px 0;}textarea.input-text {resize: vertical;}.labeled-input {display: flex;flex-direction: column;}.labeled-input .input-text {flex: 1;}.labeled-input:focus-within .input-label {color: var(--color-primary-darker);}.input-text:focus {border-color: var(--color-primary-darker);}.input-text:active {border-color: var(--color-primary-dark);}.btn {display: block;text-align: center;transition: all .2s;padding: 0 .4em;min-width: 3em;line-height: 1.5em;background: var(--color-primary);color: white;text-shadow: 0 0 4px var(--color-primary-verydark);box-shadow: 0 0 3px var(--color-shadow);cursor: pointer;-ms-user-select: none;-moz-user-select: none;-webkit-user-select: none;user-select: none;position: relative;overflow: hidden;}.btn:hover {transition: all .05s;background: var(--color-primary-darker);}.btn.btn-down, .btn:active {transition: all .05s;background: var(--color-primary-dark);box-shadow: 0 0 1px var(--color-shadow);}.btn.disabled {background: var(--color-primary-light);}.dialog .btn {margin: 10px 0;}.btn-big {padding: 5px;}.tab {display: inline-block;color: var(--color-text-gray);margin: 0 5px;}.tab.active {color: var(--color-text);}*[hidden] {display: none !important;}.context-menu {position: absolute;overflow-y: auto;background: var(--color-bg);border: solid 1px #777;box-shadow: 0 0px 12px var(--color-shadow);min-width: 100px;max-width: 450px;outline: none;z-index: 10001;animation: context-menu-in .2s ease-out forwards;will-change: transform;}.context-menu .item.dangerous {transition: color .3s, background .3s;color: red;}.context-menu .item.dangerous:hover {transition: color .1s, background .1s;background: red;color: white;}@keyframes context-menu-in {0% {transform: scale(.9);}100% {transform: scale(1);}}*.menu-shown {background: var(--color-bg-dd);}.menu-info {white-space: pre-wrap;color: var(--color-text-gray);padding: 5px 10px;/* animation: showing .3s; */cursor: default;}.toasts-container {position: fixed;bottom: 0;right: 0;padding: 5px;width: 300px;z-index: 10001;overflow: hidden;}.toast {margin: 5px;padding: 10px;border-radius: 5px;box-shadow: 0 0 10px var(--color-shadow);background: var(--color-bg);white-space: pre-wrap;animation: showing-right .3s;}.fading-out {transition: opacity .3s;opacity: 0;pointer-events: none;}.anchor-bottom {transform: translate(-50%, -100%);}.tooltip {position: absolute;background: var(--color-bg);box-shadow: 0 0 5px var(--color-shadow);border-radius: 5px;padding: .2em .25em;}";

    // file: viewlib.ts
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    function getWebfxCss() { return css; }
    let cssInjected = false;
    function injectWebfxCss() {
        if (!cssInjected) {
            utils.injectCss(getWebfxCss(), { tag: 'style.webfx-injected-style' });
            cssInjected = true;
        }
    }
    /** DragManager is used to help exchange information between views */
    var dragManager = new class DragManager {
        constructor() {
            /** The item being dragged */
            this._currentItem = null;
            this._currentArray = null;
            this.onDragStart = new Callbacks();
            this.onDragEnd = new Callbacks();
        }
        get currentItem() { var _a, _b, _c; return (_c = (_a = this._currentItem) !== null && _a !== void 0 ? _a : (_b = this._currentArray) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : null; }
        ;
        get currentArray() {
            if (this._currentItem)
                return [this._currentItem];
            return this._currentArray;
        }
        start(item) {
            this._currentItem = item;
            console.log('drag start', item);
            this.onDragStart.invoke();
        }
        startArray(arr) {
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
    class ListViewItem extends View {
        constructor() {
            super(...arguments);
            this.dragging = undefined;
            this._selected = false;
            this.onSelectedChanged = new Callbacks();
            // https://stackoverflow.com/questions/7110353
            this.enterctr = 0;
            this.dragoverPlaceholder = null;
        }
        get listview() { return this.parentView; }
        get selectionHelper() { return this.listview.selectionHelper; }
        get dragData() { return this.dom.textContent; }
        get selected() { return this._selected; }
        set selected(v) {
            this._selected = v;
            this.domCreated && this.updateDom();
            this.onSelectedChanged.invoke();
        }
        remove() {
            if (!this.listview)
                return;
            this.listview.remove(this);
        }
        postCreateDom() {
            super.postCreateDom();
            this.dom.setAttribute('role', 'listitem');
            this.dom.addEventListener('click', (ev) => {
                var _a, _b, _c;
                if ((_a = this.listview) === null || _a === void 0 ? void 0 : _a.selectionHelper.handleItemClicked(this, ev))
                    return;
                (_c = (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onItemClicked) === null || _c === void 0 ? void 0 : _c.call(_b, this);
            });
            this.dom.addEventListener('keydown', (ev) => {
                var _a, _b, _c, _d, _e, _f;
                if (ev.code === 'Enter') {
                    if (ev.altKey) {
                        const rect = this.dom.getBoundingClientRect();
                        const mouseev = new MouseEvent('contextmenu', {
                            clientX: rect.left, clientY: rect.top,
                            relatedTarget: this.dom
                        });
                        (_c = ((_a = this.onContextMenu) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onContextMenu)) === null || _c === void 0 ? void 0 : _c(this, mouseev);
                    }
                    else {
                        if ((_d = this.listview) === null || _d === void 0 ? void 0 : _d.selectionHelper.handleItemClicked(this, ev))
                            return;
                        (_f = (_e = this.listview) === null || _e === void 0 ? void 0 : _e.onItemClicked) === null || _f === void 0 ? void 0 : _f.call(_e, this);
                    }
                    ev.preventDefault();
                }
                else if (this.listview && (ev.code === 'ArrowUp' || ev.code === 'ArrowDown')) {
                    const direction = ev.code === 'ArrowUp' ? -1 : 1;
                    const item = this.listview.get(this.position + direction);
                    if (item) {
                        item.dom.focus();
                        ev.preventDefault();
                    }
                }
                else if (this.listview && (ev.code === 'PageUp' || ev.code === 'PageDown')) {
                    const dir = ev.code === 'PageUp' ? -1 : 1;
                    const scrollBox = this.listview.scrollBox;
                    const targetY = dir > 0 ? (this.dom.offsetTop + scrollBox.offsetHeight)
                        : (this.dom.offsetTop + this.dom.offsetHeight - scrollBox.offsetHeight);
                    const len = this.listview.length;
                    let item = this;
                    while (dir > 0 ? (targetY > item.dom.offsetTop + item.dom.offsetHeight)
                        : (targetY < item.dom.offsetTop)) {
                        const nextIdx = item.position + dir;
                        if (nextIdx < 0 || nextIdx >= len)
                            break;
                        item = this.listview.get(nextIdx);
                    }
                    if (item && item !== this) {
                        item.dom.focus();
                        ev.preventDefault();
                    }
                }
                else if (this.listview && (ev.code === 'Home' || ev.code === 'End')) {
                    this.listview.get(ev.code == 'Home' ? 0 : (this.listview.length - 1)).dom.focus();
                    ev.preventDefault();
                }
                else if (this.listview && this.listview.selectionHelper.handleItemKeyDown(this, ev)) ;
            });
            this.dom.addEventListener('contextmenu', (ev) => {
                var _a, _b, _c;
                (_c = ((_a = this.onContextMenu) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onContextMenu)) === null || _c === void 0 ? void 0 : _c(this, ev);
            });
            this.dom.addEventListener('dragstart', (ev) => {
                var _a, _b;
                if (!((_a = this.dragging) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.dragging)) {
                    ev.preventDefault();
                    return;
                }
                var arr = [];
                if (this.selected) {
                    arr = [...this.selectionHelper.selectedItems];
                    arr.sort((a, b) => a.position - b.position); // remove this line to get a new feature!
                }
                else {
                    arr = [this];
                }
                dragManager.startArray(arr);
                ev.dataTransfer.setData('text/plain', arr.map(x => x.dragData).join('\r\n'));
                arr.forEach(x => x.dom.style.opacity = '.5');
            });
            this.dom.addEventListener('dragend', (ev) => {
                var arr = dragManager.currentArray;
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
        dragHandler(ev, type) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const item = dragManager.currentItem;
            let items = dragManager.currentArray;
            const drop = type === 'drop';
            const arg = {
                source: item, target: this,
                sourceItems: items,
                event: ev, drop: drop,
                accept: false
            };
            if (item instanceof ListViewItem) {
                if (((_a = this.listview) === null || _a === void 0 ? void 0 : _a.moveByDragging) && item.listview === this.listview) {
                    ev.preventDefault();
                    const selfInside = (items.indexOf(this) >= 0);
                    const after = ev.clientY - this.dom.getBoundingClientRect().top > this.dom.offsetHeight / 2;
                    if (!(selfInside && drop))
                        arg.accept = after ? 'move-after' : 'move';
                    if (!drop) {
                        ev.dataTransfer.dropEffect = 'move';
                    }
                    else {
                        if (items.indexOf(this) === -1) {
                            let newpos = this.position;
                            if (after)
                                newpos++;
                            for (const it of items) {
                                if (it !== this) {
                                    if (newpos > it.position)
                                        newpos--;
                                    this.listview.move(it, newpos);
                                    newpos++;
                                }
                            }
                        }
                    }
                }
            }
            const onDragover = (_b = this.onDragover) !== null && _b !== void 0 ? _b : (_c = this.listview) === null || _c === void 0 ? void 0 : _c.onDragover;
            if (!arg.accept && onDragover) {
                onDragover(arg);
                if (drop || arg.accept)
                    ev.preventDefault();
            }
            const onContextMenu = (_d = this.onContextMenu) !== null && _d !== void 0 ? _d : (_e = this.listview) === null || _e === void 0 ? void 0 : _e.onContextMenu;
            if (!arg.accept && items && items.indexOf(this) >= 0 && onContextMenu) {
                if (drop)
                    onContextMenu(this, ev);
                else
                    ev.preventDefault();
            }
            if (type === 'dragenter' || type == 'dragover' || type === 'dragleave' || drop) {
                if (type === 'dragenter') {
                    this.enterctr++;
                }
                else if (type === 'dragleave') {
                    this.enterctr--;
                }
                else if (type === 'drop') {
                    this.enterctr = 0;
                }
                let hover = this.enterctr > 0;
                this.toggleClass('dragover', hover);
                let placeholder = hover && (arg.accept === 'move' || arg.accept === 'move-after') && arg.accept;
                if (placeholder != ((_g = (_f = this.dragoverPlaceholder) === null || _f === void 0 ? void 0 : _f[1]) !== null && _g !== void 0 ? _g : false)) {
                    (_h = this.dragoverPlaceholder) === null || _h === void 0 ? void 0 : _h[0].remove();
                    this.dragoverPlaceholder = null;
                    if (placeholder) {
                        this.dragoverPlaceholder = [
                            utils.buildDOM({ tag: 'div.dragover-placeholder' }),
                            placeholder
                        ];
                        var before = this.dom;
                        if (arg.accept === 'move-after')
                            before = before.nextElementSibling;
                        this.dom.parentElement.insertBefore(this.dragoverPlaceholder[0], before);
                    }
                }
            }
        }
        ;
    }
    class ListView extends ContainerView {
        constructor(container) {
            super(container);
            // private items: Array<T> = [];
            this.onItemClicked = null;
            /**
             * Allow user to drag an item.
             */
            this.dragging = false;
            /**
             * Allow user to drag an item and change its position.
             */
            this.moveByDragging = false;
            this.selectionHelper = new SelectionHelper();
            this._scrollBox = null;
            this.onItemMoved = null;
            /**
             * When dragover or drop
             */
            this.onDragover = null;
            this.onContextMenu = null;
            this.selectionHelper.itemProvider = this;
        }
        get scrollBox() { return this._scrollBox || this.dom; }
        set scrollBox(val) { this._scrollBox = val; }
        postCreateDom() {
            super.postCreateDom();
            this.dom.setAttribute('role', 'list');
        }
        add(item, pos) {
            this.addView(item, pos);
            if (this.dragging)
                item.dom.draggable = true;
        }
        remove(item, keepSelected) {
            item = this._ensureItem(item);
            if (!keepSelected && item.selected)
                this.selectionHelper.toggleItemSelection(item);
            this.removeView(item);
        }
        move(item, newpos) {
            var _a;
            item = this._ensureItem(item);
            this.remove(item, true);
            this.add(item, newpos);
            (_a = this.onItemMoved) === null || _a === void 0 ? void 0 : _a.call(this, item, item.position);
        }
        /** Remove all items */
        removeAll() {
            while (this.length)
                this.remove(this.length - 1);
        }
        /** Remove all items and all DOM children */
        clear() {
            this.removeAll();
            utils.clearChildren(this.dom);
        }
        ReplaceChild(dom) {
            this.clear();
            this.dom.appendChild(dom.getDOM());
        }
    }
    class SelectionHelper {
        constructor() {
            this._enabled = false;
            this.onEnabledChanged = new Callbacks();
            this.itemProvider = null;
            this.ctrlForceSelect = false;
            this.selectedItems = [];
            this.onSelectedItemsChanged = new Callbacks();
            /** For shift-click */
            this.lastToggledItem = null;
        }
        get enabled() { return this._enabled; }
        set enabled(val) {
            if (!!val === !!this._enabled)
                return;
            this._enabled = val;
            while (this.selectedItems.length)
                this.toggleItemSelection(this.selectedItems[0], false);
            this.lastToggledItem = null;
            this.onEnabledChanged.invoke();
        }
        get count() { return this.selectedItems.length; }
        /** Returns true if it's handled by the helper. */
        handleItemClicked(item, ev) {
            if (!this.enabled) {
                if (!this.ctrlForceSelect || !ev.ctrlKey)
                    return false;
                this.enabled = true;
            }
            if (ev.shiftKey && this.lastToggledItem && this.itemProvider) {
                var toSelect = !!this.lastToggledItem.selected;
                var start = item.position, end = this.lastToggledItem.position;
                if (start > end)
                    [start, end] = [end, start];
                for (let i = start; i <= end; i++) {
                    this.toggleItemSelection(this.itemProvider.get(i), toSelect);
                }
                this.lastToggledItem = item;
            }
            else {
                this.toggleItemSelection(item);
            }
            ev.preventDefault();
            return true;
        }
        /** Returns true if it's handled by the helper. */
        handleItemKeyDown(item, ev) {
            if (!this.enabled)
                return false;
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
        toggleItemSelection(item, force) {
            if (force !== undefined && force === !!item.selected)
                return;
            if (item.selected) {
                item.selected = false;
                this.selectedItems.remove(item);
                this.onSelectedItemsChanged.invoke('remove', item);
            }
            else {
                item.selected = true;
                this.selectedItems.push(item);
                this.onSelectedItemsChanged.invoke('add', item);
            }
            this.lastToggledItem = item;
            if (this.count === 0 && this.ctrlForceSelect)
                this.enabled = false;
        }
    }
    class ItemActiveHelper {
        constructor(init) {
            this.funcSetActive = (item, val) => item.toggleClass('active', val);
            this.current = null;
            utils.objectInit(this, init);
        }
        set(item) {
            if (this.current === item)
                return;
            if (this.current)
                this.funcSetActive(this.current, false);
            this.current = item;
            if (this.current)
                this.funcSetActive(this.current, true);
        }
    }
    class LazyListView extends ListView {
        constructor() {
            super(...arguments);
            this._loaded = 0;
            this._lazy = false;
            this._slowLoading = null;
            this._autoLoad = null;
        }
        get loaded() { return this.loaded; }
        get slowLoading() { return this._slowLoading; }
        get autoLoad() { return this._autoLoad; }
        get lazy() { return this._lazy; }
        set lazy(val) {
            this._lazy = val;
            if (!val)
                this.ensureLoaded(this.length - 1);
        }
        ensureLoaded(pos) {
            if (pos >= this.length)
                pos = this.length - 1;
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
            if (autoLoad)
                this.enableAutoLoad(interval, batchSize);
            if (this._slowLoading)
                return this._slowLoading;
            if (this._loaded >= this.length)
                return Promise.resolve(true);
            return this._slowLoading = new Promise((r) => {
                var cancel;
                var cont;
                var callback = () => {
                    if (!this._slowLoading || !this.loadNext(batchSize)) {
                        this.lazy = !!this._autoLoad;
                        cancel();
                        r(!!this._slowLoading);
                        this._slowLoading = null;
                    }
                    else {
                        cont();
                    }
                };
                if (interval == -1 && window['requestIdleCallback']) {
                    let handle;
                    cancel = () => window['cancelIdleCallback'](handle);
                    cont = () => {
                        handle = window['requestIdleCallback'](callback);
                    };
                    cont();
                }
                else {
                    if (interval == -1)
                        interval = 30;
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
        _insertToDom(item, pos) {
            if (!this.lazy || pos < this._loaded) {
                super._insertToDom(item, pos);
                this._loaded++;
            }
            else {
                if (this._autoLoad) {
                    this.slowlyLoad(this._autoLoad.interval, this._autoLoad.batchSize);
                }
            }
        }
        _removeFromDom(item) {
            if (item.position < this._loaded) {
                super._removeFromDom(item);
                this._loaded--;
            }
        }
    }
    class Section extends View {
        constructor(arg) {
            super();
            this.titleView = new TextView({ tag: 'span.section-title' });
            this.headerView = new View({
                tag: 'div.section-header',
                child: [
                    this.titleView
                ]
            });
            this.ensureDom();
            if (arg) {
                if (arg.title)
                    this.setTitle(arg.title);
                if (arg.content)
                    this.setContent(arg.content);
                if (arg.actions)
                    arg.actions.forEach(x => this.addAction(x));
            }
        }
        createDom() {
            return {
                _ctx: this,
                tag: 'div.section',
                child: [
                    this.headerView
                ]
            };
        }
        setTitle(text) {
            this.titleView.text = text;
        }
        setContent(view) {
            var dom = this.dom;
            var firstChild = dom.firstChild;
            while (dom.lastChild !== firstChild)
                dom.removeChild(dom.lastChild);
            dom.appendChild(view.getDOM());
        }
        addAction(arg) {
            var view = new View({
                tag: 'div.section-action.clickable',
                text: arg.text,
                tabIndex: 0
            });
            view.onActive.add(arg.onclick);
            this.headerView.dom.appendChild(view.dom);
        }
    }
    class LoadingIndicator extends View {
        constructor(init) {
            super();
            this._status = 'running';
            this.onclick = null;
            if (init)
                utils.objectInit(this, init);
        }
        get state() { return this._status; }
        set state(val) {
            this._status = val;
            ['running', 'error', 'normal'].forEach(x => this.toggleClass(x, val === x));
        }
        get content() { return this._text; }
        set content(val) { this._text = val; this.ensureDom(); this._textdom.textContent = val; }
        reset() {
            this.state = 'running';
            this.content = I `Loading`;
            this.onclick = null;
        }
        error(err, retry) {
            this.state = 'error';
            this.content = I `Oh no! Something just goes wrong:` + '\r\n' + err;
            if (retry) {
                this.content += '\r\n' + I `[Click here to retry]`;
            }
            this.onclick = retry;
        }
        action(func) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield func();
                }
                catch (error) {
                    this.error(error, () => this.action(func));
                }
            });
        }
        createDom() {
            return {
                _ctx: this,
                tag: 'div.loading-indicator',
                child: [{
                        tag: 'div.loading-indicator-inner',
                        child: [{ tag: 'div.loading-indicator-text', _key: '_textdom' }]
                    }],
                onclick: (e) => { var _a; return (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this, e); }
            };
        }
        postCreateDom() {
            this.reset();
        }
    }
    class Overlay extends View {
        createDom() {
            return { tag: 'div.overlay' };
        }
        setCenterChild(centerChild) {
            this.toggleClass('centerchild', centerChild);
            return this;
        }
        setNoBg(nobg) {
            this.toggleClass('nobg', nobg);
            return this;
        }
        setFixed(fixed) {
            this.toggleClass('fixed', fixed);
            return this;
        }
    }
    class EditableHelper {
        constructor(element) {
            this.editing = false;
            this.beforeEdit = null;
            this.onComplete = null;
            this.element = element;
        }
        startEdit(onComplete) {
            if (this.editing)
                return;
            this.editing = true;
            var ele = this.element;
            var beforeEdit = this.beforeEdit = ele.textContent;
            utils.toggleClass(ele, 'editing', true);
            var input = utils.buildDOM({
                tag: 'input', type: 'text', value: beforeEdit
            });
            while (ele.firstChild)
                ele.removeChild(ele.firstChild);
            ele.appendChild(input);
            input.select();
            input.focus();
            var stopEdit = () => {
                var _a;
                this.editing = false;
                utils.toggleClass(ele, 'editing', false);
                events.forEach(x => x.remove());
                input.remove();
                (_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, input.value);
                onComplete === null || onComplete === void 0 ? void 0 : onComplete(input.value);
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
            return new Promise((resolve) => this.startEdit(resolve));
        }
    }
    class MenuItem extends ListViewItem {
        constructor(init) {
            super();
            this.text = '';
            this.cls = 'normal';
            this.keepOpen = false;
            utils.objectInit(this, init);
        }
        createDom() {
            return {
                tag: 'div.item.no-selection',
                tabIndex: 0
            };
        }
        postCreateDom() {
            super.postCreateDom();
            this.onActive.add((ev) => {
                if (this.parentView instanceof ContextMenu) {
                    if (!this.keepOpen && !this.parentView.keepOpen)
                        this.parentView.close();
                }
            });
        }
        updateDom() {
            this.dom.textContent = this.text;
            if (this.cls !== this._lastcls) {
                if (this._lastcls)
                    this.dom.classList.remove(this._lastcls);
                if (this.cls)
                    this.dom.classList.add(this.cls);
            }
        }
    }
    class MenuLinkItem extends MenuItem {
        constructor(init) {
            super(init);
            this.link = '';
            this.download = '';
            utils.objectInit(this, init);
        }
        createDom() {
            var dom = super.createDom();
            dom.tag = 'a.item.no-selection';
            dom.target = "_blank";
            return dom;
        }
        updateDom() {
            super.updateDom();
            this.dom.href = this.link;
            this.dom.download = this.download;
        }
    }
    class MenuInfoItem extends MenuItem {
        constructor(init) {
            super(init);
            this.text = '';
            this.keepOpen = true;
            utils.objectInit(this, init);
        }
        createDom() {
            return {
                tag: 'div.menu-info'
            };
        }
        updateDom() {
            super.updateDom();
            this.dom.textContent = this.text;
        }
    }
    class ContextMenu extends ListView {
        constructor(items) {
            super({ tag: 'div.context-menu', tabIndex: 0 });
            this.keepOpen = false;
            this.useOverlay = true;
            this._visible = false;
            this.overlay = null;
            this.onClose = new Callbacks();
            this._originalFocused = null;
            items === null || items === void 0 ? void 0 : items.forEach(x => this.add(x));
        }
        get visible() { return this._visible; }
        ;
        postCreateDom() {
            super.postCreateDom();
            this.dom.addEventListener('focusout', (e) => {
                !this.dom.contains(e.relatedTarget) && this.close();
            });
            this.dom.addEventListener('keydown', (e) => {
                if (e.code === 'Escape') {
                    e.preventDefault();
                    this.close();
                }
            });
        }
        show(arg) {
            if (this._visible) {
                console.trace("[ContextMenu] show() called when it's already visible.");
                return;
            }
            if ('ev' in arg)
                arg = {
                    x: arg.ev.clientX,
                    y: arg.ev.clientY
                };
            this._visible = true;
            if (this.useOverlay) {
                if (!this.overlay) {
                    this.overlay = new Overlay().setFixed(true);
                    this.overlay.dom.style.background = 'rgba(0, 0, 0, .1)';
                    this.overlay.dom.addEventListener('mousedown', (ev) => {
                        if (ev.eventPhase !== Event.AT_TARGET)
                            return;
                        ev.preventDefault();
                        this.close();
                    });
                }
                this.overlay.appendView(this);
                document.body.appendChild(this.overlay.dom);
            }
            else {
                document.body.appendChild(this.dom);
            }
            this._originalFocused = document.activeElement;
            this.setPosition(arg);
            this.dom.focus();
        }
        setPosition(arg) {
            if (!this._visible) {
                console.trace("[ContextMenu] setPosition() called when it's not visible.");
                return;
            }
            this.dom.style.left = '0';
            this.dom.style.top = '0';
            var parentWidth = document.body.offsetWidth;
            var parentHeight = document.body.offsetHeight;
            if (this.useOverlay) {
                const overlayDom = this.overlay.dom;
                parentWidth = overlayDom.offsetWidth;
                parentHeight = overlayDom.offsetHeight;
            }
            this.dom.style.maxHeight = parentHeight + 'px';
            var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
            var x = arg.x, y = arg.y;
            if (x + width > parentWidth)
                x -= width;
            if (y + height > parentHeight)
                y -= height;
            if (x < 0) {
                if (arg.x > parentWidth / 2)
                    x = 0;
                else
                    x = parentWidth - width;
            }
            if (y < 0) {
                if (arg.y > parentHeight / 2)
                    y = 0;
                else
                    y = parentHeight - height;
            }
            this.dom.style.left = x + 'px';
            this.dom.style.top = y + 'px';
            this.dom.style.transformOrigin = `${arg.x - x}px ${arg.y - y}px`;
        }
        close() {
            var _a, _b;
            if (this._visible) {
                this._visible = false;
                this.onClose.invoke();
                (_b = (_a = this._originalFocused) === null || _a === void 0 ? void 0 : _a['focus']) === null || _b === void 0 ? void 0 : _b.call(_a);
                this._originalFocused = null;
                if (this.overlay)
                    utils.fadeout(this.overlay.dom);
                utils.fadeout(this.dom);
            }
        }
    }
    class Dialog extends View {
        constructor() {
            super();
            this.content = new ContainerView({ tag: 'div.dialog-content' });
            this.shown = false;
            this.btnTitle = new TabBtn({ active: true, clickable: false });
            this.btnClose = new TabBtn({ text: I `Close`, right: true });
            this.title = 'Dialog';
            this.allowClose = true;
            this.showCloseButton = true;
            this.onShown = new Callbacks();
            this.onClose = new Callbacks();
            this.focusTrap = new View({ tag: 'div.focustrap', tabIndex: 0 });
            this.btnClose.onActive.add(() => this.allowClose && this.close());
        }
        static get defaultParent() {
            if (!Dialog._defaultParent)
                Dialog._defaultParent = new DialogParent();
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
        createDom() {
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
                }
                else if (ev.target === this.dom && ev.code === 'Tab' && ev.shiftKey) {
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
                let offset;
                utils.listenPointerEvents(this.domheader, (e) => {
                    if (e.action === 'down') {
                        if (e.ev.target !== this.domheader && e.ev.target !== this.btnTitle.dom)
                            return;
                        e.ev.preventDefault();
                        const rectOverlay = this.overlay.dom.getBoundingClientRect();
                        const rect = this.dom.getBoundingClientRect();
                        offset = {
                            x: e.point.pageX - rectOverlay.x - rect.x,
                            y: e.point.pageY - rectOverlay.y - rect.y
                        };
                        return 'track';
                    }
                    else if (e.action === 'move') {
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
        addBtn(btn) {
            this.ensureDom();
            this.domheader.insertBefore(btn.dom, this.domheader.lastChild);
        }
        addContent(view, replace) {
            this.ensureDom();
            if (replace)
                this.content.removeAllView();
            this.content.addView(View.getView(view));
        }
        addChild(view) {
            this.addContent(view);
        }
        setOffset(x, y) {
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
        show(ev) {
            var _a;
            if (this.shown)
                return;
            this.shown = true;
            (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
            this.ensureDom();
            Dialog.defaultParent.onDialogShowing(this);
            this.setTransformOrigin(ev);
            this.dom.focus();
            (this.autoFocus || this).dom.focus();
            this.onShown.invoke();
        }
        setTransformOrigin(ev) {
            if (ev) {
                const rect = this.dom.getBoundingClientRect();
                this.dom.style.transformOrigin = `${ev.x - rect.x}px ${ev.y - rect.y}px`;
            }
            else {
                this.dom.style.transformOrigin = '';
            }
        }
        close() {
            if (!this.shown)
                return;
            this.shown = false;
            this.setTransformOrigin(undefined);
            this.onClose.invoke();
            this._cancelFadeout = utils.fadeout(this.overlay.dom).cancel;
            Dialog.defaultParent.onDialogClosing(this);
        }
        waitClose() {
            return new Promise((resolve) => {
                var cb = this.onClose.add(() => {
                    this.onClose.remove(cb);
                    resolve();
                });
            });
        }
    }
    Dialog._defaultParent = null;
    class DialogParent extends View {
        constructor(dom = document.body) {
            super(dom);
            this.bgOverlay = new Overlay();
            this.dialogCount = 0;
            this.fixed = false;
            this._cancelFadeout = null;
            if (dom === document.body) {
                this.fixed = true;
            }
        }
        onDialogShowing(dialog) {
            var _a;
            if (this.dialogCount++ === 0) {
                (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
                this.bgOverlay.setFixed(this.fixed);
                this.appendView(this.bgOverlay);
            }
            dialog.overlay.setFixed(this.fixed);
            this.appendView(dialog.overlay);
        }
        onDialogClosing(dialog) {
            if (--this.dialogCount === 0) {
                this._cancelFadeout = utils.fadeout(this.bgOverlay.dom).cancel;
            }
        }
    }
    class TabBtn extends View {
        constructor(init) {
            super();
            this.text = '';
            this.clickable = true;
            this.active = false;
            this.right = false;
            utils.objectInit(this, init);
        }
        createDom() {
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
    class InputView extends View {
        constructor(init) {
            super();
            this.multiline = false;
            this.type = 'text';
            this.placeholder = '';
            utils.objectInit(this, init);
        }
        get value() { return this.dom.value; }
        set value(val) { this.dom.value = val; }
        createDom() {
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
    class TextView extends View {
        get text() { return this.dom.textContent; }
        set text(val) { this.dom.textContent = val; }
    }
    class ButtonView extends TextView {
        constructor(init) {
            super();
            this.disabled = false;
            this.type = 'normal';
            utils.objectInit(this, init);
            this.updateDom();
        }
        createDom() {
            return { tag: 'div.btn', tabIndex: 0 };
        }
        updateDom() {
            super.updateDom();
            this.toggleClass('disabled', this.disabled);
            this.toggleClass('btn-big', this.type === 'big');
        }
    }
    class LabeledInputBase extends View {
        constructor(init) {
            super();
            this.label = '';
            utils.objectInit(this, init);
        }
        get dominput() { return this.input.dom; }
        createDom() {
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
    class LabeledInput extends LabeledInputBase {
        constructor(init) {
            super();
            utils.objectInit(this, init);
            if (!this.input)
                this.input = new InputView();
        }
        get value() { return this.dominput.value; }
        set value(val) { this.dominput.value = val; }
        updateDom() {
            this.input.type = this.type;
            super.updateDom();
        }
    }
    exports.FlagsInput = void 0;
    (function (FlagsInput_1) {
        class FlagsInput extends ContainerView {
            constructor(flags) {
                super();
                flags === null || flags === void 0 ? void 0 : flags.forEach(f => {
                    var flag = f instanceof Flag ? f : new Flag({ text: Object.prototype.toString.call(f) });
                    this.addView(flag);
                });
            }
            createDom() {
                return { tag: 'div.flags-input' };
            }
        }
        FlagsInput_1.FlagsInput = FlagsInput;
        class Flag extends TextView {
            get parentInput() { return this.parentView; }
            constructor(init) {
                super();
                utils.objectInit(this, init);
            }
            createDom() {
                return { tag: 'div.flags-input-item' };
            }
        }
        FlagsInput_1.Flag = Flag;
    })(exports.FlagsInput || (exports.FlagsInput = {}));
    class ToastsContainer extends View {
        constructor() {
            super(...arguments);
            this.parentDom = null;
            this.toasts = [];
        }
        createDom() {
            return { tag: 'div.toasts-container' };
        }
        addToast(toast) {
            if (this.toasts.length === 0)
                this.show();
            this.toasts.push(toast);
        }
        removeToast(toast) {
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
    ToastsContainer.default = new ToastsContainer();
    class Toast extends View {
        constructor(init) {
            super();
            this.text = '';
            this.shown = false;
            this.timer = new Timer(() => this.close());
            utils.objectInit(this, init);
            if (!this.container)
                this.container = ToastsContainer.default;
        }
        show(timeout) {
            if (!this.shown) {
                this.container.addToast(this);
                this.container.appendView(this);
                this.shown = true;
            }
            if (timeout)
                this.timer.timeout(timeout);
            else
                this.timer.tryCancel();
        }
        close() {
            if (!this.shown)
                return;
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
        static show(text, timeout) {
            var toast = new Toast({ text });
            toast.show(timeout);
            return toast;
        }
    }
    class MessageBox extends Dialog {
        constructor() {
            super(...arguments);
            this.allowClose = false;
            this.title = 'Message';
            this.result = 'none';
        }
        addResultBtns(results) {
            for (const r of results) {
                this.addBtnWithResult(new TabBtn({ text: i18n.get('msgbox_' + r), right: true }), r);
            }
            return this;
        }
        setTitle(title) {
            this.title = title;
            if (this.domCreated)
                this.updateDom();
            return this;
        }
        addText(text) {
            this.addContent(new TextView({ tag: 'div.messagebox-text', textContent: text }));
            return this;
        }
        allowCloseWithResult(result, showCloseButton) {
            this.result = result;
            this.allowClose = true;
            this.showCloseButton = !!showCloseButton;
            if (this.domCreated)
                this.updateDom();
            return this;
        }
        addBtnWithResult(btn, result) {
            btn.onActive.add(() => { this.result = result; this.close(); });
            this.addBtn(btn);
            return this;
        }
        showAndWaitResult() {
            return __awaiter(this, void 0, void 0, function* () {
                this.show();
                yield this.waitClose();
                return this.result;
            });
        }
    }
    class ViewToggle {
        constructor(init) {
            this.shownKeys = [];
            this.toggleMode = 'remove';
            this.container = null;
            utils.objectInit(this, init);
            this.setShownKeys(this.shownKeys);
        }
        add(key, view) {
            const oldVal = this.items[key];
            if (oldVal) {
                if (oldVal instanceof Array) {
                    this.items[key].push(view);
                }
                else {
                    this.items[key] = [oldVal, view];
                }
            }
            else {
                this.items[key] = view;
            }
            this.toggleView(view, this.shownKeys.indexOf(key) >= 0);
        }
        setShownKeys(keys) {
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
                        }
                        else if (val) {
                            this.toggleView(val, show);
                        }
                    }
                }
            }
        }
        toggleView(view, show, mode) {
            if (!mode)
                mode = this.toggleMode;
            if (mode == 'display') {
                view.dom.style.display = show ? '' : 'none';
            }
            else if (mode == 'hidden') {
                view.dom.hidden = !show;
            }
            else if (mode == 'remove') {
                if (show) {
                    this.container.appendView(view);
                }
                else {
                    view.dom.remove();
                }
            }
            else {
                throw new Error('Unknown toggle mode');
            }
        }
    }
    class ToolTip extends TextView {
        constructor() {
            super(...arguments);
            this._shown = false;
            this._timer = new Timer(() => this.close());
            this._cancelClose = null;
        }
        createDom() {
            return {
                tag: 'div.tooltip'
            };
        }
        get shown() { return this._shown; }
        show(options) {
            var _a;
            if (this.shown)
                return;
            this._shown = true;
            (_a = this._cancelClose) === null || _a === void 0 ? void 0 : _a.call(this);
            let { parent = document.body, timeout } = options;
            if (timeout)
                this._timer.timeout(timeout);
            const dom = this.dom;
            setPosition(dom, options);
            parent.appendChild(dom);
        }
        close(fadeOutOptions) {
            if (!this.shown)
                return;
            this._timer.tryCancel();
            this._shown = false;
            this._cancelClose = utils.fadeout(this.dom, fadeOutOptions).cancel;
        }
    }
    function setPosition(dom, options) {
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

    exports.BuildDOMCtx = BuildDOMCtx;
    exports.ButtonView = ButtonView;
    exports.Callbacks = Callbacks;
    exports.CancelToken = CancelToken;
    exports.ContainerView = ContainerView;
    exports.ContextMenu = ContextMenu;
    exports.DataUpdatingHelper = DataUpdatingHelper;
    exports.Dialog = Dialog;
    exports.DialogParent = DialogParent;
    exports.EditableHelper = EditableHelper;
    exports.EventRegistrations = EventRegistrations;
    exports.I = I;
    exports.I18n = I18n;
    exports.InputStateTracker = InputStateTracker;
    exports.InputView = InputView;
    exports.ItemActiveHelper = ItemActiveHelper;
    exports.JsxNode = JsxNode;
    exports.LabeledInput = LabeledInput;
    exports.LabeledInputBase = LabeledInputBase;
    exports.Lazy = Lazy;
    exports.LazyListView = LazyListView;
    exports.ListView = ListView;
    exports.ListViewItem = ListViewItem;
    exports.LoadingIndicator = LoadingIndicator;
    exports.MenuInfoItem = MenuInfoItem;
    exports.MenuItem = MenuItem;
    exports.MenuLinkItem = MenuLinkItem;
    exports.MessageBox = MessageBox;
    exports.Overlay = Overlay;
    exports.Ref = Ref;
    exports.Section = Section;
    exports.SelectionHelper = SelectionHelper;
    exports.Semaphore = Semaphore;
    exports.SettingItem = SettingItem;
    exports.TabBtn = TabBtn;
    exports.TextCompositionWatcher = TextCompositionWatcher;
    exports.TextView = TextView;
    exports.Timer = Timer;
    exports.Toast = Toast;
    exports.ToastsContainer = ToastsContainer;
    exports.ToolTip = ToolTip;
    exports.View = View;
    exports.ViewToggle = ViewToggle;
    exports.buildDOM = buildDOM;
    exports.createArrayBuilder = createArrayBuilder;
    exports.createStringBuilder = createStringBuilder;
    exports.dragManager = dragManager;
    exports.getWebfxCss = getWebfxCss;
    exports.i18n = i18n;
    exports.injectWebfxCss = injectWebfxCss;
    exports.jsx = jsx;
    exports.jsxBuild = jsxBuild;
    exports.jsxFactory = jsxFactory;
    exports.startBlockingDetect = startBlockingDetect;
    exports.utils = utils;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
