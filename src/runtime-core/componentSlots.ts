export function initSlots(instance, children) {
  // const slots = {};
  // for (let key in children) {
  //   const val = children[key];
  //   slots[key] = Array.isArray(val) ? val : [val];
  // }
  // return slots;
  normalizeObjectSlots(children, instance.slots);
}

function normalizeObjectSlots(children, slots) {
  for (let key in children) {
    const value = children[key];
    slots[key] = normalizeSlotValue(value);
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
