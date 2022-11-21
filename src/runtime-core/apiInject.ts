import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存入 provide 数据
  const currentInstacne: any = getCurrentInstance();
  const { provides } = currentInstacne;
  provides[key] = value;
}

export function inject(key) {
  // 取出对应的数据
  const currentInstance: any = getCurrentInstance();
  const provides = currentInstance.parent.provides;
  return provides[key];
}
