import { h, createApp, provide, inject } from "../../lib/guide-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ConsumerTwo)]);
  },
};

const ConsumerTwo = {
  name: "ConsumerTwo",
  setup() {
    provide("foo", "fooValTwo");
    const foo = inject("foo");
    // inject 可以传递默认值
    const test = inject("test", "testDefault");
    const test2 = inject("test2", () => "test2Default");
    return {
      foo,
      test,
      test2,
    };
  },
  render() {
    return h("div", {}, [
      h(
        "p",
        {},
        `ConsumerTwo-foo: ${this.foo}-test: ${this.test} - test2: ${this.test2}`
      ),
      h(Consumer),
    ]);
  },
};
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    return {
      foo,
      bar,
    };
  },
  render() {
    return h("div", {}, `Consumer-foo:${this.foo}-bar:${this.bar}`);
  },
};

const App = {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

const rootContainer = document.querySelector("#app");
createApp(App).mount(rootContainer);
