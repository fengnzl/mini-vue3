import { trackEffects, triggerEffects, isTracking } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared/utils";
class RefImpl {
  private _value;
  public dep = new Set();
  private _rawValue;
  public __v__isRef = true;
  constructor(value) {
    // 如果是对象 则需要使用 reactive 将内部属性都转换为 响应式
    this._value = convert(value);
    this._rawValue = value;
  }
  // 属性访问器
  get value() {
    // 访问属性时 需要进行依赖收集
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    // 对比 value 值是否发生变化
    if (hasChanged(this._rawValue, newVal)) {
      // 先设置值，再去触发
      this._rawValue = newVal;
      this._value = convert(newVal);
      // 设置变量的时候，触发依赖
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v__isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(obj) {
  return new Proxy(obj, {
    get(taget, key) {
      // 如果属性值是 ref 则返回 ref.value 否值直接返回 属性值
      return unRef(Reflect.get(taget, key));
    },
    set(target, key, newVal) {
      // 如果属性值是 ref 且变化后的值不是 ref 则需要通过 .value 进行改变
      if (isRef(target[key]) && !isRef(newVal)) {
        return (target[key].value = newVal);
      } else {
        return Reflect.set(target, key, newVal);
      }
    },
  });
}
