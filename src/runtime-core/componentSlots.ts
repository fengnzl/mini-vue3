import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  // const slots = {};
  // for (let key in children) {
  //   const val = children[key];
  //   slots[key] = Array.isArray(val) ? val : [val];
  // }
  // return slots;
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (let key in children) {
    // slot 函数
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
