import { reactive } from "../reactive";
import { effect, stop } from "../effect";

describe("reactivity/effect", () => {
  it("should handle single effect", () => {
    const user = reactive({
      age: 18,
    });
    let userAge;
    effect(() => (userAge = user.age));
    expect(userAge).toBe(18);
    user.age++;
    expect(userAge).toBe(19);
  });

  it("should ruturn runner when effect was called", () => {
    let count = 10;
    const runner = effect(() => {
      count++;
      return "count";
    });
    expect(count).toBe(11);
    const res = runner();
    expect(count).toBe(12);
    expect(res).toBe("count");
  });

  it("schedluer", () => {
    // 1、通过 effect 的第二个参数指定名为 scheduler 的 fn
    // 2、effect 第一次调用时，fn 仍然会调用
    // 3、响应式数据 set 时，update 触发不会调用 fn，而是 schdeuer 执行
    // 4、执行 runner 的时候 会再次执行 fn
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });

    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => (dummy = obj.prop));
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // 当执行 stop 之后，设置 obj 的属性 响应式应该消失
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
    // 手动执行 runner 之后，再次访问属性 应该是响应式的
    obj.prop++;
    expect(dummy).toBe(4);
  });
});

it("events: onStop", () => {
  const onStop = jest.fn();
  const runner = effect(() => {}, {
    onStop,
  });
  // 执行 stop 函数 onStop 会执行一次
  stop(runner);
  expect(onStop).toHaveBeenCalled();
});
