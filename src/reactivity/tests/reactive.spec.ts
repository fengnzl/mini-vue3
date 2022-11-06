import { reactive } from "../reactive";
describe('reactive', () => {
  it('happy path', () => {
    const obj = { age: 1 }
    const reactiveObj = reactive(obj)

    expect(reactiveObj).not.toBe(obj);
    expect(reactiveObj.age).toBe(1);
  });
});