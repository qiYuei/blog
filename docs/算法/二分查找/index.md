### 前言

二分查找也称折半查找（Binary Search），它是一种效率较高的查找方法。但是，折半查找要求线性表必须采用顺序存储结构，而且表中元素按关键字有序排列。重点是`有序`

### 边界情况

```javascript
let binarySearch = (arr, target) => {
    let begin = 0; // 开始位置
    let end = ???; // 结束位置
    while(???) {
        let mid = begin + (end -begin) / 2;
        if(arr[mid] == target) {} // 刚好命中
        else if(arr[mid] > target) {}  // 目标值在 mid 下标左边
        else if(arr[mid] < target) {}  // 目标值在 mid 下标右边
    }
    return ???; // 没找到的情况
}
```

事实上 二分法的结构就是这么简单,主要是`边界情况的处理`

```javascript
let binarySearch = (arr, target) => {
  let start = 0;
  let end = arr.length; // 这里是最后 数组的长度相当于 0 - 最后
  while (start < end) {
    // 这里就必须 start < 数组长度 也不能等于
    let mid = Math.floor((start + end) / 2);
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] > target) {
      end = mid - 1;
    } else if (arr[mid] < target) {
      start = mid + 1;
    }
  }
  return -1;
};
```

### 实践

> 给定一个按照升序排列的整数数组 nums ，和一个目标值 target 。找出给定目标值在数组中的开始位置和结束位置。<br />你的算法时间复杂度必须是 O(logn) 级别。<br />如果数组中不存在目标值，返回 [-1, -1] 。<br />示例 1:<br />输入: nums = [5,7,7,8,8,10], target = 8<br />输出: [3,4]<br />示例 2:<br />输入: nums = [5,7,7,8,8,10], target = 6<br />输出: [-1,-1]

#### 思路

先用二分查找找出一个位置,但是这个位置可能有左边重复跟右边重复的情况,所以需要再次用循环查找这种情况

```javascript
function find(nums, target) {
  let left = 0,
    right = nums.length - 1,
    mid;
  while (left <= right) {
    mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) break;
    if (nums[mid] > target) right = mid - 1;
    else left = mid + 1;
  }
  if (left > right) return [-1, -1];
  let i = mid,
    j = mid;
  while (nums[i] === nums[i - 1]) i--; // 搜索左边
  while (nums[j] === nums[j + 1]) j++; // 搜索右边
  return [i, j];
}
```
