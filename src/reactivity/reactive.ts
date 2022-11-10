import { readonlyHandler, mutableHandler } from "./baseHandler";
export function reactive(raw) {
  return createActiveObject(raw, mutableHandler);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandler);
}

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}