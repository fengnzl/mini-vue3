import { h, ref } from "../../lib/guide-mini-vue.esm.js";

// 左侧对比 (ab)c  -> (ab)de
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
// ];

// 右侧对比 a(bc) de(bc)
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 1、新的比老的长  (ab)  (ab)c e1 = 1 e2 = 2 i = 2
// const prevChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// 2、新的比老的长右侧 (ab)  dc(ab) e1 = -1 e2 = 1 i = 0
// const prevChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextChildren = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 3、老的比新的长左侧 (ab)cd -> (ab) 删除
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
// ];
// const nextChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// 4、右侧 ab(cd) -> (cd)
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
// ];
// const nextChildren = [h("div", { key: "C" }, "C"), h("div", { key: "D" }, "D")];

// 中间对比 (ab)cye(fg) -> (ab)edc(fg)
// 创建新的(d) 老的不存在，新的存在
// 删除旧的(y) 新的不存在 老的存在
// 移动 c, e 节点存在于新和老的里面，但是为位置变了

// 5.1
// ab(cd)fg -> ab(ec)fg
// d 节点在新的里面没有 - 需要删除
// c 节点 props 发生变化
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "c-prev" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C", id: "c-next" }, "C"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 5.1.1 ab(ced)fg -> ab(ec)fg
// 中间部分 老的比新的多  那么多出来的可以直接删除（优化删除逻辑）
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "c-prev" }, "C"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C", id: "c-next" }, "C"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 移动（节点在新和老的里面，但是位置变了）
// ab(cde)fg
// ab(ecd)fg
// 最长子序列 [1,2]
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "c-prev" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C", id: "c-next" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 创建新的节点
// ab(ce)fg
// ab(ecd)fg
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "c-prev" }, "C"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C", id: "c-next" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 综合例子
// ab(cdez)fg
// ab(dcye)fg
const prevChildren = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "C", id: "c-prev" }, "C"),
  h("div", { key: "D" }, "D"),
  h("div", { key: "E" }, "E"),
  h("div", { key: "Z" }, "Z"),
  h("div", { key: "G" }, "G"),
];
const nextChildren = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "D" }, "D"),
  h("div", { key: "C", id: "c-next" }, "C"),
  h("div", { key: "Y" }, "Y"),
  h("div", { key: "E" }, "E"),
  h("div", { key: "G" }, "G"),
];

export const ArrayToArray = {
  name: "ArrayToArray",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
  render() {
    return this.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
