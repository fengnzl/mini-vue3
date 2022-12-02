import { ShapeFlags } from "../shared/ShapeFlags";
import { isObject } from "../shared/utils";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export function createVnode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
    el: null,
    component: null, // 组件实例
  };

  // 根据 children 再次处理 shapeFlage
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 如果是组件，且children 为对象，则认为其是 SLOT_CHILDREN 类型
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}

export function createTextVNode(str: string) {
  return createVnode(Text, {}, str);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
