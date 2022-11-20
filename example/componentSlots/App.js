import { h, createTextVNode } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  // render 函数
  render() {
    const app = h("div", {}, "App");
    // const foo = h(Foo, {}, [h("p", {}, "123"), h("p", {}, "456")]);
    // 具名插槽
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h("p", {}, "age: " + age),
          createTextVNode("text node"),
        ],
        footer: () => h("p", {}, "456"),
      }
    );
    return h("div", {}, [app, foo]);
  },
  // composition-api
  setup() {
    return {};
  },
};
