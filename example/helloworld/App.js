import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  // render 函数
  render() {
    return h(
      "div",
      {
        class: "main",
        id: "main",
      },
      // "hi, " + this.msg
      // string
      // "hi, mini-vue"
      // array
      [
        h("p", { class: "red" }, "red content"),
        h("p", { class: "lightblue" }, "hello mini-vue"),
      ]
    );
  },
  // composition-api
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
