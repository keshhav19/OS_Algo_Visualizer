import { runMemoryAllocation } from "./helpers.js";

export function runWorstFit(blockSizes, requestSizes) {
  return runMemoryAllocation(
    blockSizes,
    requestSizes,
    (blocks, request) => {
      const candidates = blocks.filter((block) => block.remainingSize >= request.size);
      candidates.sort((a, b) => {
        if (a.remainingSize !== b.remainingSize) {
          return b.remainingSize - a.remainingSize;
        }

        return Number(a.id.slice(1)) - Number(b.id.slice(1));
      });

      return candidates[0];
    },
    "worstFit",
    "Worst Fit"
  );
}
