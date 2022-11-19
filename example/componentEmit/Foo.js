import { h } from "../../lib/guide-mini-vue.esm.js";
export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    // 1 可以在 setup 中使用 props
    // props.count
    console.log(props);
    // 2 在 h 函数中可以通过 this.xxx 访问 props 里的数据
    // 3 props 是 shallowReadonly
    props.count++;
    console.log(props);

    const addEmit = () => {
      console.log("emit add");
      emit("add", 1, 2);
      emit("add-foo");
    };
    return {
      addEmit,
    };
  },
  render() {
    const btn = h("button", { onClick: this.addEmit }, "emit Btn");
    const foo = h("div", {}, `Hi: ${this.count}`);
    return h("div", {}, [foo, btn]);
  },
};
