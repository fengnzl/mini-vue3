import { extend } from "./shared/utils"

class ReactiveEffect {
  private _fn
  public deps = []
  private _isActive = true
  public onStop?: () => {}
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

  stop() {
    // 调用 stop 方法 cleanupEffect 只执行一次
    if (this._isActive) {
      // 如果 onStop 存在 则会调用一次 onStop
      if (this.onStop) {
        this.onStop()
      }
      cleanupEffect(this);
      this._isActive = false
    }
  }
}
// 从收集了 effect 的 deps 中删除 effect
function cleanupEffect(effect) {
  effect.deps.forEach(deps => {
    deps.delete(effect)
  })
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
  // 将 deps 添加到 activeEffect.deps 用于 stop 函数时将依赖删除
  activeEffect.deps.push(deps)
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
  extend(_effect, options)
  // 执行副作用函数 其中访问对象时会进行依赖收集
  _effect.run()
  // 返回 runner 函数
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect

  return runner
}

// 调用 stop 的时候应该将 effect 从 deps 中删除
export function stop(runner) {
  runner.effect.stop()
}