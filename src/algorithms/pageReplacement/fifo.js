import {
  buildPageReplacementResult,
  createEmptyFrames,
  createStep,
  firstEmptyFrameIndex
} from "./helpers.js";

export function runFifo(referenceString, frameCount) {
  const frames = createEmptyFrames(frameCount);
  const fifoQueue = [];
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
      fifoQueue.push(page);
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

    const replacedPage = fifoQueue.shift();
    const replacedIndex = frames.findIndex((framePage) => framePage === replacedPage);
    frames[replacedIndex] = page;
    fifoQueue.push(page);
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

  return buildPageReplacementResult("fifo", "FIFO", referenceString, Number(frameCount), steps);
}
