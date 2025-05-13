const minimumPage = 0;

/**
* @typedef Range
* @property {number} start
* @property {number} end
*/

/**
 * Returns the range of pages to display in the pager.
 * @param {number} page 
 * @param {number} desiredNumberOfPages 
 * @param {number} maxPage 
 * @returns number[]
 * @description Returns the range of pages to display in the pager.
 */
export function getCurrentPagesRange(
  page,
  desiredNumberOfPages,
  maxPage
) {
  let range = buildRange(page, desiredNumberOfPages);
  range = shiftRightIfNeeded(range);
  range = shiftLeftIfNeeded(range, maxPage);
  return buildCurrentPages(range);
}

/**
 * Builds the range of pages to display in the pager.
 * @param {number} page 
 * @param {number} desiredNumberOfPages 
 * @returns {Range}
 */
function buildRange(page, desiredNumberOfPages){
  const isEven = desiredNumberOfPages % 2 === 0;
  const leftCapacity = Math.floor(desiredNumberOfPages / 2);
  const rightCapacity = isEven ? leftCapacity - 1 : leftCapacity;

  const start = page - leftCapacity;
  const end = page + rightCapacity;

  return {start, end};
}

/**
 * Shifts the range to the right if it exceeds the minimum page.
 * @param {Range} range 
 * @returns {Range}
 */
function shiftRightIfNeeded(range) {
  const leftExcess = Math.max(minimumPage - range.start, 0);
  const start = range.start + leftExcess;
  const end = range.end + leftExcess;

  return {start, end};
}

/**
 * Shifts the range to the left if it exceeds the maximum page.
 * @param {Range} range 
 * @param {number} maxPage 
 * @returns {Range}
 */
function shiftLeftIfNeeded(range, maxPage) {
  const rightExcess = Math.max(range.end - maxPage, 0);
  const start = Math.max(range.start - rightExcess, minimumPage);
  const end = range.end - rightExcess;

  return {start, end};
}

/**
 * builds the current pages array based on the range.
 * @param {Range} range 
 * @returns number[]
 */
function buildCurrentPages(range) {
  const currentPages = [];

  for (let counter = range.start; counter <= range.end; ++counter) {
    currentPages.push(counter);
  }

  return currentPages;
}