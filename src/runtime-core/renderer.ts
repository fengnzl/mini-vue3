import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用 patch 方法
  patch(vnode, container);
}

function patch(vnode, container) {
  // TODO 如果是 element
  // mountElement(vnode, container)
  // 处理组件
  processComponent(vnode, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  // 获取组件的实例
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();

  // 虚拟节点树 调用 patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
