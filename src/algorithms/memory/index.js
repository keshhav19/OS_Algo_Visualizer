import { runBestFit } from "./bestFit.js";
import { runFirstFit } from "./firstFit.js";
import { runWorstFit } from "./worstFit.js";

export const memoryAlgorithms = {
  firstFit: {
    id: "firstFit",
    name: "First Fit",
    description: "Allocates each request to the first block with enough free memory.",
    run: runFirstFit
  },
  bestFit: {
    id: "bestFit",
    name: "Best Fit",
    description: "Allocates each request to the smallest block that can satisfy it.",
    run: runBestFit
  },
  worstFit: {
    id: "worstFit",
    name: "Worst Fit",
    description: "Allocates each request to the largest available block.",
    run: runWorstFit
  }
};

export function runAllMemoryAlgorithms(blockSizes, requestSizes) {
  return Object.values(memoryAlgorithms).map((algorithm) => algorithm.run(blockSizes, requestSizes));
}
