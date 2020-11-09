// file: I18n.ts

export interface I18nData {
    [lang: string]: LangObj;
}

export type LangObj = Record<string, string>;

/** Internationalization (aka i18n) helper class */
export class I18n {
    data: I18nData = {};
    curLang = 'en';
    missing = new Map<string, 1>();
    /** Get i18n string for `key`, return `key` when not found. */
    get(key, arg?: any[]): string {
        return this.get2(key, arg) || key;
    }
    /** Get i18n string for `key`, return `null` when not found. */
    get2(key, arg?: any[], lang?: string): string | null {
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
    add2dArray(array: [...string[][]]) {
        const langObjs: LangObj[] = [];
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
    static detectLanguage(langs: string[]) {
        var cur: string | null = null;
        var curIdx = -1;
        var languages: string[] = [];
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

export function createStringBuilder(i18n: I18n) {
    var arrBuilder = createArrayBuilder(i18n);

    return function (literals: TemplateStringsArray, ...placeholders: any[]) {
        return arrBuilder(literals, ...placeholders).join('');
    }
}

export function createArrayBuilder(i18n: I18n) {
    var formatCache = new WeakMap<TemplateStringsArray, (string | number)[]>();

    return function <T extends any[]>(literals: TemplateStringsArray, ...placeholders: T): (string | T)[] {
        if (placeholders.length === 0) {
            return [i18n.get(literals[0])];
        }

        // Generate format string from template string if it's not cached:
        let parsed = formatCache.get(literals);
        if (parsed === undefined) {
            let formatString = '';
            for (let i = 0; i < literals.length; i++) {
                const lit = literals[i];
                formatString += lit;
                if (i < placeholders.length) {
                    formatString += '{' + i + '}';
                }
            }
            parsed = parseTemplate(i18n.get(formatString));
            formatCache.set(literals, parsed);
        }

        return parsed.map(x => typeof x == 'number' ? placeholders[x] : x);
    }
}

function parseTemplate(template: string): (string | number)[] {
    const result: (string | number)[] = [];
    let state = 0; // 0: normal / 1: after '{' / 2: after '}' / 3: after '{' and numbers
    let buf = '';
    for (let i = 0; i < template.length; i++) {
        const ch = template[i];
        switch (ch) {
            case '{':
                if (state == 0) state = 1;
                else if (state == 1) { state = 0; buf += '{'; }
                else throw new Error(`Expected number, got '${ch}' at ${i}`);
                break;
            case '}':
                if (state == 3) { state = 0; result.push(+buf); buf = ''; }
                else if (state == 0) { state = 2; }
                else if (state == 2) { state = 0; buf += '}'; }
                else throw new Error(`Expected number, got '${ch}' at ${i}`);
                break;
            default:
                if (state == 2) throw new Error(`Expected '}', got '${ch}' at ${i}`);
                else if (state == 1) { state = 3; if (buf) result.push(buf); buf = ''; }
                buf += ch;
        }
    }
    if (state != 0) throw new Error("Unexpected end of template string");
    if (buf) result.push(buf);
    return result;
}

export var i18n = new I18n();

export const I = createStringBuilder(i18n);
