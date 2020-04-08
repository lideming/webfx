export interface I18nData {
    [lang: string]: LangObj;
}
export declare type LangObj = Record<string, string>;
/** Internationalization (aka i18n) helper class */
export declare class I18n {
    data: I18nData;
    curLang: string;
    missing: Map<string, 1>;
    /** Get i18n string for `key`, return `key` when not found. */
    get(key: any, arg?: any[]): string;
    /** Get i18n string for `key`, return `null` when not found. */
    get2(key: any, arg?: any[], lang?: string): string | null;
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
export declare function createStringBuilder(i18n: I18n): (literals: TemplateStringsArray, ...placeholders: any[]) => string;
export declare var i18n: I18n;
export declare const I: (literals: TemplateStringsArray, ...placeholders: any[]) => string;
