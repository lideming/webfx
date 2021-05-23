# Webfx

Web UI framework and utilities.

It was originally created for [MusicCloud](https://github.com/lideming/MusicCloud).

[![npm](https://img.shields.io/npm/dy/@yuuza/webfx?label=%40yuuza%2Fwebfx&logo=npm)](https://www.npmjs.com/package/@yuuza/webfx)

## Demos

* [Counter & viewlib](https://gh.yuuza.net/webfx/demo/counter.html)
([HTML + JS](https://github.com/lideming/webfx/blob/master/demo/counter.html))
([JSX](https://github.com/lideming/webfx/blob/master/demo/counter.jsx))

* [Human-ping](https://gh.yuuza.net/webfx/demo/human-ping.html)
([HTML + JS](https://github.com/lideming/webfx/blob/master/demo/human-ping.html))

* And of cource [MusicCloud (GitHub repo)](https://github.com/lideming/MusicCloud)

## Project Structure

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

## Usage

### A basic view component

```js
// Define a very basic view class
class Hello extends View {
  createDom() {
    // Returns a so-called "DOM expression" object.
    return {
      tag: 'p.text.bold#hello',
      text: 'hello webfx'
    }
  }
}

// Create a instance of the view and append it into <body>.
document.body.appendChild(new Hello().dom);
```
Renders:
```html
<p class="text bold" id="hello">hello webfx</p>
```

Note: `createDom()` can be omited, then the DOM will be an empty `<div>`.


### DOM Expression

A DOM Expression is a `BuildDomNode` object, `View` object, string, number or function (which returns string/number only).

```ts
type BuildDomNode = {
    tag?: BuildDomTag;  // A string indicates DOM tag name, class names and id, similar to CSS seletor.
    child?: BuildDomExpr[] | BuildDomExpr;  // One or more DOM expressions as the children.
    text?: FuncOrVal<string>;  // Shortcut for `textContent`, can be a function, see below.
    hidden?: FuncOrVal<boolean>;  // `hidden` but can be a function, see below.
    init?: Action<HTMLElement>;  // A callback that is called on the DOM created.
    update?: Action<HTMLElement>;  // A callback that is called on the View updated.
    // ...omited internal properties...
}
```

The `text` and `hidden` callbacks will be called in `updateDom()`.


### Properties and Child Elements

There are no `state`s in webfx. They're just properties.

Use the `child` key in DOM expression for child elements.

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

### Hook methods

`postCreateDom()` is called when the DOM is just created.

`updateDom()` is called after `postCreateDom()`, also be called manually by `updateDom()`.

`updateWith()` is a shortcut for changing properties and calling `updateDom()`.

Note: Remember to call the `super` method when overriding these methods.

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

### ListView

(TBD)


### JSX/TSX

Some configuration is required to make the JSX/TSX compiler use the correct JSX factory. Set `"jsxFactory": "jsx"` in `tsconfig.json` or use `/** @jsx jsx */`.

```jsx
/** @jsx jsx */
import { View, jsx } from "@yuuza/webfx";

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

### I18n Helper

Using the [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) feature, the i18n is very easy.

```js
import { i18n, I } from "@yuuza/webfx";

i18n.add2dArray([
    ['en', 'zh'],
    ['Hello!', '你好！'],
    ['My name is {0}.', '我的名字是 {0}。']
]);

function sayHello(name) {
    console.log(I`Hello!`);
    console.log(I`My name is ${name}.`);
}

i18n.curLang = 'en';
sayHello('Yuuza');
// Hello!
// My name is Yuuza.

i18n.curLang = 'zh';
sayHello('Yuuza');
// 你好！
// 我的名字是 Yuuza。
```

## Todos

- [ ] Mount / unmount events
- [ ] Functional DOM tree updating
- [ ] React-like function components with hooks

(TBD)
