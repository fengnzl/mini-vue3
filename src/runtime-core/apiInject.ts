import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存入 provide 数据
  const currentInstacne: any = getCurrentInstance();
  let { provides } = currentInstacne;
  const parentProvides = currentInstacne.parent.provides;
  // 因为在 component 初始化的时候判断父组件存在 provides 则当前组件的 provides 即为 parent.provides
  // 导致当前组件与父组件存在同名  provide key 时，会对父组件 provide 的数据进行覆盖
  // 从而在当前组件引入 inject 同名 key 的值不是父组件 provide 下来的数据
  // 需要判断当前组件 provides 是否与父组件 provides 相等，如果相等代表是第一次赋值，此时我们将父组件的 provides 作为当前组件 provides 的原型
  if (provides === parentProvides) {
    provides = currentInstacne.provides = Object.create(parentProvides);
  }
  provides[key] = value;
}

export function inject(key, defaultValue) {
  // 取出对应的数据
  const currentInstance: any = getCurrentInstance();
  const provides = currentInstance.parent.provides;
  if (key in provides) {
    return provides[key];
  } else if (defaultValue !== undefined) {
    // defaultValue 可能是一个函数
    if (typeof defaultValue === "function") {
      return defaultValue();
    }
    return defaultValue;
  }
}
