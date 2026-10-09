import {
  buildPageReplacementResult,
  createEmptyFrames,
  createStep,
  firstEmptyFrameIndex
} from "./helpers.js";

export function runOptimal(referenceString, frameCount) {
  const frames = createEmptyFrames(frameCount);
  const steps = [];

  referenceString.forEach((page, index) => {
    if (frames.includes(page)) {
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

    const replacedIndex = findOptimalReplacementFrameIndex(frames, referenceString, index);
    const replacedPage = frames[replacedIndex];
    frames[replacedIndex] = page;
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

  return buildPageReplacementResult("optimal", "Optimal", referenceString, Number(frameCount), steps);
}

function findOptimalReplacementFrameIndex(frames, referenceString, currentIndex) {
  let selectedIndex = 0;
  let farthestNextUse = -1;

  for (let index = 0; index < frames.length; index += 1) {
    const nextUse = referenceString.indexOf(frames[index], currentIndex + 1);

    if (nextUse === -1) {
      return index;
    }

    if (nextUse > farthestNextUse) {
      selectedIndex = index;
      farthestNextUse = nextUse;
    }
  }

  return selectedIndex;
}
