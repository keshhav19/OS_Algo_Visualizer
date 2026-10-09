import {
  buildResult,
  cloneProcesses,
  createIdleSegment,
  createProcessSegment,
  sortByArrivalThenInputOrder
} from "./helpers.js";

export function runFcfs(processes, _timeQuantum, contextSwitchTime = 0) {
  const sortedProcesses = cloneProcesses(processes).sort(sortByArrivalThenInputOrder);
  const completionTimes = new Map();
  const firstStartTimes = new Map();
  const ganttChart = [];
  let currentTime = 0;

  for (const process of sortedProcesses) {
    if (currentTime < process.arrivalTime) {
      ganttChart.push(createIdleSegment(currentTime, process.arrivalTime));
      currentTime = process.arrivalTime;
    }

    const start = currentTime;
    const end = start + process.burstTime;
    firstStartTimes.set(process.pid, start);
    completionTimes.set(process.pid, end);
    ganttChart.push(createProcessSegment(process.pid, start, end));
    currentTime = end;
  }

  return buildResult(sortedProcesses, ganttChart, completionTimes, firstStartTimes, contextSwitchTime);
}
