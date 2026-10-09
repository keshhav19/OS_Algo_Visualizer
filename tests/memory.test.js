import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runBestFit } from "../src/algorithms/memory/bestFit.js";
import { runFirstFit } from "../src/algorithms/memory/firstFit.js";
import { runAllMemoryAlgorithms } from "../src/algorithms/memory/index.js";
import { runWorstFit } from "../src/algorithms/memory/worstFit.js";
import { parsePositiveIntegerList } from "../src/utils/validation.js";

describe("memory allocation algorithms", () => {
  it("allocates all requests when enough memory exists", () => {
    const result = runFirstFit([100, 500, 200], [50, 100, 150]);

    assert.deepEqual(allocationMap(result), ["R1:B1:50", "R2:B2:400", "R3:B2:250"]);
    assert.deepEqual(result.summary, {
      totalMemory: 800,
      totalRequestedMemory: 300,
      totalAllocatedMemory: 300,
      allocatedRequests: 3,
      unallocatedRequests: 0,
      remainingMemory: 500
    });
  });

  it("continues after some requests cannot be allocated", () => {
    const result = runFirstFit([100, 200], [150, 180, 80]);

    assert.deepEqual(allocationMap(result), ["R1:B2:50", "R2:-:-", "R3:B1:20"]);
    assert.equal(result.summary.allocatedRequests, 2);
    assert.equal(result.summary.unallocatedRequests, 1);
    assert.equal(result.summary.totalAllocatedMemory, 230);
  });

  it("marks a request larger than every block as unallocated", () => {
    const result = runBestFit([100, 200, 250], [300]);

    assert.deepEqual(allocationMap(result), ["R1:-:-"]);
    assert.equal(result.summary.totalAllocatedMemory, 0);
    assert.equal(result.summary.remainingMemory, 550);
  });

  it("chooses the smallest sufficient block for Best Fit", () => {
    const result = runBestFit([300, 100, 200], [90]);

    assert.deepEqual(allocationMap(result), ["R1:B2:10"]);
  });

  it("chooses the largest sufficient block for Worst Fit", () => {
    const result = runWorstFit([300, 100, 200], [90]);

    assert.deepEqual(allocationMap(result), ["R1:B1:210"]);
  });

  it("produces different allocations for the classic comparison input", () => {
    const [firstFit, bestFit, worstFit] = runAllMemoryAlgorithms(
      [100, 500, 200, 300, 600],
      [212, 417, 112, 426]
    );

    assert.deepEqual(firstFit.allocations.map((allocation) => allocation.allocatedBlockId), ["B2", "B5", "B2", "-"]);
    assert.deepEqual(bestFit.allocations.map((allocation) => allocation.allocatedBlockId), ["B4", "B2", "B3", "B5"]);
    assert.deepEqual(worstFit.allocations.map((allocation) => allocation.allocatedBlockId), ["B5", "B2", "B5", "-"]);

    assert.equal(firstFit.summary.totalAllocatedMemory, 741);
    assert.equal(bestFit.summary.totalAllocatedMemory, 1167);
    assert.equal(worstFit.summary.totalAllocatedMemory, 741);
  });

  it("validates empty and invalid comma-separated input", () => {
    assert.deepEqual(parsePositiveIntegerList("", "Memory Blocks"), {
      values: [],
      errors: ["Memory Blocks input cannot be empty."]
    });

    assert.deepEqual(parsePositiveIntegerList("100, -5, abc, 0", "Memory Requests"), {
      values: [],
      errors: [
      "Memory Requests item 2 must be a positive integer no greater than 1000000.",
      "Memory Requests item 3 must be a positive integer no greater than 1000000.",
      "Memory Requests item 4 must be a positive integer no greater than 1000000."
      ]
    });
  });
});

function allocationMap(result) {
  return result.allocations.map((allocation) => (
    `${allocation.requestId}:${allocation.allocatedBlockId}:${allocation.remainingBlockSize}`
  ));
}
