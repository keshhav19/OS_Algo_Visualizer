/**
 * Disk scheduling helper utilities.
 * Shared calculation logic used across all disk scheduling algorithms.
 */

/**
 * Builds a standard result object from a completed movement sequence.
 * @param {number[]} sequence - The ordered positions visited by the disk head (includes initial head).
 * @param {object[]} steps - Step-by-step detail array.
 * @returns {{ sequence, steps, totalMovement, averageMovement }}
 */
export function buildDiskResult(sequence, steps, countCircularJumpAsRequest = false) {
  let totalMovement = 0;
  for (let i = 1; i < sequence.length; i++) {
    totalMovement += Math.abs(sequence[i] - sequence[i - 1]);
  }

  // Number of actual requests serviced (sequence includes head, boundaries, jumps — use steps to count)
  const requestCount = steps.filter(s => s.event === "Request" || s.event === "Request (start)" || (countCircularJumpAsRequest && s.event === "Circular Jump")).length;
  const averageMovement = requestCount > 0 ? Number((totalMovement / requestCount).toFixed(2)) : 0;

  return {
    sequence,
    steps,
    totalMovement,
    averageMovement
  };
}

/**
 * Creates a step object for the step-by-step table.
 */
export function createStep(stepNum, from, to, event) {
  return {
    step: stepNum,
    from,
    to,
    movement: Math.abs(to - from),
    direction: to >= from ? "Right" : "Left",
    event
  };
}
