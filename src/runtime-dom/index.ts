import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, oldVal, newVal) {
  // 以 on 开头的当作是事件处理 如 onClick 事件
  const isOn = (key) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 获取事件名称
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, newVal);
  } else {
    // newVal 为 null 或者 undefined 删除 key
    if (newVal === null || newVal === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newVal);
    }
  }
}

function insert(child, parent, anchor) {
  // parent.append(child);
  parent.insertBefore(child, anchor || null);
}

function remove(el) {
  const parent = el.parentNode;
  if (parent) {
    parent.removeChild(el);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core/index";
