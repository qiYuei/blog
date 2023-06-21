## Diff 的目的

`diff` 的目的只有一个 **尽可能的复用,减少 dom 操作**

## Vue2 版本 diff 算法

### 基本流程

进入 `diff算法` 首先就是比较 新、旧 两个节点是不是相同节点(是否可以复用)比较的依据来自于这个方法 `sameVonode`

```js
function sameVnode(a, b) {
  return (
    a.key === b.key && // key 是否相同
    a.tag === b.tag && // 标签是否相同
    a.isComment === b.isComment && // 是否为注释节点
    isDef(a.data) === isDef(b.data) && // 数据是否都为undefined
    sameInputType(a, b) // input标签类型是否相同 比如 type="text" 和 type="password"
  );
}
```

如果是相同节点，那就进入到核心 `patchVnode` 而如果不是相同节点那就直接将**旧节点删除创建新节点**。

这也是 `Vue` 的一种优化策略。本身 `diff` 一整棵树时间复杂度大概是 `O(n^3)` ,这是一个非常吓人的复杂度分分钟就让你的页面卡死。

对于我们来说很有有操作是跨层级移动的。所以 `vue diff` 只会**同层比对**这样子复杂度就从 `O(n^3)` 降到了 `O(n)`。

### patchVnode

前面提到进入 `patchVnode` 的那就说明了这个节点能够被复用，而这个节点的孩子能不能被复用则是这个函数要做的事情。

在这里 `Vue` 也做了两种优化，分别拿出 `新节点的Children` 和 `旧节点的Children` 。

1. 如果新节点有孩子，旧节点没有。那就直接创建新节点的孩子
2. 如果旧节点有而新节点没有，那就将旧节点的孩子一一卸载
3. 如果双方都有孩子，那就进入 updateChildren 阶段

```js
function patchVnode(oldVnode, vnode) {
  // 复用旧节点的dom
  const elm = (vnode.elm = oldVnode.elm);
  const oldCh = oldVnode.children;
  const ch = vnode.children;

  if (isDef(oldCh) && isDef(ch)) {
    if (oldCh !== ch)
      // 命中第三点
      updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
  } else if (isDef(ch)) {
    if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, "");
    // 命中第一点
    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
  } else if (isDef(oldCh)) {
    // 命中第二点
    removeVnodes(oldCh, 0, oldCh.length - 1);
  }
}
```

### updateChildren

在这个阶段明确的是新节点有孩子，旧节点也有孩子。怎么比对这个孩子让其能够复用，甚至需要比对孩子的孩子的孩子都需要比较。也就是说这里会有递归的情况。

这里利用**双指针**假设了几种优化的的情况

- 头跟头比
- 尾跟尾比
- 头跟尾比
- 尾跟头比

以上任意一种符合 `sameVnode` 的条件直接进入 这个节点的 `patchVnode` 阶段一直递归下去。

如果这四种都不符合，那只能暴力一个个比较。

上代码注解分析

```ts
function updateChildren(
  parentElm,
  oldCh,
  newCh,
  insertedVnodeQueue,
  removeOnly
) {
  let oldStartIdx = 0; // 旧节点的头指针
  let newStartIdx = 0; // 新节点的头指针
  let oldEndIdx = oldCh.length - 1; // 旧节点尾指针
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1; // 新节点尾指针
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      //  旧节点是头节点是undefined的话说明 这个节点已经被移动到左边了
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      //  旧节点是尾节点是undefined的话说明 这个节点已经被也是被移动到左边了
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 旧节点的头跟新节点的头比较
      patchVnode(
        oldStartVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      );
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 旧节点的尾跟新节点的尾比较
      patchVnode(
        oldEndVnode,
        newEndVnode,
        insertedVnodeQueue,
        newCh,
        newEndIdx
      );
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      // 旧节点的头和新节点的尾比较
      patchVnode(
        oldStartVnode,
        newEndVnode,
        insertedVnodeQueue,
        newCh,
        newEndIdx
      );
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          oldStartVnode.elm,
          nodeOps.nextSibling(oldEndVnode.elm)
        );
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      // 旧节点的尾和新节点的头比较
      patchVnode(
        oldEndVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      );
      canMove &&
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 开始遍历寻找复用节点 拿key去寻找
      // 不设key，newCh和oldCh只会进行头尾两端的相互比较，设key后，
      // 除了头尾两端的比较外，还会从用key生成的对象oldKeyToIdx中查找匹配的节点，
      // 所以为节点设置key可以更高效的利用dom。
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      if (isUndef(idxInOld)) {
        // New element
        // 没有key 或者是没有可复用的key
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        );
      } else {
        // 找到相同key的节点，那也进入patchVnode阶段去patch他的孩子
        vnodeToMove = oldCh[idxInOld];
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(
            vnodeToMove,
            newStartVnode,
            insertedVnodeQueue,
            newCh,
            newStartIdx
          );
          oldCh[idxInOld] = undefined;
          canMove &&
            nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // same key but different element. treat as new element
          // 同样的key 但是不是同一个节点的 也需要重新创建
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          );
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx > oldEndIdx) {
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue
    );
  } else if (newStartIdx > newEndIdx) {
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
}
```

