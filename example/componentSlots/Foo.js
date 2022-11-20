import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "Foo");
    // foo 组件， vnode.children 里面添加 slots
    // 单个 slot h("p", {}, "123")
    // 多个数组 [h("p", {}, "123"), h("p", {}, "456")] -》 renderSlots
    // 具名插槽 对象 { header: slot, footer: slot }
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
