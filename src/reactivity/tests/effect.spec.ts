import { reactive } from "../reactive";
import { effect } from "../effect";

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 18,
    })
    let userAge
    effect(() => userAge = user.age)
    expect(userAge).toBe(18)
    user.age++
    expect(userAge).toBe(19)
  });
});