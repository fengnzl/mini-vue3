import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  name: "App",
  // render 函数
  render() {
    window.self = this;
    return h("div", {}, [
      h("p", {}, `hi, ${this.msg}`),
      h(Foo, {
        count: 1,
        onAdd(a, b) {
          console.log("onAdd", a, b);
        },
        onAddFoo() {
          console.log("onAddFoo");
        },
      }),
    ]);
  },
  // composition-api
  setup() {
    return {
      msg: "mini-vue-haha",
    };
  },
};
