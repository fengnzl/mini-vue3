import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  // render 函数
  render() {
    const app = h("div", {}, "App");
    const foo = h(Foo, {}, h("p", {}, "123"));
    return h("div", {}, [app, foo]);
  },
  // composition-api
  setup() {
    return {};
  },
};
