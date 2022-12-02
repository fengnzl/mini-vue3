import { h, ref } from "../../lib/guide-mini-vue.esm.js";
import { Child } from "./Child.js";

export const App = {
  name: "App",
  setup() {
    const msg = ref("123");
    const changeChildProps = () => {
      msg.value = "456";
    };
    window.msg = msg;

    const count = ref(1);
    const changeCount = () => count.value++;
    return {
      msg,
      changeChildProps,
      count,
      changeCount,
    };
  },
  render() {
    return h("div", {}, [
      h("p", {}, "你好"),
      h("button", { onClick: this.changeChildProps }, "change child props"),
      h(Child, { msg: this.msg }),
      h("button", { onClick: this.changeCount }, "change count"),
      h("p", {}, `count: ${this.count}`),
    ]);
  },
};
