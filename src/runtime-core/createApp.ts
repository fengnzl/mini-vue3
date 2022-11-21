import { createVnode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      // 接收挂载点
      mount(rootContainer) {
        // 先转换成 vnode
        // 后续逻辑处理基于 vnode 进行处理
        const vnode = createVnode(rootComponent);
        // 渲染
        render(vnode, rootContainer);
      },
    };
  };
}
