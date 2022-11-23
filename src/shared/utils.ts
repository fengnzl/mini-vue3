export const extend = Object.assign;

export const EMPTY_OBJ = {};

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};

export const hasOwn = (target, key) => {
  return Object.prototype.hasOwnProperty.call(target, key);
};

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (match, p1: string) =>
    p1 ? p1.toUpperCase() : ""
  );
};
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export const toHandlerKey = (str: string) => {
  return str ? `on${capitalize(str)}` : "";
};
