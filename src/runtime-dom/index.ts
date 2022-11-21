import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, val) {
  // 以 on 开头的当作是事件处理 如 onClick 事件
  const isOn = (key) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 获取事件名称
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
  }
}

function insert(el, parent) {
  parent.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core/index";
