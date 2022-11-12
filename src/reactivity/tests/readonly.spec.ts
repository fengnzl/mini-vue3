import { isReadonly, readonly } from "../reactive";
describe("reactivity/reaonly", () => {
  it("Object", () => {
    const original = { foo: 1, bar: { barz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(wrapped.bar.barz).toBe(2);
  });

  it("should not allow mutation", () => {
    console.warn = jest.fn();
    const user = readonly({
      age: 10,
    });
    user.age++;
    expect(console.warn).toHaveBeenCalled();
  });
  it("nested value should be readonly", () => {
    const original = {
      nested: {
        foo: 1,
      },
      bar: [{ barz: 2 }],
    };
    const wrapped = readonly(original);
    expect(isReadonly(wrapped.nested)).toBe(true);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(wrapped.bar[0])).toBe(true);
    expect(wrapped.nested.foo).toBe(1);
    console.warn = jest.fn();
    wrapped.nested.foo++;
    expect(console.warn).toHaveBeenCalled();
  });
});
