import { h } from "../../lib/guide-mini-vue.esm.js";
export const Foo = {
  name: "Foo",
  setup(props) {
    // 1 可以在 setup 中使用 props
    // props.count
    console.log(props);
    // 2 在 h 函数中可以通过 this.xxx 访问 props 里的数据
    // 3 props 是 shallowReadonly
    props.count++;
    console.log(props);
  },
  render() {
    return h("div", {}, `Hi: ${this.count}`);
  },
};
