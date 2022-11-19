import { camelize, toHandlerKey } from "../shared/utils";

export function emit(instance, event, ...args) {
  const { props } = instance;

  // TPP
  // 先写一个特性的行为 =》 重构成通用行为
  // add -> Add
  // add-foo -> addFoo
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
