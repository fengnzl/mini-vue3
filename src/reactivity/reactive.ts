import { isObject } from "../shared/utils";
import {
  readonlyHandler,
  mutableHandler,
  shallowReadonlyHandler,
} from "./baseHandler";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}
export function reactive(raw) {
  return createActiveObject(raw, mutableHandler);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandler);
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandler);
}

export function isReactive(target) {
  return !!target[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(target) {
  return !!target[ReactiveFlags.IS_READONLY];
}

export function isProxy(target) {
  return isReactive(target) || isReadonly(target);
}

function createActiveObject(raw, baseHandlers) {
  if (!isObject(raw)) {
    console.warn(`target ${raw} is not an object`);
    return raw;
  }
  return new Proxy(raw, baseHandlers);
}
