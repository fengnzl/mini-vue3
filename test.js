function getSequence(arr) {
  /*
  回溯时使用  遍历arr的时候 每操作一次result push或者替换值
  都把result被操作索引的前一项放到p  比如 result = [0] 要push i进去result前 p数组肯定会记录当前result的最后一项 也就是0（p[i]=0） 
  回溯时通过最后一项(result[result.length - 1])  就可以通过P这个数组 一直找到他的前一项(p[result[result.length - 1]])
  */
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      // 找result最后一项 也就是目前为止最大的一项  如果比这项大 就直接push
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        //这里可以看出 result记录了i 通过这个i 又可以从p中取出result前一项
        p[i] = j;
        result.push(i);
        continue;
      }
      // 否则在前面的项中二分查找 并且当前项在p中的位置记录result列表的最后一项 也就是说通过push进去的这一项（索引） 在p中对应的索引存就是它的前一项
      u = 0;
      v = result.length - 1;
      // 二分查找
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }

      if (arrI < arr[result[u]]) {
        if (u > 0) {
          //逻辑和上面的 p[i] = j 一样 都是记录前一项
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }

  // 回溯
  /*
    为什么需要回溯？
    [3,4,1] 根据上面的逻辑  1会把3替换掉 导致最长递增子序列索引变为[2,1] 显然不对
    因为result是递增插入的 所以在被二分查找元素替换前  result的结果一定是对的
    每次替换元素的时候 该元素的后一项元素 都在p中记录了它的位置
    所以回溯法可以找回正确的递增序列
    */
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    // 第一次循环 v就是result里面的最后一项 因为最后一项是最大值 肯定是对的
    result[u] = v;
    // 最后一项在p中记录了它的前一项 所以取出前一项放在result
    // ♻️ 每取出一项 都能在p中找到它的前一项
    v = p[v];
  }
  return result;
}
