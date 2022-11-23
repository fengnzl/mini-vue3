import { createComponentInstance, setupComponent } from "./component";
import { isObject } from "../shared/utils";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/effect";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;

  function render(vnode, container) {
    // 调用 patch 方法
    // 第一渲染 老 vnode 为 null
    patch(null, vnode, container, null);
  }
  // n1 老的 vnode， n2 新的 vnode
  function patch(n1, n2, container, parentComponent) {
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        // 如果是 element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }
  function processText(n1, n2, container) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }
  function patchElement(n1, n2, container) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);
  }

  function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    // props
    // 以 on 开头的当作是事件处理 如 onClick 事件
    if (isObject(props)) {
      for (const key of Object.keys(props)) {
        const val = props[key];
        // const isOn = (key) => /^on[A-Z]/.test(key);
        // if (isOn(key)) {
        //   // 获取事件名称
        //   const event = key.slice(2).toLowerCase();
        //   el.addEventListener(event, val);
        // } else {
        //   el.setAttribute(key, val);
        // }
        hostPatchProp(el, key, val);
      }
    }
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }
    hostInsert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((child) =>
      patch(null, child, container, parentComponent)
    );
  }

  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initialVnode: any, container, parentComponent) {
    // 获取组件的实例
    const instance = createComponentInstance(initialVnode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
  }

  function setupRenderEffect(instance, initialVnode, container) {
    // 进行渲染时的依赖收集，从而可以在改变的时候触发
    effect(() => {
      // 只能初始化一次，后续都是更新
      if (!instance.isMounted) {
        console.log("init");
        // 将 render 方法的 this 绑定为 instance 的 proxy 代理对象
        // 从而在 h 方法中可以使用 this 获取setup 返回的属性和方法
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        // 虚拟节点树 调用 patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance);
        // 将虚拟节点树 mountElement 时创建的 dom 树挂载到 vnode.el 属性
        // 从而可以通过 this.$el 可以获取组件的 root dom 节点
        initialVnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log("updated");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevTree = instance.subTree;
        patch(prevTree, subTree, container, instance);
        instance.subTree = subTree;
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
