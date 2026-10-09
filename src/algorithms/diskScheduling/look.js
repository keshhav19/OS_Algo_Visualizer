import { buildDiskResult, createStep } from "./helpers.js";

/**
 * LOOK disk scheduling.
 * Like SCAN, but the head does NOT travel to the physical boundary.
 * It only goes as far as the last pending request in the current direction,
 * then reverses.
 */
export function runDiskLook(head, requests, _diskSize, direction) {
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
    for (const r of right) {
      visit(r, "Request");
    }
    // Direction change — no boundary visit
    for (let i = left.length - 1; i >= 0; i--) {
      visit(left[i], "Request");
    }
  } else {
    for (let i = left.length - 1; i >= 0; i--) {
      visit(left[i], "Request");
    }
    // Direction change — no boundary visit
    for (const r of right) {
      visit(r, "Request");
    }
  }

  return buildDiskResult(sequence, steps);
}
