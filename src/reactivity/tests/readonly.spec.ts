import { readonly } from "../reactive";
describe('reactivity/reaonly', () => {
  it('value should be same', () => {
    const original = { foo: 1, bar: { barz: 2 } }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.bar.barz).toBe(2)
  });

  it('should not allow mutation', () => {
    console.warn = jest.fn()
    const user = readonly({
      age: 10
    })
    user.age++
    expect(console.warn).toHaveBeenCalled()
  });
});