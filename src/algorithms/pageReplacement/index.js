import { runFifo } from "./fifo.js";
import { runLru } from "./lru.js";
import { runOptimal } from "./optimal.js";

export const pageReplacementAlgorithms = {
  fifo: {
    id: "fifo",
    name: "FIFO",
    description: "Replaces the page that has been in memory for the longest time.",
    run: runFifo
  },
  lru: {
    id: "lru",
    name: "LRU",
    description: "Replaces the page that has not been used for the longest time.",
    run: runLru
  },
  optimal: {
    id: "optimal",
    name: "Optimal",
    description: "Replaces the page whose next use is farthest in the future.",
    run: runOptimal
  }
};

export function runAllPageReplacementAlgorithms(referenceString, frameCount) {
  return Object.values(pageReplacementAlgorithms).map((algorithm) => (
    algorithm.run(referenceString, frameCount)
  ));
}
