import { buildDiskResult, createStep } from "./helpers.js";

/**
 * C-SCAN (Circular SCAN) disk scheduling.
 * Head moves in only one direction. After reaching the physical boundary,
 * it jumps to the opposite physical boundary and continues in the same direction.
 * The jump distance counts toward total head movement.
 */
export function runDiskCscan(head, requests, diskSize, direction) {
  const sorted = [...requests].sort((a, b) => a - b);
  const left = sorted.filter(r => r < head);
  const right = sorted.filter(r => r >= head);

  const sequence = [head];
  const steps = [];
  let current = head;
  let stepNum = 0;

  function visit(next, event) {
    stepNum++;
    steps.push(createStep(stepNum, current, next, event));
    sequence.push(next);
    current = next;
  }

  if (direction === "right") {
    // Service requests to the right
    for (const r of right) {
      visit(r, "Request");
    }
    // Go to right boundary
    if (current !== diskSize - 1) {
      visit(diskSize - 1, "Boundary");
    }
    // Jump to left boundary
    visit(0, "Circular Jump");
    // Service remaining requests to the left (ascending)
    for (const r of left) {
      visit(r, "Request");
    }
  } else {
    // direction === "left"
    // Service requests to the left (descending)
    for (let i = left.length - 1; i >= 0; i--) {
      visit(left[i], "Request");
    }
    // Go to left boundary
    if (current !== 0) {
      visit(0, "Boundary");
    }
    // Jump to right boundary
    visit(diskSize - 1, "Circular Jump");
    // Service remaining requests to the right (descending)
    for (let i = right.length - 1; i >= 0; i--) {
      visit(right[i], "Request");
    }
  }

  return buildDiskResult(sequence, steps);
}
