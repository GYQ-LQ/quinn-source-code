/*
 * @Author: Quinn
 * @Date: 2021-05-07 08:58:33
 * @LastEditTime: 2021-05-07 09:05:11
 * @LastEditors: quinn
 * @Description:
 */
function quick(list, left = 0, right = list.length - 1) {
    if (left < right) {
        let parInd = getParIndex(list, left, right);
        quick(list, left, parInd - 1);
        quick(list, parInd + 1, right);
    }
    return list;
}
function getParIndex(list, left, right) {
    let pivot = list[left],
        i = left;
    while (left < right) {
        while (left < right && list[right] > pivot) right--;
        while (left < right && list[left] <= pivot) left++;
        if (left < right) {
            swap(list, left, right);
        }
    }
    swap(list, i, right);
    return right;
}
function swap(list, i, j) {
    let t = list[i];
    list[i] = list[j];
    list[j] = t;
}
let arr = [3, 4, 2, 1, 5, 7, 9, 0];
console.log(quick(arr));
