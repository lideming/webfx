# Webfx

Web UI framework and utilities.

It was originally created for [MusicCloud][musiccloud-repo].

[![npm](https://img.shields.io/npm/dy/@yuuza/webfx?label=%40yuuza%2Fwebfx&logo=npm)](https://www.npmjs.com/package/@yuuza/webfx)

## Demos

- [Counter & viewlib](https://webfx.yuuza.net/counter.html)
  ([HTML + JS](https://github.com/lideming/webfx/blob/master/demo/counter.html))
  ([JSX](https://github.com/lideming/webfx/blob/master/demo/counter.jsx))

- [Human-ping](https://webfx.yuuza.net/human-ping.html)
  ([HTML + JS](https://github.com/lideming/webfx/blob/master/demo/human-ping.html))

- And of cource [MusicCloud (GitHub repo)][musiccloud-repo]

[musiccloud-repo]: https://github.com/lideming/MusicCloud

## Project Structure

- `buildDOM.ts` - View and DOM builder
- `view.ts` - The core of View
- `packages/`
  - `utils` - [Utilities](packages/utils)
  - `i18n` - [Internationalization (i18n) helper](packages/i18n)
- `views/` - Some built-in Views and helpers
  - `Basics`
  - `ListView`
  - `Dialog`
  - `Menu`
  - `Overlay`
  - `Toast`
  - `LoadingIndicator`
  - `Section`
- `style.css` - CSS for the built-in views
- `dist/` - Bundles
  - `webfx.js` - UMD bundle for browsers (+ `.min.js` version)
  - `webfxcore.min.js` - UMD bundle without the viewlib and style
  - `webfx.esm.js` - ESM bundle

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
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.9.12/dist/webfx.min.js"></script>
```

Or if you don't need the viewlib:

```html
<script src="https://cdn.jsdelivr.net/npm/@yuuza/webfx@1.9.12/dist/webfxcore.min.js"></script>
```

Then the module can be accessed from global variable `webfx`:

```js
const { View, ButtonView, mountView } = webfx;
```

## Usage

### A basic view component

```js
// Define a very basic view class
class Hello extends View {
  createDom() {
    // Returns a DOM expression object for rendering.
    return {
      tag: "p.text.bold#hello",
      text: "hello webfx",
    };
  }
}

// Create an instance of the view and mount it onto the <body>.
mountView(document.body, new Hello());
```

**Renders**:

```html
<p class="text bold" id="hello">hello webfx</p>
```

Note: You can omit the `createDom()` can be omited if you want an empty `<div>`.

### DOM Expression

A DOM Expression is an object of type `BuildDomNode`, or a `View` object, a string, a number, or a function that returns a string or number.

```ts
type BuildDomNode = {
  tag?: BuildDomTag; // A string that indicates a DOM tag name, class names, and id, similar to a CSS selector.
  child?: BuildDomExpr[] | BuildDomExpr; // One or more DOM expressions as the children.
  text?: FuncOrVal<string>; // A shortcut for `textContent`. It can be a function, see below.
  hidden?: FuncOrVal<boolean>; // The `hidden` property, but can be a function, see below.
  init?: Action<HTMLElement>; // A callback that is called when the DOM is created.
  update?: Action<HTMLElement>; // A callback that is called when the view is updated.
  // ...internal properties omitted...
};
```

The `text` and `hidden` callbacks will be called in `updateDom()`.

### Properties and Child Elements

Webfx does not have `state`s; they are just properties.

You can use the `child` key in the DOM expression for child elements.

```js
// Inject Webfx CSS.
webfx.injectWebfxCss();

class Counter extends View {
  constructor() {
    super();
    this.count = 0;
  }

  createDom() {
    return {
      tag: "div.counter",
      child: [
        "Count: ",
        () => this.count,
        { tag: "br" },
        new ButtonView({
          text: "Click me",
          onActive: () => {
            this.updateWith({ count: this.count + 1 });
          },
        }),
      ],
    };
  }
}

// Mount the view onto the body element.
mountView(document.body, new Counter());
```

**Renders:**

```html
<div class="counter">
  Count: 9
  <br />
  <div class="btn" tabindex="0">Click me</div>
</div>
```

### Hook Methods

Webfx provides two hook methods:

- `postCreateDom()`: called when the DOM is just created.
- `updateDom()`: called after `postCreateDom()`. Can also be called manually by `updateDom()`.

`updateWith()` is a shortcut for changing properties and calling `updateDom()`.

Note: When overriding these methods, call the `super` method.

```js
webfx.injectWebfxCss();

class Counter extends View {
  constructor() {
    super();
    this.count = 0;
  }

  createDom() {
    return {
      tag: "div.counter",
      child: [
        "Count: ",
        {
          tag: "span",
          text: () => this.count,
          init: (dom) => {
            console.info("the <span> DOM is created", dom);
          },
          update: (dom) => {
            dom.style.fontSize = `${14 + this.count}px`;
          },
        },
        { tag: "br" },

        new ButtonView({
          text: "Click me",
          onActive: () => {
            this.updateWith({ count: this.count + 1 });
          },
        }),
      ],
    };
  }

  postCreateDom() {
    super.postCreateDom();
    console.info("the counter DOM is created", this.dom);
  }

  updateDom() {
    super.updateDom();
    console.info("the counter DOM is updated", this.dom);
  }
}

// Mount the view onto the body element.
mountView(document.body, new Counter());
```

### ListView

(TBD)

### Using JSX/TSX

Before using JSX/TSX, make sure to set `jsx()` as the JSX factory in the transpiler.

You can do this in one of two ways:

- Set `"jsxFactory": "jsx"` in `tsconfig.json`.
- Use `/** @jsx jsx */` in your source code.

```jsx
/** @jsx jsx */
import { View, ButtonView, jsx } from "@yuuza/webfx";

webfx.injectWebfxCss();

class Counter extends View {
  constructor() {
    super();
    this.count = 0;
  }

  createDom() {
    return (
      <div class="counter">
        Count: {() => this.count}
        <br />
        <ButtonView
          onActive={() => {
            this.updateWith({ count: this.count + 1 });
          }}
        >
          Click me
        </ButtonView>
      </div>
    );
  }
}

// Mount the view onto the body element.
mountView(document.body, new Counter());
```

## Todos

- [ ] Implement functional DOM tree updating.
- [ ] Add React-like function components with hooks.

(TBD)
