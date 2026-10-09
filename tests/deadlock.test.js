import { describe, it } from "node:test";
import assert from "node:assert";
import { runBankersSafetyAlgorithm, calculateNeed } from "../src/algorithms/deadlock/bankers.js";
import { simulateResourceRequest } from "../src/algorithms/deadlock/resourceRequest.js";
import { runDeadlockDetection } from "../src/algorithms/deadlock/detection.js";
import { validateBankersInput, validateDetectionInput, validateResourceRequestInput } from "../src/utils/validation.js";

describe("Deadlock Management - Banker's Algorithm", () => {
  it("handles an empty matrix without crashing while page validation rejects it", () => {
    assert.deepStrictEqual(calculateNeed([], []), []);
    assert.ok(validateBankersInput([], [], []).some(error => error.includes("at least one")));
  });

  it("calculates Need matrix correctly", () => {
    const allocation = [[0, 1, 0], [2, 0, 0]];
    const max = [[7, 5, 3], [3, 2, 2]];
    const need = calculateNeed(allocation, max);
    assert.deepStrictEqual(need, [[7, 4, 3], [1, 2, 2]]);
  });

  it("identifies a safe state and returns a valid sequence", () => {
    const processes = ["P0", "P1", "P2", "P3", "P4"];
    const available = [3, 3, 2];
    const allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ];
    const max = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ];

    const result = runBankersSafetyAlgorithm(processes, available, allocation, max);
    
    assert.strictEqual(result.isSafe, true);
    // Usually P1, P3, P4, P0, P2
    assert.deepStrictEqual(result.safeSequence, ["P1", "P3", "P4", "P0", "P2"]);
    assert.strictEqual(result.steps.length, 5);
    // After P1 runs, work should increase by P1's allocation [2, 0, 0]
    assert.deepStrictEqual(result.steps[0].workAfter, [5, 3, 2]);
  });

  it("identifies an unsafe state", () => {
    const processes = [0, 1, 2];
    const available = [1, 1, 1];
    const allocation = [
      [2, 2, 2],
      [1, 1, 1],
      [1, 1, 1]
    ];
    const max = [
      [10, 10, 10],
      [5, 5, 5],
      [4, 4, 4]
    ];

    const result = runBankersSafetyAlgorithm(processes, available, allocation, max);
    assert.strictEqual(result.isSafe, false);
    assert.strictEqual(result.safeSequence.length, 0);
  });
});

describe("Deadlock Management - Resource Request", () => {
  const processes = [0, 1, 2, 3, 4];
  const available = [3, 3, 2];
  const allocation = [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ];
  const max = [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ];

  it("grants request that results in a safe state", () => {
    // P1 requests 1, 0, 2
    const result = simulateResourceRequest(1, [1, 0, 2], processes, available, allocation, max);
    assert.strictEqual(result.granted, true);
    assert.strictEqual(result.safetyResult.isSafe, true);
  });

  it("rejects request that results in an unsafe state", () => {
    // P4 requests 3, 3, 0 -> wait, Need is [4,3,1], available is [3,3,2]. 
    // Request is <= Need, <= Available.
    // If granted, Available = [0,0,2]. No process can finish.
    const result = simulateResourceRequest(4, [3, 3, 0], processes, available, allocation, max);
    assert.strictEqual(result.granted, false);
    assert.strictEqual(result.safetyResult.isSafe, false);
    assert.match(result.reason, /unsafe/i);
  });

  it("rejects request exceeding Need", () => {
    // P1 Need is [1,2,2]. Requesting [2,0,0]
    const result = simulateResourceRequest(1, [2, 0, 0], processes, available, allocation, max);
    assert.strictEqual(result.granted, false);
    assert.match(result.reason, /exceeds its declared maximum/i);
  });

  it("rejects request exceeding Available", () => {
    // P0 Need is [7,4,3]. Requesting [0,4,0] which > Available [3,3,2]
    const result = simulateResourceRequest(0, [0, 4, 0], processes, available, allocation, max);
    assert.strictEqual(result.granted, false);
    assert.match(result.reason, /not immediately available/i);
  });
});

describe("Deadlock Management - Detection Algorithm", () => {
  it("detects when no deadlock exists", () => {
    const processes = [0, 1, 2, 3, 4];
    const available = [0, 0, 0];
    const allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 3],
      [2, 1, 1],
      [0, 0, 2]
    ];
    const request = [
      [0, 0, 0],
      [2, 0, 2],
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 2]
    ];

    const result = runDeadlockDetection(processes, available, allocation, request);
    assert.strictEqual(result.hasDeadlock, false);
    assert.strictEqual(result.deadlockedProcesses.length, 0);
    assert.strictEqual(result.completedProcesses.length, 5);
  });

  it("detects a deadlock state", () => {
    const processes = [0, 1, 2, 3, 4];
    const available = [0, 0, 0];
    const allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 3],
      [2, 1, 1],
      [0, 0, 2]
    ];
    const request = [
      [0, 0, 0],
      [2, 0, 2],
      [0, 0, 1], // P2 now requests 1 of resource C. It can't be satisfied.
      [1, 0, 0],
      [0, 0, 2]
    ];

    const result = runDeadlockDetection(processes, available, allocation, request);
    assert.strictEqual(result.hasDeadlock, true);
    // P0 can finish, releasing [0, 1, 0].
    // Then P2 requests [0, 0, 1], fails.
    // P1 requests [2, 0, 2], fails.
    // P3 requests [1, 0, 0], fails.
    // P4 requests [0, 0, 2], fails.
    // Wait, P0 finishes (Work=[0,1,0]).
    // P2 wants [0,0,1], fails.
    assert.deepStrictEqual(result.deadlockedProcesses, [1, 2, 3, 4]);
  });
});

describe("Deadlock Validation", () => {
  it("validates Banker's Input properly", () => {
    const allocation = [[0, 1], [1, 0]];
    const max = [[0, 0], [2, 2]];
    const available = [1, 1];
    
    const errors = validateBankersInput(allocation, max, available);
    assert.strictEqual(errors.length, 1);
    assert.match(errors[0], /cannot exceed Max claim/);
  });
});
