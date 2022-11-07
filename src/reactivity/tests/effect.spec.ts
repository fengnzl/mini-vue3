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

  it('should ruturn runner when effect was called', () => {
    let count = 10;
    const runner = effect(() => {
      count++
      return 'count'
    })
    expect(count).toBe(11)
    const res = runner()
    expect(count).toBe(12)
    expect(res).toBe('count')
  });
});