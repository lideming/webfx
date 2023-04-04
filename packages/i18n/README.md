# I18n Helper

(Also exported by package `@yuuza/webfx`)

Using the [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) feature, i18n is very easy to implement.

```js
import { i18n, I } from "@yuuza/i18n";

i18n.add2dArray([
  ["en", "zh"],
  ["Hello!", "你好！"],
  ["My name is {0}.", "我的名字是 {0}。"],
]);

function sayHello(name) {
  console.log(I`Hello!`);
  console.log(I`My name is ${name}.`);
}

i18n.curLang = "en";
sayHello("Yuuza");
// Hello!
// My name is Yuuza.

i18n.curLang = "zh";
sayHello("Yuuza");
// 你好！
// 我的名字是 Yuuza。
```
