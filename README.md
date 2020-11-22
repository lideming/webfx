# webfx - My Web Framework

[![](https://data.jsdelivr.com/v1/package/npm/@yuuza/webfx/badge?style=rounded)](https://www.jsdelivr.com/package/npm/@yuuza/webfx)

Created for [MusicCloud](https://github.com/lideming/MusicCloud).

## Files

* `utils.ts`
  + Utilities
* `i18n.ts`
  + Internationalization (i18n) helper
* `view.ts`
  + The core of a very simple (MVVM?) framework
* `viewlib.ts`
  + Some `View`s (Button, Input, ListView, Menu, Dialog, Toast, etc.)
* `style.css`
  + CSS for the viewlib
* `dist/`
  * `webfx.js`
    + A bundle for browsers (and there is a `.min.js` version)
  * `webfxcore.min.js`
    + Another bundle without the viewlib and style (it is much smaller)
  * `webfx.esm.js`
    + A bundle as a ES module

## Getting Started

Add webfx to your web page:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.5.4/dist/webfx.min.js"></script>
```

Or if you don't need the viewlib:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.5.4/dist/webfxcore.min.js"></script>
```

[Demo](https://gh.yuuza.net/webfx/demo/counter.html) ([Source code](https://github.com/lideming/webfx/blob/master/demo/counter.html))

(TBD)
