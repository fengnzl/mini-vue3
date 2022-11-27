import { h } from "../../lib/guide-mini-vue.esm.js";
import { ArrayToArray } from "./ArrayToArray.js";
import { ArrayToText } from "./ArrayToText.js";
import { TextToArray } from "./TextToArray.js";
import { TextToText } from "./TextToText.js";

export const App = {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [
      h("p", {}, "首页"),
      // 数组变文本
      // h(ArrayToText),
      // 文本变数组
      // h(TextToArray),
      // 文本变文本
      // h(TextToText),
      // 数组变数组
      h(ArrayToArray),
    ]);
  },
};
