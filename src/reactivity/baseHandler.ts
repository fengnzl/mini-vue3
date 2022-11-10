import { track, trigger } from "./effect";


function createGretter(isReadonly = false) {
  return function get(target, key) {
    // 获取值
    const val = Reflect.get(target, key);
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
const readonlyGet = createGretter(true)

export const mutableHandler = {
  get,
  set,
}

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`Set operation on key "${key}" failed: target is readonly`);
    return true
  }
};