import { isReadonly, shallowReadonly } from "../reactive";
describe("reactivity/shallowReaonly", () => {
  it("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });

  it("should call console.warn when set", () => {
    console.warn = jest.fn();
    const user = shallowReadonly({ age: 11 });
    user.age++;
    expect(console.warn).toHaveBeenCalled();
  });
});
