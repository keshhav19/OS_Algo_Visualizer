import { runMemoryAllocation } from "./helpers.js";

export function runBestFit(blockSizes, requestSizes) {
  return runMemoryAllocation(
    blockSizes,
    requestSizes,
    (blocks, request) => {
      const candidates = blocks.filter((block) => block.remainingSize >= request.size);
      candidates.sort((a, b) => {
        if (a.remainingSize !== b.remainingSize) {
          return a.remainingSize - b.remainingSize;
        }

        return Number(a.id.slice(1)) - Number(b.id.slice(1));
      });

      return candidates[0];
    },
    "bestFit",
    "Best Fit"
  );
}
