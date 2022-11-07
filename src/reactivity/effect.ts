class ReactiveEffect {
  private _fn
  constructor(fn, public scheduler?) {
    this._fn = fn
  }
  // 运行副作用函数
  run() {
    activeEffect = this;
    // 获取调用函数的返回值
    const res = this._fn()
    return res
  }
}
const targetMap = new WeakMap()
// 收集依赖
// WeakMap -> Map -> Set
export function track(target, key) {
  // 如果没有副作用函数 说明无需依赖需要收集
  if (!activeEffect) return
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect)
}
// 触发更新
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  // 获取 key 所对应的依赖执行
  deps.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run();
    }
  });
}

// 当前的副作用函数
let activeEffect
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 执行副作用函数 其中访问对象时会进行依赖收集
  _effect.run()
  // 返回 runner 函数
  return _effect.run.bind(_effect)
}