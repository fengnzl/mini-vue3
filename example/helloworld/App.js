import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  // render 函数
  render() {
    return h("div", "hi, " + this.msg);
  },
  // composition-api
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
