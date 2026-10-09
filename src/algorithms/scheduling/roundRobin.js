import {
  buildResult,
  cloneProcesses,
  createIdleSegment,
  createProcessSegment,
  sortByArrivalThenInputOrder
} from "./helpers.js";

export function runRoundRobin(processes, timeQuantum, contextSwitchTime = 0) {
  const quantum = Number(timeQuantum);
  const sortedProcesses = cloneProcesses(processes).sort(sortByArrivalThenInputOrder);
  const remainingBurstTimes = new Map(sortedProcesses.map((process) => [process.pid, process.burstTime]));
  const completionTimes = new Map();
  const firstStartTimes = new Map();
  const ganttChart = [];
  const readyQueue = [];
  let nextProcessIndex = 0;
  let currentTime = 0;

  while (completionTimes.size < sortedProcesses.length) {
    addArrivedProcesses(sortedProcesses, readyQueue, nextProcessIndex, currentTime);
    nextProcessIndex = findNextUnqueuedIndex(sortedProcesses, nextProcessIndex, currentTime);

    if (readyQueue.length === 0) {
      const nextArrival = sortedProcesses[nextProcessIndex].arrivalTime;
      if (currentTime < nextArrival) {
        ganttChart.push(createIdleSegment(currentTime, nextArrival));
        currentTime = nextArrival;
      }
      continue;
    }

    const currentProcess = readyQueue.shift();
    const start = currentTime;

    if (!firstStartTimes.has(currentProcess.pid)) {
      firstStartTimes.set(currentProcess.pid, start);
    }

    const runTime = Math.min(quantum, remainingBurstTimes.get(currentProcess.pid));
    const end = start + runTime;
    ganttChart.push(createProcessSegment(currentProcess.pid, start, end));
    remainingBurstTimes.set(currentProcess.pid, remainingBurstTimes.get(currentProcess.pid) - runTime);
    currentTime = end;

    addArrivedProcesses(sortedProcesses, readyQueue, nextProcessIndex, currentTime);
    nextProcessIndex = findNextUnqueuedIndex(sortedProcesses, nextProcessIndex, currentTime);

    if (remainingBurstTimes.get(currentProcess.pid) > 0) {
      readyQueue.push(currentProcess);
    } else {
      completionTimes.set(currentProcess.pid, currentTime);
    }
  }

  return buildResult(sortedProcesses, ganttChart, completionTimes, firstStartTimes, contextSwitchTime);
}

function addArrivedProcesses(processes, readyQueue, startIndex, currentTime) {
  for (let index = startIndex; index < processes.length; index += 1) {
    if (processes[index].arrivalTime <= currentTime) {
      readyQueue.push(processes[index]);
    } else {
      break;
    }
  }
}

function findNextUnqueuedIndex(processes, startIndex, currentTime) {
  let nextIndex = startIndex;

  while (nextIndex < processes.length && processes[nextIndex].arrivalTime <= currentTime) {
    nextIndex += 1;
  }

  return nextIndex;
}
