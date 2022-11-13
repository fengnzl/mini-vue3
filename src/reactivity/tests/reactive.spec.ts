import { isProxy, isReactive, reactive } from "../reactive";
describe("reactivity/reactive", () => {
  it("Object", () => {
    const obj = { age: 1 };
    const reactiveObj = reactive(obj);

    expect(reactiveObj).not.toBe(obj);
    expect(isReactive(reactiveObj)).toBe(true);
    expect(isReactive(obj)).toBe(false);
    expect(reactiveObj.age).toBe(1);
    expect(isProxy(reactiveObj)).toBe(true);
    expect(isProxy(obj)).toBe(false);
  });
  it("nested value should be reactive", () => {
    const original = {
      nested: {
        foo: 1,
      },
      bar: [{ barz: 2 }],
    };
    const wrapped = reactive(original);
    expect(isReactive(wrapped.nested)).toBe(true);
    expect(isReactive(wrapped.bar)).toBe(true);
    expect(isReactive(wrapped.bar[0])).toBe(true);
    expect(wrapped.nested.foo).toBe(1);
  });
});
