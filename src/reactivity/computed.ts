import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  // 标识位 是否需要重新执行获取新值
  private _dirty = true;
  private _effect;
  private _value;
  constructor(getter) {
    // 需要监听 getter 里面数据的变化
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }
  get value() {
    // 只有依赖的响应式数据发生变化 才需要重新执行获取新值
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
