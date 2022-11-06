import { track, trigger } from "./effect"
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // 获取值
      const val = Reflect.get(target, key)
      // 收集依赖
      track(target, key)
      return val
    },
    set(target, key, newVal) {
      const res = Reflect.set(target, key, newVal)
      // 触发更新
      trigger(target, key)
      return res
    }
  })
}