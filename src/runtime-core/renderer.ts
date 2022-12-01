import { createComponentInstance, setupComponent } from "./component";
import { EMPTY_OBJ, isObject } from "../shared/utils";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/effect";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    // 调用 patch 方法
    // 第一渲染 老 vnode 为 null
    patch(null, vnode, container, null, null);
  }
  // n1 老的 vnode， n2 新的 vnode
  function patch(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        // 如果是 element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  function processText(n1, n2, container) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);
    // 更新 props
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;
    // 数组变文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 清空 children
        unmountChildren(n1.children);
      }
      // 设置文本内容
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      // 文本变数组的情况
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 清空children
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // 数组变数组
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    // 左侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      //  同一种类型 对比内部 props children
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 右侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 新的比老的多创建
    if (i > e1) {
      if (i <= e2) {
        // 处理新的在头部的情况
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i >= e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      const s1 = i;
      const s2 = i;
      // 记录已经 patch 的数量  当大于等于需要 patched 个数 则直接删除原节点即可
      const toBePatched = e2 - s2 + 1;
      let patched = 0;

      // 记录新旧节点中间 diff vnode 对应的索引值，默认 0 代表新增
      const newIndexToOldIndexMap = Array(toBePatched).fill(0);
      // 代表节点是否移动
      let moved = false;
      let maxNewIndexSoFar = 0;

      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        // 如果新的节点已经 patch 完，直接 remove 旧节点
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;
        // 如果 前一个 key 值 为 null 或 undefined 则需要遍历查找是否存在重复的
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = s2;
              break;
            }
          }
        }
        // 如果新节点在老节点中不存在
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 判断是否存在移动
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 更新旧节点位置对应新节点位置
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 这里只是找到中间节点并更新内容，但位置没有进行更新
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      // 获取最长递增子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 倒叙更新，确保 vnode 移动的时候 anchor 是稳定的
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        // 获取插入位置的锚点
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 说明新节点在老的里面不存在
          // 需要创建
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            console.log("插入节点");
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 命中 index 和最长子序列的值 所以 j--
            j--;
          }
        }
      }
    }
  }
  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }

  function unmountChildren(children) {
    children.forEach((child) => {
      const el = child.el;
      hostRemove(el);
    });
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) return;
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      // 两者不同才做更新
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
    // 判断老的 props 中 key 被删除情况
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  }

  function mountElement(vnode, container, parentComponent, anchor) {
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
        hostPatchProp(el, key, null, val);
      }
    }
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((child) =>
      patch(null, child, container, parentComponent, anchor)
    );
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(
    initialVnode: any,
    container,
    parentComponent,
    anchor
  ) {
    // 获取组件的实例
    const instance = createComponentInstance(initialVnode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, anchor);
  }

  function setupRenderEffect(instance, initialVnode, container, anchor) {
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
        patch(null, subTree, container, instance, anchor);
        // 将虚拟节点树 mountElement 时创建的 dom 树挂载到 vnode.el 属性
        // 从而可以通过 this.$el 可以获取组件的 root dom 节点
        initialVnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log("updated");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevTree = instance.subTree;
        patch(prevTree, subTree, container, instance, anchor);
        instance.subTree = subTree;
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}

// arr: 位置数组；
// 返回位置数组的递增子系列
function getSequence(arr) {
  // 拷贝一个数组 p，p[i]记录的是result在arr[i]更新前记录的上一个值,保存当前项对应的前一项的索引
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    // 遍历位置数组
    // 排除等于 0 的情况
    if (arrI !== 0) {
      j = result[result.length - 1];
      // (1) arrI 比 arr[j]大（当前值大于上次最长子系列的末尾值），直接添加
      if (arr[j] < arrI) {
        // 最后一项与 p 对应的索引进行对应, 保存上一次最长递增子系列的最后一个值的索引
        p[i] = j;
        // result 存储的是长度为 i 的递增子序列最小末尾值的索引集合
        result.push(i);
        continue;
      }

      // (2) arrI <= arr[j] 通过二分查找，找到后替换它；u和v相等时循环停止
      // 定义二分查找区间[u, v]
      u = 0;
      v = result.length - 1;
      // 开启二分查找
      while (u < v) {
        // 取整得到当前位置
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }

      // 比较 => 替换, 当前子系列从头找到第一个大于当前值arrI，并替换
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          // 与p[i] = j作用一致
          // 有可能替换会导致结果不正确，需要一个新数组 p 记录正确的结果
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }

  // 下面主要的修正由于贪心算法可能造成的最长递增子系列在原系列中不是正确的顺序
  u = result.length;
  v = result[u - 1];
  // 倒叙回溯 用 p 覆盖 result 进而找到最终正确的索引
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
