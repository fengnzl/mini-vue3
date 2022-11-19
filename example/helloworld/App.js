import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  name: "App",
  // render 函数
  render() {
    window.self = this;
    return h(
      "div",
      {
        class: "main",
        id: "main",
        onClick() {
          console.log("clicked");
        },
        onMousedown() {
          console.log("mousedown");
        },
      },
      // setupState
      // this.$el
      // "hi, " + this.msg
      [
        // string
        // "hi, mini-vue"
        // array
        // [
        //   h("p", { class: "red" }, "red content"),
        //   h("p", { class: "lightblue" }, "hello mini-vue"),
        // ]
        h("p", {}, `hi, ${this.msg}`),
        h(Foo, { count: 1 }),
      ]
    );
  },
  // composition-api
  setup() {
    return {
      msg: "mini-vue-haha",
    };
  },
};
