import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "Foo");
    // foo 组件， vnode.children 里面添加 slots
    return h("div", {}, [foo, this.$slots]);
  },
};
