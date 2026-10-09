import { buildDiskResult, createStep } from "./helpers.js";

/**
 * C-LOOK (Circular LOOK) disk scheduling.
 * Like C-SCAN, but the head does NOT travel to the physical boundary.
 * It only goes as far as the last pending request in the current direction,
 * then jumps to the first pending request at the opposite end and continues
 * in the same direction.
 */
export function runDiskClook(head, requests, _diskSize, direction) {
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
    // Service requests to the right (ascending)
    for (const r of right) {
      visit(r, "Request");
    }
    // Jump to lowest pending request (no boundary visit)
    if (left.length > 0) {
      visit(left[0], "Circular Jump");
      for (let i = 1; i < left.length; i++) {
        visit(left[i], "Request");
      }
    }
  } else {
    // direction === "left"
    // Service requests to the left (descending)
    for (let i = left.length - 1; i >= 0; i--) {
      visit(left[i], "Request");
    }
    // Jump to highest pending request (no boundary visit)
    if (right.length > 0) {
      visit(right[right.length - 1], "Circular Jump");
      for (let i = right.length - 2; i >= 0; i--) {
        visit(right[i], "Request");
      }
    }
  }

  return buildDiskResult(sequence, steps, true);
}
