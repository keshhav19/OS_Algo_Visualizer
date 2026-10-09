import { runMemoryAllocation } from "./helpers.js";

export function runFirstFit(blockSizes, requestSizes) {
  return runMemoryAllocation(
    blockSizes,
    requestSizes,
    (blocks, request) => blocks.find((block) => block.remainingSize >= request.size),
    "firstFit",
    "First Fit"
  );
}
