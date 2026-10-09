import {
  buildResult,
  cloneProcesses,
  createIdleSegment,
  createProcessSegment,
  sortByArrivalThenInputOrder
} from "./helpers.js";

export function runSjf(processes, _timeQuantum, contextSwitchTime = 0) {
  const pendingProcesses = cloneProcesses(processes).sort(sortByArrivalThenInputOrder);
  const completedProcesses = [];
  const completionTimes = new Map();
  const firstStartTimes = new Map();
  const ganttChart = [];
  let currentTime = 0;

  while (pendingProcesses.length > 0) {
    const readyProcesses = pendingProcesses.filter((process) => process.arrivalTime <= currentTime);

    if (readyProcesses.length === 0) {
      const nextArrival = pendingProcesses[0].arrivalTime;
      ganttChart.push(createIdleSegment(currentTime, nextArrival));
      currentTime = nextArrival;
      continue;
    }

    readyProcesses.sort((a, b) => {
      if (a.burstTime !== b.burstTime) {
        return a.burstTime - b.burstTime;
      }

      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }

      return a.inputOrder - b.inputOrder;
    });

    const selectedProcess = readyProcesses[0];
    const pendingIndex = pendingProcesses.findIndex((process) => process.pid === selectedProcess.pid);
    pendingProcesses.splice(pendingIndex, 1);

    const start = currentTime;
    const end = start + selectedProcess.burstTime;
    firstStartTimes.set(selectedProcess.pid, start);
    completionTimes.set(selectedProcess.pid, end);
    ganttChart.push(createProcessSegment(selectedProcess.pid, start, end));
    completedProcesses.push(selectedProcess);
    currentTime = end;
  }

  return buildResult(completedProcesses, ganttChart, completionTimes, firstStartTimes, contextSwitchTime);
}