### 总结

总结下来就是 `Vue2` 版本的 `diff算法` 会通过 `sameVnode` 这个方法来判断是否可以复用的节点，如果不可以复用那就直接创建这些节点，不进行 `patch` 。如果是可以复用的节点那就开始 `patchVnode` 来粗略比较是否有孩子，并对这些情况做了优化。如果 新旧 节点都拥有孩子那就进入 `updateChildren` 阶段，这时候也会用几种优化策略进行优化，最后在使用暴力递归对比。

## Vue3 版本 diff 算法

`Vue3` 版本的 `diff` 思路大致都差不多，算法的改进加上借助 **编译方面(vue-compile/vue-loader)** 的优化更加多来提升速度。如果在没有编译器的优化下也是需要 **递归** 去 `patch`

先来说下编译器的优化有哪些

### 编译优化

1. 增加 `patchFlag` 和 `dynamicChildren` 来精确告诉 `diff` 哪些是静态节点,哪些是动态节点且什么东西是动态的,只需要 `diff` 动态的即可
2. 静态节点提升,连续静态节点超过 20 个会变成一个字符串,直接插入
3. 事件函数缓存

### 算法提升

在 `updateChildren` 阶段依旧会使用优化策略去匹配 **可复用的头部和尾部节点** 。如果有 `dynamicChildren` 那只需要去 `patch` 动态节点。最终得到会得到一个 `复用头部` + `未知序列` + `复用尾部` 的一个数组。这时候只需要特殊关注
那个 `未知序列(可能有能复用的节点)` 。

在之前对于这个 **未知序列** `Vue2` 是用一个个去对比，而 `Vue3` 是用 `最长递增子序列` 的算法得到一个可复用的**下标** 下面具体分析下

#### sync from start

计算出 `i` 能够位移多少步, `i` 是多少就意味着 `新旧节点从头开始能够复用多少个` !

```js
let i = 0;
const l2 = c2.length;
let e1 = c1.length - 1; // prev ending index 旧节点个数
let e2 = l2 - 1; // next ending index        新节点个数
// 1. sync from start
// (a b) c
// (a b) d e
while (i <= e1 && i <= e2) {
  const n1 = c1[i];
  const n2 = (c2[i] = optimized
    ? cloneIfMounted(c2[i])
    : normalizeVNode(c2[i]));
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized
    );
  } else {
    break;
  }
  i++;
}
```

#### sync from end

下面代码就是 新旧节点从末端开始往左移看能够有多少个节点能够复用

```js
// 2. sync from end
// a (b c)
// d e (b c)
while (i <= e1 && i <= e2) {
  const n1 = c1[e1];
  const n2 = (c2[e2] = optimized
    ? cloneIfMounted(c2[e2])
    : normalizeVNode(c2[e2]));
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized
    );
  } else {
    break;
  }
  e1--;
  e2--;
}
```

#### common sequence + mount

这样的情况意味着 **旧节点的个数比新节点的个数少,且有能够复用的 Vnode**

```js
// 3. common sequence + mount
// (a b)
// (a b) c
// i = 2, e1 = 1, e2 = 2
// (a b)
// c (a b)
// i = 0, e1 = -1, e2 = 0
if (i > e1) {
  if (i <= e2) {
    const nextPos = e2 + 1;
    const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
    while (i <= e2) {
      patch(
        null,
        (c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i])),
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      );
      i++;
    }
  }
}
```

#### common sequence + unmount

新节点比旧节点少且头部跟尾部至少有一个地方能够复用

