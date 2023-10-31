// file: viewlib.ts

import { injectCss } from "./viewUtils";
import css from "../../style.css";

export function getWebfxCss() {
  return css;
}

let cssInjected = false;
export function injectWebfxCss(options?: { parent?: Node }) {
  if (!cssInjected) {
    injectCss(getWebfxCss(), { ...options, tag: "style.webfx-injected-style" });
    cssInjected = true;
  }
}

// Views and helpers are moved to ../views/
