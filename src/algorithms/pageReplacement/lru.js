import {
  buildPageReplacementResult,
  createEmptyFrames,
  createStep,
  firstEmptyFrameIndex
} from "./helpers.js";

export function runLru(referenceString, frameCount) {
  const frames = createEmptyFrames(frameCount);
  const lastUsedAt = new Map();
  const steps = [];

  referenceString.forEach((page, index) => {
    if (frames.includes(page)) {
      lastUsedAt.set(page, index);
      steps.push(createStep({
        step: index + 1,
        page,
        frames,
        result: "Hit"
      }));
      return;
    }

    const emptyIndex = firstEmptyFrameIndex(frames);

    if (emptyIndex !== -1) {
      frames[emptyIndex] = page;
      lastUsedAt.set(page, index);
      steps.push(createStep({
        step: index + 1,
        page,
        frames,
        result: "Fault",
        changedFrameIndex: emptyIndex,
        loadedPage: page
      }));
      return;
    }

    const replacedIndex = findLeastRecentlyUsedFrameIndex(frames, lastUsedAt);
    const replacedPage = frames[replacedIndex];
    lastUsedAt.delete(replacedPage);
    frames[replacedIndex] = page;
    lastUsedAt.set(page, index);
    steps.push(createStep({
      step: index + 1,
      page,
      frames,
      result: "Fault",
      replacedPage,
      changedFrameIndex: replacedIndex,
      loadedPage: page
    }));
  });

  return buildPageReplacementResult("lru", "LRU", referenceString, Number(frameCount), steps);
}

function findLeastRecentlyUsedFrameIndex(frames, lastUsedAt) {
  let selectedIndex = 0;
  let oldestUse = lastUsedAt.get(frames[0]);

  for (let index = 1; index < frames.length; index += 1) {
    const usedAt = lastUsedAt.get(frames[index]);
    if (usedAt < oldestUse) {
      selectedIndex = index;
      oldestUse = usedAt;
    }
  }

  return selectedIndex;
}
