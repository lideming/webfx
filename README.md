# Webfx

Web UI framework and utilities.

It was originally created for [MusicCloud](https://github.com/lideming/MusicCloud).

[![](https://data.jsdelivr.com/v1/package/npm/@yuuza/webfx/badge?style=rounded)](https://www.jsdelivr.com/package/npm/@yuuza/webfx)

## Files

* `utils.ts` - Utilities
* `i18n.ts` - Internationalization (i18n) helper
* `view.ts` - The core of a very simple Web UI framework
* `viewlib.ts` - Some `View`s (Button, Input, ListView, Menu, Dialog, Toast, etc.)
* `style.css` - CSS for the viewlib
* `dist/` - Bundles
  * `webfx.js` - for browsers (and there is a `.min.js` version)
  * `webfxcore.min.js` - without the viewlib and style (it is much smaller)
  * `webfx.esm.js` - ES module

## Installation

### Import from modules

Install the module locally using `npm`:

```shell
npm install @yuuza/webfx
```

Import from ES modules:

```ts
import { View, ButtonView } from "@yuuza/webfx";
```

### Load into the browser directly

Add webfx to your web page:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.6.0/dist/webfx.min.js"></script>
```

Or if you don't need the viewlib:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.6.0/dist/webfxcore.min.js"></script>
```

Then the module can be accessed from global variable `webfx`:

```js
const { View, ButtonView } = webfx;
```

## Getting Started

### Create a view component

```js
class Hello extends View {
  createDom() {
    return {
      tag: 'p.text.bold#hello',
      text: 'hello webfx'
    }
  }
}
document.body.appendChild(new Hello().dom);
```
Renders:
```html
<p class="text bold" id="hello">hello webfx</p>
```

### Use properties

```js
webfx.injectWebfxCss();
class Counter extends View {
  constructor() {
    super();
    this.count = 0;
  }
  createDom() {
    return {
      tag: 'div.counter',
      child: [
        'Count: ', () => this.count, {tag: 'br'},
        new ButtonView({ text: 'Click me', onActive: () => {
          this.updateWith({count: this.count + 1});
        }})
      ]
    }
  }
}
document.body.appendChild(new Counter().dom);
```

Renders:
```html
<div class="counter">
  Count: 9<br>
  <div class="btn" tabindex="0">Click me</div>
</div>
```

### Use hooks

```js
webfx.injectWebfxCss();
class Counter extends View {
  constructor() {
    super();
    this.count = 0;
  }
  createDom() {
    return {
      tag: 'div.counter',
      child: [
        'Count: ',
        {
          tag: 'span',
          text: () => this.count,
          init: (dom) => { console.info('the <span> DOM is created', dom); },
          update: (dom) => { dom.style.fontSize = `${14 + this.count}px`; }
        },
        {tag: 'br'},

        new ButtonView({text: 'Click me', onActive: () => {
          this.updateWith({count: this.count + 1});
        }})
      ]
    }
  }
  postCreateDom() {
    super.postCreateDom();
    console.info('the counter DOM is created', this.dom);
  }
  updateDom() {
    super.updateDom();
    console.info('the counter DOM is updated', this.dom);
  }
}
document.body.appendChild(new Counter().dom);
```

### Use ListView

(TBD)


### Use JSX/TSX

```jsx
webfx.injectWebfxCss();
class Counter extends View {
  constructor() {
    super();
    this.count = 0;
  }
  createDom() {
    return (
      <div class="counter">
        Count: {() => this.count}<br/>
        <ButtonView onActive={() => {
          this.updateWith({count: this.count + 1});
        }}>
            Click me
        </ButtonView>
      </div>
    );
  }
}
document.body.appendChild(new Counter().dom);
```

## Demos

[Counter & viewlib](https://gh.yuuza.net/webfx/demo/counter.html)
([HTML + JS](https://github.com/lideming/webfx/blob/master/demo/counter.html))
([JSX](https://github.com/lideming/webfx/blob/master/demo/counter.jsx))

[Human-ping](https://gh.yuuza.net/webfx/demo/human-ping.html)
([HTML + JS](https://github.com/lideming/webfx/blob/master/demo/human-ping.html))

## Todos

- [ ] Mount / unmount events
- [ ] Functional DOM tree updating
- [ ] React-like function components with hooks

(TBD)