```js
  // 4. common sequence + unmount
        // (a b) c
        // (a b)
        // i = 2, e1 = 2, e2 = 1
        // a (b c)
        // (b c)
        // i = 0, e1 = 0, e2 = -1
        else if (i > e2) {
            while (i <= e1) {
                unmount(c1[i], parentComponent, parentSuspense, true);
                i++;
            }
        }
```

#### unknown sequence

这里就是未知的序列，在这里 `Vue3` 用 **旧节点跟新节点比** 而 `Vue2` 是用 **新节点跟旧节点比** 。 在 `Vue2` 中经历过 `头跟头、尾跟尾、头跟尾、尾跟头` 这几个优化后剩下节点将是暴力比较

如果有这样一个序列

```js
// a b c d
// e b c d a m n
```

`Vue2` 的算法流程如下

1. 指针在 `a e` 中,发现优化不了 `e` 插入 `a` 的前面,此时旧节点里有 `e a b c d` ,头指针在 `a` 和 `b` ,尾指针在 `d` `m`
2. 发现还是优化不了,就会根据旧节点重新建立一个 **key Map** 。如果有那就再移动,旧节点变成 `e b a c d` ,指针变成 `a 和 c`,尾指针在 `d m`
3. 没得优化但是旧节点有 将 `c` 移动至 `a` 前面,旧节点变成 `e b c a d`,指针变成 `a` 和 `d 尾指针` `d m`
4. 尾跟头能够复用 ,将 `d` 节点移动至 `a` 前面，尾指针向前移。此时 旧节点 `e b c d a`,头指针 `a` 和 `a` 尾指针 `a m`
5. 头跟头复用,进行 patchVnode 不移动,双方指针都往下移动，此时 旧节点的头指针比旧节点的尾指针大,而新节点的头指针指向 `m` ,尾指针也指向 `m` 。结束对比
6. 发现旧节点的头指针比旧节点的尾指针大,需要新增 新节点的头指针指向的新增节点(m)到新节点的尾指针指向的节点(n)。结束 diff 算法

```js
addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
```

至此我们可以发现 `Vue2` 在这次比较的过程中一共 **新增了两个节点（e,m,n）** , **移动了三个节点(b c d)**

而对于 `Vue3` 而言只需要这样

1. 优化无效果,进入 5 unknown sequence
2. 利用 `最长递增子序列` 的算法,计算出 `b c d` 位置可以不用动
3. 在旧的基础上 插入节点 `e`
4. 再将 `a` 节点移动至 `d` 后面
5. 插入 `m n` 节点

```js
        // 5. unknown sequence
        // [i ... e1 + 1]: a b [c d e] f g
        // [i ... e2 + 1]: a b [e d c h] f g
        // i = 2, e1 = 4, e2 = 5
        else {
            const s1 = i; // prev starting index
            const s2 = i; // next starting index
            // 5.1 build key:index map for newChildren
            const keyToNewIndexMap = new Map();
            for (i = s2; i <= e2; i++) {
                const nextChild = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                if (nextChild.key != null) {

                    keyToNewIndexMap.set(nextChild.key, i);
                }
            }
            // 5.2 loop through old children left to be patched and try to patch
            // matching nodes & remove nodes that are no longer present
            let j;
            let patched = 0;
            const toBePatched = e2 - s2 + 1;
            let moved = false;
            // used to track whether any node has moved
            let maxNewIndexSoFar = 0;
            // works as Map<newIndex, oldIndex>
            // Note that oldIndex is offset by +1
            // and oldIndex = 0 is a special value indicating the new node has
            // no corresponding old node.
            // used for determining longest stable subsequence
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    // all new children have been patched so this can only be a removal
                    unmount(prevChild, parentComponent, parentSuspense, true);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // key-less node, try to locate a key-less node of the same type
                    for (j = s2; j <= e2; j++) {
                        if (newIndexToOldIndexMap[j - s2] === 0 &&
                            isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    unmount(prevChild, parentComponent, parentSuspense, true);
                }
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    patched++;
                }
            }
            // 5.3 move and mount
            // generate longest stable subsequence only when nodes have moved
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : EMPTY_ARR;
            j = increasingNewIndexSequence.length - 1;
            // looping backwards so that we can use last patched node as anchor
            for (i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                if (newIndexToOldIndexMap[i] === 0) {
                    // mount new
                    patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else if (moved) {
                    // move if:
                    // There is no stable subsequence (e.g. a reverse)
                    // OR current node is not among the stable sequence
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        move(nextChild, container, anchor, 2 /* REORDER */);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
```
