import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => {
      count.value++;
    };
    const props = ref({
      foo: "foo",
      bar: "bar",
    });
    const changeProps1 = () => {
      props.value.foo = "new-foo";
    };
    const changeProps2 = () => {
      props.value.foo = undefined;
    };
    const changeProps3 = () => {
      props.value = {
        foo: "foo-again",
      };
    };
    return {
      count,
      onClick,
      props,
      changeProps1,
      changeProps2,
      changeProps3,
    };
  },
  render() {
    return h(
      "div",
      {
        ...this.props,
      },
      [
        h("div", {}, `count: ${this.count}`),
        h("button", { onClick: this.onClick }, "点击"),
        h(
          "button",
          { onClick: this.changeProps1 },
          "changePropsFoo-改变值-会更新"
        ),
        h(
          "button",
          { onClick: this.changeProps2 },
          "changePropsFoo2-值变为null或undefined-会删除"
        ),
        h(
          "button",
          { onClick: this.changeProps3 },
          "changePropsFoo3-删除key-删除"
        ),
      ]
    );
  },
};
