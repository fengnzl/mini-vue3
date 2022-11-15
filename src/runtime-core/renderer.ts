import { createComponentInstance, setupComponent } from "./component";
import { isObject } from "../shared/utils";

export function render(vnode, container) {
  // 调用 patch 方法
  patch(vnode, container);
}

function patch(vnode, container) {
  // 如果是 element
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    // 处理组件
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);
  const { props, children } = vnode;
  // props
  if (isObject(props)) {
    for (const key of Object.keys(props)) {
      el.setAttribute(key, props[key]);
    }
  }
  // children
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach((child) => patch(child, container));
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
