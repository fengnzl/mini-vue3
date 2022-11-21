import { h } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  // render 函数
  render() {
    return h("rect", { x: this.x, y: this.y });
  },
  // composition-api
  setup() {
    return {
      x: 100,
      y: 100,
    };
  },
};
