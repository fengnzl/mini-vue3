import { track, trigger } from "./effect";
import { ReactiveFlags, readonly, reactive } from "./reactive";
import { isObject } from "./shared/utils";

function createGretter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    // 获取值
    const val = Reflect.get(target, key);

    // 如果属性值是对象，则递归转换成 reactive 或 readonly
    if (isObject(val)) {
      return isReadonly ? readonly(val) : reactive(val);
    }
    if (!isReadonly) {
      // 收集依赖
      track(target, key);
    }
    return val;
  };
}

function createSetter() {
  return function set(target, key, newVal) {
    const res = Reflect.set(target, key, newVal);
    // 触发更新
    trigger(target, key);
    return res;
  };
}
const get = createGretter();
const set = createSetter();
const readonlyGet = createGretter(true);

export const mutableHandler = {
  get,
  set,
};

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`Set operation on key "${key}" failed: target is readonly`);
    return true;
  },
};
