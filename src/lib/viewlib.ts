// file: viewlib.ts

import { injectCss } from "./utils";
import css from "../../style.css";

export function getWebfxCss() { return css; }
let cssInjected = false;
export function injectWebfxCss() {
    if (!cssInjected) {
        injectCss(getWebfxCss(), { tag: 'style.webfx-injected-style' });
        cssInjected = true;
    }
}

// Views and helpers are moved to ../views/
