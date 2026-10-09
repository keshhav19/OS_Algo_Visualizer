import { buildDiskResult, createStep } from "./helpers.js";

/**
 * SCAN (Elevator) disk scheduling.
 * Head moves in the selected direction, servicing requests.
 * When it reaches the physical disk boundary, it reverses direction.
 * The boundary (0 or diskSize-1) IS visited even if no request is there.
 */
export function runDiskScan(head, requests, diskSize, direction) {
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
    // Reverse — service requests to the left (descending)
    if (left.length > 0) {
      for (let i = left.length - 1; i >= 0; i--) {
        visit(left[i], "Request");
      }
    }
  } else {
    // direction === "left"
    // Service requests to the left (descending from head)
    for (let i = left.length - 1; i >= 0; i--) {
      visit(left[i], "Request");
    }
    // Go to left boundary
    if (current !== 0) {
      visit(0, "Boundary");
    }
    // Reverse — service requests to the right
    for (const r of right) {
      visit(r, "Request");
    }
  }

  return buildDiskResult(sequence, steps);
}
