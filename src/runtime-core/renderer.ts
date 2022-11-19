import { createComponentInstance, setupComponent } from "./component";
import { isObject } from "../shared/utils";
import { ShapeFlags } from "../shared/ShapeFlags";

export function render(vnode, container) {
  // 调用 patch 方法
  patch(vnode, container);
}

function patch(vnode, container) {
  const { shapeFlag } = vnode;
  // 如果是 element
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理组件
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type));
  const { props, children, shapeFlag } = vnode;
  // props
  // 以 on 开头的当作是事件处理 如 onClick 事件
  const isOn = (key) => /^on[A-Z]/.test(key);
  if (isObject(props)) {
    for (const key of Object.keys(props)) {
      if (isOn(key)) {
        // 获取事件名称
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, props[key]);
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  }
  // children
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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

function mountComponent(initialVnode: any, container) {
  // 获取组件的实例
  const instance = createComponentInstance(initialVnode);

  setupComponent(instance);
  setupRenderEffect(instance, initialVnode, container);
}

function setupRenderEffect(instance, initialVnode, container) {
  // 将 render 方法的 this 绑定为 instance 的 proxy 代理对象
  // 从而在 h 方法中可以使用 this 获取setup 返回的属性和方法
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  // 虚拟节点树 调用 patch
  // vnode -> element -> mountElement
  patch(subTree, container);
  // 将虚拟节点树 mountElement 时创建的 dom 树挂载到 vnode.el 属性
  // 从而可以通过 this.$el 可以获取组件的 root dom 节点
  initialVnode.el = subTree.el;
}
