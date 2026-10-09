import { buildDiskResult, createStep } from "./helpers.js";

/**
 * SSTF — Shortest Seek Time First disk scheduling.
 * At each step, selects the closest pending request.
 * Tie-breaking: when two requests are equidistant, the one with the
 * lower cylinder number is selected first.
 */
export function runDiskSstf(head, requests, _diskSize, _direction) {
  const pending = requests.map((r, i) => ({ cylinder: r, originalIndex: i }));
  const sequence = [head];
  const steps = [];
  let current = head;
  let stepNum = 0;

  while (pending.length > 0) {
    // Find closest
    let minDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < pending.length; i++) {
      const dist = Math.abs(pending[i].cylinder - current);
      if (dist < minDist || (dist === minDist && pending[i].cylinder < pending[bestIdx].cylinder)) {
        minDist = dist;
        bestIdx = i;
      }
    }

    const next = pending[bestIdx].cylinder;
    pending.splice(bestIdx, 1);
    stepNum++;
    steps.push(createStep(stepNum, current, next, current === next ? "Request (start)" : "Request"));
    sequence.push(next);
    current = next;
  }

  return buildDiskResult(sequence, steps);
}
