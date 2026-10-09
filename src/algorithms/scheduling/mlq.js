import {
  buildResult,
  cloneProcesses,
  createIdleSegment,
  createProcessSegment,
  sortByArrivalThenInputOrder
} from "./helpers.js";
import { isInteger, isPositiveInteger } from "../../utils/validation.js";

export function runMlq(processes, queueConfigs, contextSwitchTime = 0) {
  if (!Array.isArray(queueConfigs) || queueConfigs.length < 2 || queueConfigs.some(q => !isInteger(q.priority) || !["fcfs", "rr"].includes(q.algorithm) || (q.algorithm === "rr" && (!isPositiveInteger(q.timeQuantum) || Number(q.timeQuantum) > 10000)))) {
    throw new Error("MLQ requires valid queue priorities and Round Robin quanta from 1 to 10000.");
  }
  const configuredQueueIds = new Set(queueConfigs.map(q => String(q.id)));
  if (processes.some(p => !configuredQueueIds.has(String(p.queueId)))) {
    throw new Error("Every MLQ process must be assigned to a configured queue.");
  }
  const sortedProcesses = cloneProcesses(processes).sort(sortByArrivalThenInputOrder);
  const remainingBurstTimes = new Map(sortedProcesses.map((p) => [p.pid, p.burstTime]));
  const completionTimes = new Map();
  const firstStartTimes = new Map();
  const ganttChart = [];
  let currentTime = 0;

  const queues = new Map();
  for (const config of queueConfigs) {
    queues.set(String(config.id), {
      config: { ...config, priority: Number(config.priority) },
      readyQueue: []
    });
  }

  const sortedQueueIds = Array.from(queues.values())
    .sort((a, b) => a.config.priority - b.config.priority)
    .map(q => String(q.config.id));

  let nextProcessIndex = 0;

  function addArrivedProcesses(time) {
    while (nextProcessIndex < sortedProcesses.length) {
      const p = sortedProcesses[nextProcessIndex];
      if (p.arrivalTime <= time) {
        const qId = String(p.queueId);
        if (queues.has(qId)) {
          queues.get(qId).readyQueue.push(p);
        }
        nextProcessIndex++;
      } else {
        break;
      }
    }
  }

  function getHighestPriorityProcess() {
    for (const qId of sortedQueueIds) {
      const q = queues.get(qId);
      if (q.readyQueue.length > 0) {
        return { process: q.readyQueue.shift(), queueInfo: q };
      }
    }
    return null;
  }

  while (completionTimes.size < sortedProcesses.length) {
    addArrivedProcesses(currentTime);
    const selected = getHighestPriorityProcess();

    if (!selected) {
      if (nextProcessIndex < sortedProcesses.length) {
        const nextArrival = sortedProcesses[nextProcessIndex].arrivalTime;
        if (currentTime < nextArrival) {
          ganttChart.push(createIdleSegment(currentTime, nextArrival));
          currentTime = nextArrival;
        }
      } else {
        break;
      }
      continue;
    }

    const { process, queueInfo } = selected;
    const start = currentTime;

    if (!firstStartTimes.has(process.pid)) {
      firstStartTimes.set(process.pid, start);
    }

    let runTime;
    if (queueInfo.config.algorithm === "rr") {
      const quantum = Number(queueInfo.config.timeQuantum);
      runTime = Math.min(quantum, remainingBurstTimes.get(process.pid));
    } else {
      runTime = remainingBurstTimes.get(process.pid);
    }

    const end = start + runTime;
    ganttChart.push(createProcessSegment(process.pid, start, end));
    remainingBurstTimes.set(process.pid, remainingBurstTimes.get(process.pid) - runTime);
    currentTime = end;

    addArrivedProcesses(currentTime);

    if (remainingBurstTimes.get(process.pid) > 0) {
      queueInfo.readyQueue.push(process);
    } else {
      completionTimes.set(process.pid, currentTime);
    }
  }

  const extraMetricsMap = new Map();
  for (const p of sortedProcesses) {
    extraMetricsMap.set(p.pid, { queueId: p.queueId });
  }

  return buildResult(sortedProcesses, ganttChart, completionTimes, firstStartTimes, contextSwitchTime, extraMetricsMap);
}
