export function createEmptyFrames(frameCount) {
  return Array.from({ length: Number(frameCount) }, () => null);
}

export function createStep({
  step,
  page,
  frames,
  result,
  replacedPage = null,
  changedFrameIndex = null,
  loadedPage = null
}) {
  return {
    step,
    page,
    frames: [...frames],
    result,
    replacedPage,
    changedFrameIndex,
    loadedPage
  };
}

export function buildPageReplacementResult(algorithmId, algorithmName, referenceString, frameCount, steps) {
  const totalReferences = referenceString.length;
  const pageHits = steps.filter((step) => step.result === "Hit").length;
  const pageFaults = totalReferences - pageHits;

  return {
    algorithmId,
    algorithmName,
    referenceString: [...referenceString],
    frameCount,
    steps,
    statistics: {
      totalReferences,
      pageHits,
      pageFaults,
      hitRatio: toRatio(pageHits, totalReferences),
      faultRatio: toRatio(pageFaults, totalReferences)
    }
  };
}

export function toRatio(part, whole) {
  if (whole === 0) {
    return 0;
  }

  return Number((part / whole).toFixed(2));
}

export function firstEmptyFrameIndex(frames) {
  return frames.findIndex((page) => page === null);
}
