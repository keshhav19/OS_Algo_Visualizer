import { buildDiskResult, createStep } from "./helpers.js";

/**
 * FCFS — First Come First Serve disk scheduling.
 * Services requests in the exact order they appear.
 */
export function runDiskFcfs(head, requests, _diskSize, _direction) {
  const sequence = [head];
  const steps = [];
  let current = head;

  for (let i = 0; i < requests.length; i++) {
    const next = requests[i];
    steps.push(createStep(i + 1, current, next, current === next ? "Request (start)" : "Request"));
    sequence.push(next);
    current = next;
  }

  return buildDiskResult(sequence, steps);
}
