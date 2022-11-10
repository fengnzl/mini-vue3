import { isReactive, reactive } from "../reactive";
describe('reactivity/reactive', () => {
  it('Object', () => {
    const obj = { age: 1 }
    const reactiveObj = reactive(obj)

    expect(reactiveObj).not.toBe(obj);
    expect(isReactive(reactiveObj)).toBe(true);
    expect(isReactive(obj)).toBe(false);
    expect(reactiveObj.age).toBe(1);
  });
});