var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// file: I18n.ts
define("I18n", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.I18n = I18n;
    function createStringBuilder(i18n) {
        return function (literals, ...placeholders) {
            if (placeholders.length === 0) {
                return i18n.get(literals[0]);
            }
            // Generate format string from template string:
            var formatString = '';
            for (var i = 0; i < literals.length; i++) {
                var lit = literals[i];
                formatString += lit;
                if (i < placeholders.length) {
                    formatString += '{' + i + '}';
                }
            }
            var r = i18n.get(formatString);
            for (var i = 0; i < placeholders.length; i++) {
                r = r.replace('{' + i + '}', placeholders[i]);
            }
            return r;
        };
    }
    exports.createStringBuilder = createStringBuilder;
    exports.i18n = new I18n();
    exports.I = createStringBuilder(exports.i18n);
});
// file: utils.ts
define("utils", ["require", "exports", "I18n"], function (require, exports, I18n_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    class TextCompositionWatcher {
        constructor(dom) {
            this.isCompositing = false;
            this.dom = dom.getDOM();
            this.dom.addEventListener('compositionstart', (ev) => {
                this.isCompositing = true;
            });
            this.dom.addEventListener('compositionend', (ev) => {
                this.isCompositing = false;
            });
        }
    }
    exports.TextCompositionWatcher = TextCompositionWatcher;
});
// file: viewlib.ts
define("viewlib", ["require", "exports", "utils", "I18n"], function (require, exports, utils_1, I18n_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class View {
        constructor(dom) {
            this.parentView = undefined;
            this._position = undefined;
            this.domctx = new utils_1.BuildDOMCtx();
            this._dom = undefined;
            this._onactive = undefined;
            this._onActiveCbs = undefined;
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
            this._dom = utils_1.utils.buildDOM(r, this.domctx);
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
            utils_1.utils.objectApply(this, kv);
            this.updateDom();
        }
        toggleClass(clsName, force) {
            utils_1.utils.toggleClass(this.dom, clsName, force);
        }
        appendView(view) { return this.dom.appendView(view); }
        getDOM() { return this.dom; }
        get onactive() { return this._onactive; }
        set onactive(val) {
            if (!!this._onactive !== !!val) {
                if (val) {
                    this._onActiveCbs = [
                        (e) => {
                            this._onactive();
                        },
                        (e) => {
                            this.handleKeyDown(e, this._onactive);
                        }
                    ];
                    this.dom.addEventListener('click', this._onActiveCbs[0]);
                    this.dom.addEventListener('keydown', this._onActiveCbs[1]);
                }
                else {
                    this.dom.removeEventListener('click', this._onActiveCbs[0]);
                    this.dom.removeEventListener('keydown', this._onActiveCbs[1]);
                    this._onActiveCbs = undefined;
                }
            }
            this._onactive = val;
        }
        handleKeyDown(e, onactive) {
            if (e.code === 'Enter') {
                onactive();
                e.preventDefault();
            }
        }
    }
    exports.View = View;
    HTMLElement.prototype.getDOM = function () { return this; };
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
            var _a;
            const items = this.items;
            if (view.parentView)
                throw new Error('the view is already in a container view');
            view.parentView = this;
            if (pos === undefined) {
                view._position = items.length;
                items.push(view);
                this.dom.appendChild(view.dom);
            }
            else {
                items.splice(pos, 0, view);
                this.dom.insertBefore(view.dom, ((_a = items[pos + 1]) === null || _a === void 0 ? void 0 : _a.dom) || null);
                for (let i = pos; i < items.length; i++) {
                    items[i]._position = i;
                }
            }
        }
        removeView(view) {
            view = this._ensureItem(view);
            view.dom.remove();
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
        map(func) { return utils_1.utils.arrayMap(this, func); }
        find(func) { return utils_1.utils.arrayFind(this, func); }
        forEach(func) { return utils_1.utils.arrayForeach(this, func); }
    }
    exports.ContainerView = ContainerView;
    /** DragManager is used to help exchange information between views */
    exports.dragManager = new class DragManager {
        constructor() {
            /** The item being dragged */
            this._currentItem = null;
            this._currentArray = null;
            this.onDragStart = new utils_1.Callbacks();
            this.onDragEnd = new utils_1.Callbacks();
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
            console.log('drag end');
            this.onDragEnd.invoke();
        }
    };
    class ListViewItem extends View {
        constructor() {
            super(...arguments);
            this._selected = false;
            this.onSelectedChanged = new utils_1.Callbacks();
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
                    var offset = ev.code === 'ArrowUp' ? -1 : 1;
                    var item = this.listview.get(this.position + offset);
                    if (item) {
                        item.dom.focus();
                        ev.preventDefault();
                    }
                }
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
                exports.dragManager.startArray(arr);
                ev.dataTransfer.setData('text/plain', arr.map(x => x.dragData).join('\r\n'));
                arr.forEach(x => x.dom.style.opacity = '.5');
            });
            this.dom.addEventListener('dragend', (ev) => {
                var arr = exports.dragManager.currentArray;
                exports.dragManager.end();
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
            const item = exports.dragManager.currentItem;
            let items = exports.dragManager.currentArray;
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
                    arg.accept = (items.indexOf(this) === -1) ? 'move' : true;
                    if (arg.accept === 'move' && ev.clientY - this.dom.getBoundingClientRect().top > this.dom.offsetHeight / 2)
                        arg.accept = 'move-after';
                    if (!drop) {
                        ev.dataTransfer.dropEffect = 'move';
                    }
                    else {
                        if (items.indexOf(this) === -1) {
                            let newpos = this.position;
                            if (arg.accept == 'move-after')
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
            if (!arg.accept && item === this && onContextMenu) {
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
                            utils_1.utils.buildDOM({ tag: 'div.dragover-placeholder' }),
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
    exports.ListViewItem = ListViewItem;
    class ListView extends ContainerView {
        constructor(container) {
            super(container);
            /**
             * Allow user to drag an item.
             */
            this.dragging = false;
            /**
             * Allow user to drag an item and change its position.
             */
            this.moveByDragging = false;
            this.selectionHelper = new SelectionHelper();
            this.selectionHelper.itemProvider = this.get.bind(this);
        }
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
            item = this._ensureItem(item);
            this.remove(item, true);
            this.add(item, newpos);
            this.onItemMoved(item, item.position);
        }
        /** Remove all items */
        removeAll() {
            while (this.length)
                this.remove(this.length - 1);
        }
        /** Remove all items and all DOM children */
        clear() {
            this.removeAll();
            utils_1.utils.clearChildren(this.dom);
        }
        ReplaceChild(dom) {
            this.clear();
            this.dom.appendChild(dom.getDOM());
        }
    }
    exports.ListView = ListView;
    class SelectionHelper {
        constructor() {
            this._enabled = false;
            this.onEnabledChanged = new utils_1.Callbacks();
            this.itemProvider = null;
            this.ctrlForceSelect = false;
            this.selectedItems = [];
            this.onSelectedItemsChanged = new utils_1.Callbacks();
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
                    this.toggleItemSelection(this.itemProvider(i), toSelect);
                }
                this.lastToggledItem = item;
            }
            else {
                this.toggleItemSelection(item);
            }
            return true;
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
    exports.SelectionHelper = SelectionHelper;
    class ItemActiveHelper {
        constructor(init) {
            this.funcSetActive = (item, val) => item.toggleClass('active', val);
            this.current = null;
            utils_1.utils.objectApply(this, init);
        }
        set(item) {
            if (this.current)
                this.funcSetActive(this.current, false);
            this.current = item;
            if (this.current)
                this.funcSetActive(this.current, true);
        }
    }
    exports.ItemActiveHelper = ItemActiveHelper;
    class Section extends View {
        constructor(arg) {
            super();
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
                    {
                        tag: 'div.section-header',
                        child: [
                            { tag: 'span.section-title', _key: 'titleDom' }
                        ]
                    }
                    // content element(s) here
                ]
            };
        }
        setTitle(text) {
            this.titleDom.textContent = text;
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
            view.onactive = arg.onclick;
            this.titleDom.parentElement.appendChild(view.dom);
        }
    }
    exports.Section = Section;
    class LoadingIndicator extends View {
        constructor(init) {
            super();
            this._status = 'running';
            this.onclick = null;
            if (init)
                utils_1.utils.objectApply(this, init);
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
            this.content = utils_1.I `Loading`;
            this.onclick = null;
        }
        error(err, retry) {
            this.state = 'error';
            this.content = utils_1.I `Oh no! Something just goes wrong:` + '\r\n' + err;
            if (retry) {
                this.content += '\r\n' + utils_1.I `[Click here to retry]`;
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
                onclick: (e) => this.onclick && this.onclick(e)
            };
        }
        postCreateDom() {
            this.reset();
        }
    }
    exports.LoadingIndicator = LoadingIndicator;
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
    }
    exports.Overlay = Overlay;
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
            utils_1.utils.toggleClass(ele, 'editing', true);
            var input = utils_1.utils.buildDOM({
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
                utils_1.utils.toggleClass(ele, 'editing', false);
                events.forEach(x => x.remove());
                input.remove();
                (_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, input.value);
                onComplete === null || onComplete === void 0 ? void 0 : onComplete(input.value);
            };
            var events = [
                utils_1.utils.addEvent(input, 'keydown', (evv) => {
                    if (evv.code === 'Enter') {
                        stopEdit();
                        evv.preventDefault();
                    }
                }),
                utils_1.utils.addEvent(input, 'focusout', (evv) => { stopEdit(); }),
            ];
        }
        startEditAsync() {
            return new Promise((resolve) => this.startEdit(resolve));
        }
    }
    exports.EditableHelper = EditableHelper;
    class MenuItem extends ListViewItem {
        constructor(init) {
            super();
            this.text = '';
            this.cls = 'normal';
            utils_1.utils.objectApply(this, init);
        }
        createDom() {
            return {
                tag: 'div.item.no-selection',
                tabIndex: 0
            };
        }
        postCreateDom() {
            super.postCreateDom();
            this.onactive = () => {
                var _a;
                if (this.parentView instanceof ContextMenu) {
                    if (!this.parentView.keepOpen)
                        this.parentView.close();
                }
                (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this);
            };
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
    exports.MenuItem = MenuItem;
    class MenuLinkItem extends MenuItem {
        constructor(init) {
            super(init);
            this.link = '';
            this.download = '';
            utils_1.utils.objectApply(this, init);
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
    exports.MenuLinkItem = MenuLinkItem;
    class MenuInfoItem extends MenuItem {
        constructor(init) {
            super(init);
            this.text = '';
            utils_1.utils.objectApply(this, init);
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
    exports.MenuInfoItem = MenuInfoItem;
    class ContextMenu extends ListView {
        constructor(items) {
            super({ tag: 'div.context-menu', tabIndex: 0 });
            this.keepOpen = false;
            this.useOverlay = true;
            this._visible = false;
            this.overlay = null;
            this._onclose = null;
            this._originalFocused = null;
            items === null || items === void 0 ? void 0 : items.forEach(x => this.add(x));
        }
        get visible() { return this._visible; }
        ;
        show(arg) {
            if ('ev' in arg)
                arg = {
                    x: arg.ev.pageX,
                    y: arg.ev.pageY
                };
            this.close();
            this._visible = true;
            if (this.useOverlay) {
                if (!this.overlay) {
                    this.overlay = new Overlay();
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
            this.dom.focus();
            var onfocusout = (e) => {
                !this.dom.contains(e.relatedTarget) && this.close();
            };
            var onkeydown = (e) => {
                if (e.code === 'Escape') {
                    e.preventDefault();
                    this.close();
                }
            };
            this.dom.addEventListener('focusout', onfocusout);
            this.dom.addEventListener('keydown', onkeydown);
            this._onclose = () => {
                this.dom.removeEventListener('focusout', onfocusout);
                this.dom.removeEventListener('keydown', onkeydown);
            };
            var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
            if (arg.x + width > document.body.offsetWidth)
                arg.x -= width;
            if (arg.y + height > document.body.offsetHeight)
                arg.y -= height;
            if (arg.x < 0)
                arg.x = 0;
            if (arg.y < 0)
                arg.y = 0;
            this.dom.style.left = arg.x + 'px';
            this.dom.style.top = arg.y + 'px';
        }
        close() {
            var _a, _b, _c;
            if (this._visible) {
                this._visible = false;
                (_a = this._onclose) === null || _a === void 0 ? void 0 : _a.call(this);
                this._onclose = null;
                (_c = (_b = this._originalFocused) === null || _b === void 0 ? void 0 : _b['focus']) === null || _c === void 0 ? void 0 : _c.call(_b);
                this._originalFocused = null;
                if (this.overlay)
                    utils_1.utils.fadeout(this.overlay.dom);
                utils_1.utils.fadeout(this.dom);
            }
        }
    }
    exports.ContextMenu = ContextMenu;
    class Dialog extends View {
        constructor() {
            super();
            this.content = new ContainerView({ tag: 'div.dialog-content' });
            this.shown = false;
            this.btnTitle = new TabBtn({ active: true, clickable: false });
            this.btnClose = new TabBtn({ text: utils_1.I `Close`, right: true });
            this.title = 'Dialog';
            this.allowClose = true;
            this.showCloseButton = true;
            this.onShown = new utils_1.Callbacks();
            this.onClose = new utils_1.Callbacks();
            this.focusTrap = new View({ tag: 'div.focustrap', tabIndex: 0 });
            this.btnClose.onClick.add(() => this.allowClose && this.close());
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
                utils_1.utils.listenPointerEvents(this.domheader, (e) => {
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
                        const pageX = utils_1.utils.numLimit(e.point.pageX, rect.left, rect.right);
                        const pageY = utils_1.utils.numLimit(e.point.pageY, rect.top, rect.bottom);
                        this.setOffset(pageX - offset.x, pageY - offset.y);
                    }
                });
            }
            this.dom.addEventListener('resize', () => {
                if (this.dom.style.width)
                    this.width = this.dom.style.width;
            });
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
            this.content.appendView(View.getView(view));
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
        show() {
            var _a;
            if (this.shown)
                return;
            this.shown = true;
            (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
            this.ensureDom();
            Dialog.defaultParent.onDialogShowing(this);
            this.dom.focus();
            (this.autoFocus || this).dom.focus();
            this.onShown.invoke();
        }
        close() {
            if (!this.shown)
                return;
            this.shown = false;
            this.onClose.invoke();
            this._cancelFadeout = utils_1.utils.fadeout(this.overlay.dom).cancel;
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
    exports.Dialog = Dialog;
    class DialogParent extends View {
        constructor(dom) {
            super(dom !== null && dom !== void 0 ? dom : document.body);
            this.bgOverlay = new Overlay();
            this.dialogCount = 0;
        }
        onDialogShowing(dialog) {
            var _a;
            if (this.dialogCount++ === 0) {
                (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
                this.appendView(this.bgOverlay);
            }
            this.appendView(dialog.overlay);
        }
        onDialogClosing(dialog) {
            if (--this.dialogCount === 0) {
                this._cancelFadeout = utils_1.utils.fadeout(this.bgOverlay.dom).cancel;
            }
        }
    }
    exports.DialogParent = DialogParent;
    class TabBtn extends View {
        constructor(init) {
            super();
            this.text = '';
            this.clickable = true;
            this.active = false;
            this.right = false;
            this.onClick = new utils_1.Callbacks();
            utils_1.utils.objectApply(this, init);
        }
        createDom() {
            return {
                tag: 'span.tab.no-selection'
            };
        }
        postCreateDom() {
            this.onactive = () => {
                var _a;
                (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this);
                this.onClick.invoke();
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
    exports.TabBtn = TabBtn;
    class InputView extends View {
        constructor(init) {
            super();
            this.multiline = false;
            this.type = 'text';
            this.placeholder = '';
            utils_1.utils.objectApply(this, init);
        }
        get value() { return this.dom.value; }
        set value(val) { this.dom.value = val; }
        createDom() {
            return this.multiline ? { tag: 'textarea.input-text' } : { tag: 'input.input-text' };
        }
        updateDom() {
            super.updateDom();
            if (!this.multiline)
                this.dom.type = this.type;
            this.dom.placeholder = this.placeholder;
        }
    }
    exports.InputView = InputView;
    class TextView extends View {
        get text() { return this.dom.textContent; }
        set text(val) { this.dom.textContent = val; }
    }
    exports.TextView = TextView;
    class ButtonView extends TextView {
        constructor(init) {
            super();
            this.disabled = false;
            this.type = 'normal';
            utils_1.utils.objectApply(this, init);
            this.updateDom();
        }
        get onclick() { return this.onactive; }
        set onclick(val) { this.onactive = val; }
        createDom() {
            return { tag: 'div.btn', tabIndex: 0 };
        }
        updateDom() {
            super.updateDom();
            this.toggleClass('disabled', this.disabled);
            this.toggleClass('btn-big', this.type === 'big');
        }
    }
    exports.ButtonView = ButtonView;
    class LabeledInput extends View {
        constructor(init) {
            super();
            this.label = '';
            this.type = 'text';
            this.input = new InputView();
            utils_1.utils.objectApply(this, init);
        }
        get dominput() { return this.input.dom; }
        get value() { return this.dominput.value; }
        set value(val) { this.dominput.value = val; }
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
            this.input.type = this.type;
            this.input.domCreated && this.input.updateDom();
        }
    }
    exports.LabeledInput = LabeledInput;
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
    exports.ToastsContainer = ToastsContainer;
    ToastsContainer.default = new ToastsContainer();
    class Toast extends View {
        constructor(init) {
            super();
            this.text = '';
            this.shown = false;
            this.timer = new utils_1.Timer(() => this.close());
            utils_1.utils.objectApply(this, init);
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
            utils_1.utils.fadeout(this.dom)
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
    exports.Toast = Toast;
    class MessageBox extends Dialog {
        constructor() {
            super(...arguments);
            this.allowClose = false;
            this.title = 'Message';
            this.result = 'none';
        }
        addResultBtns(results) {
            for (const r of results) {
                this.addBtnWithResult(new TabBtn({ text: I18n_2.i18n.get('msgbox_' + r), right: true }), r);
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
            btn.onClick.add(() => { this.result = result; this.close(); });
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
    exports.MessageBox = MessageBox;
});
define("webfx", ["require", "exports", "utils", "I18n", "viewlib"], function (require, exports, utils_2, I18n_3, viewlib_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(utils_2);
    __export(I18n_3);
    __export(viewlib_1);
});
