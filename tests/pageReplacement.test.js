import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runFifo } from "../src/algorithms/pageReplacement/fifo.js";
import { runLru } from "../src/algorithms/pageReplacement/lru.js";
import { runOptimal } from "../src/algorithms/pageReplacement/optimal.js";
import { runAllPageReplacementAlgorithms } from "../src/algorithms/pageReplacement/index.js";
import {
  parseNonNegativeIntegerSequence,
  validatePositiveIntegerValue
} from "../src/utils/validation.js";

describe("page replacement algorithms", () => {
  it("matches the textbook FIFO, LRU, and Optimal fault counts", () => {
    const references = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
    assert.equal(runFifo(references, 3).statistics.pageFaults, 15);
    assert.equal(runLru(references, 3).statistics.pageFaults, 12);
    assert.equal(runOptimal(references, 3).statistics.pageFaults, 9);
  });

  it("handles pages that all fit into the available frames", () => {
    const result = runFifo([1, 2, 3, 1, 2], 4);

    assert.deepEqual(stepKeys(result), [
      "1:1:1---:Fault:-",
      "2:2:12--:Fault:-",
      "3:3:123-:Fault:-",
      "4:1:123-:Hit:-",
      "5:2:123-:Hit:-"
    ]);
    assert.deepEqual(result.statistics, {
      totalReferences: 5,
      pageHits: 2,
      pageFaults: 3,
      hitRatio: 0.4,
      faultRatio: 0.6
    });
  });

  it("counts repeated pages as hits after the first load", () => {
    const result = runLru([1, 1, 1, 1], 2);

    assert.equal(result.statistics.pageFaults, 1);
    assert.equal(result.statistics.pageHits, 3);
    assert.deepEqual(result.steps.map((step) => step.result), ["Fault", "Hit", "Hit", "Hit"]);
  });

  it("uses FIFO order independently of page values", () => {
    const result = runFifo([5, 1, 9, 2], 2);

    assert.deepEqual(result.steps.map((step) => step.replacedPage), [null, null, 5, 1]);
    assert.deepEqual(result.steps.at(-1).frames, [9, 2]);
    assert.equal(result.statistics.pageFaults, 4);
  });

  it("replaces the least recently used page for LRU", () => {
    const result = runLru([1, 2, 1, 3, 1, 2], 2);

    assert.deepEqual(result.steps.map((step) => step.replacedPage), [null, null, null, 2, null, 3]);
    assert.deepEqual(result.steps.at(-1).frames, [1, 2]);
    assert.deepEqual(result.statistics, {
      totalReferences: 6,
      pageHits: 2,
      pageFaults: 4,
      hitRatio: 0.33,
      faultRatio: 0.67
    });
  });

  it("replaces a page that will never be referenced again for Optimal", () => {
    const result = runOptimal([1, 2, 3, 4, 2, 3], 3);

    assert.equal(result.steps[3].replacedPage, 1);
    assert.deepEqual(result.steps[3].frames, [4, 2, 3]);
    assert.equal(result.statistics.pageFaults, 4);
    assert.equal(result.statistics.pageHits, 2);
  });

  it("changes fault count when the number of frames changes", () => {
    const twoFrames = runLru([1, 2, 1, 3, 1, 2], 2);
    const threeFrames = runLru([1, 2, 1, 3, 1, 2], 3);

    assert.equal(twoFrames.statistics.pageFaults, 4);
    assert.equal(threeFrames.statistics.pageFaults, 3);
  });

  it("produces different comparison results for FIFO, LRU, and Optimal", () => {
    const [fifo, lru, optimal] = runAllPageReplacementAlgorithms(
      [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3],
      3
    );

    assert.deepEqual(
      [fifo.statistics.pageFaults, lru.statistics.pageFaults, optimal.statistics.pageFaults],
      [10, 9, 7]
    );
    assert.deepEqual(
      [fifo.statistics.pageHits, lru.statistics.pageHits, optimal.statistics.pageHits],
      [2, 3, 5]
    );
  });

  it("validates invalid and empty page replacement input", () => {
    assert.deepEqual(parseNonNegativeIntegerSequence("", "Reference String"), {
      values: [],
      errors: ["Reference String input cannot be empty."]
    });

    assert.deepEqual(parseNonNegativeIntegerSequence("7 -1 a 2.5", "Reference String"), {
      values: [],
      errors: [
        "Reference String item 2 must be a non-negative integer.",
        "Reference String item 3 must be a non-negative integer.",
        "Reference String item 4 must be a non-negative integer."
      ]
    });

    assert.deepEqual(validatePositiveIntegerValue("0", "Number of Frames"), [
      "Number of Frames must be a positive integer."
    ]);
  });
});

function stepKeys(result) {
  return result.steps.map((step) => (
    `${step.step}:${step.page}:${step.frames.map((page) => page ?? "-").join("")}:${step.result}:${step.replacedPage ?? "-"}`
  ));
}
