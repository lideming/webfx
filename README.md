# webfx - My Web Framework

[![](https://data.jsdelivr.com/v1/package/npm/@yuuza/webfx/badge?style=rounded)](https://www.jsdelivr.com/package/npm/@yuuza/webfx)

Created for [MusicCloud](https://github.com/lideming/MusicCloud).

## Files

* `utils.ts`
  + Utilities
* `i18n.ts`
  + Internationalization (i18n) helper
* `viewlib.ts`
  + Very simple (MVVM?) framework with some views
* `style.css`
  + CSS for the viewlib
* `dist/`
  * `webfx.js`
    + Js bundle for browsers (and there is a `.min.js` version)
  * `webfxcore.min.js`
    + A much smaller js bundle without the viewlib and style

## Getting Started

Add webfx to your web page:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.5.0/dist/webfx.min.js"></script>
```

Or if you don't need the viewlib:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.5.0/dist/webfxcore.min.js"></script>
```

(TBD)
