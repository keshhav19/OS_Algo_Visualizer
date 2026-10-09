import {
  buildResult,
  cloneProcesses,
  createIdleSegment,
  createProcessSegment,
  sortByArrivalThenInputOrder
} from "./helpers.js";
import { isInteger, isPositiveInteger } from "../../utils/validation.js";

export function runMlfq(processes, queueConfigs, contextSwitchTime = 0) {
  if (!Array.isArray(queueConfigs) || queueConfigs.length < 2 || queueConfigs.some(q => !isInteger(q.priority) || !["fcfs", "rr"].includes(q.algorithm) || (q.algorithm === "rr" && (!isPositiveInteger(q.timeQuantum) || Number(q.timeQuantum) > 10000)))) {
    throw new Error("MLFQ requires valid queue priorities and Round Robin quanta from 1 to 10000.");
  }
  const sortedProcesses = cloneProcesses(processes).sort(sortByArrivalThenInputOrder);
  const remainingBurstTimes = new Map(sortedProcesses.map((p) => [p.pid, p.burstTime]));
  const completionTimes = new Map();
  const firstStartTimes = new Map();
  const ganttChart = [];
  let currentTime = 0;

  // Process states: which queue they are in, how much quantum they have used in current queue
  const processState = new Map();
  for (const p of sortedProcesses) {
    processState.set(p.pid, {
      queueHistory: [],
      currentQueueId: null,
      quantumUsedInCurrentQueue: 0
    });
  }

  // Initialize queues
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

  const highestPriorityQueueId = sortedQueueIds.length > 0 ? sortedQueueIds[0] : null;

  let nextProcessIndex = 0;

  function addArrivedProcesses(time) {
    let arrivalOccurred = false;
    while (nextProcessIndex < sortedProcesses.length) {
      const p = sortedProcesses[nextProcessIndex];
      if (p.arrivalTime <= time) {
        if (highestPriorityQueueId) {
          queues.get(highestPriorityQueueId).readyQueue.push(p);
          const state = processState.get(p.pid);
          state.currentQueueId = highestPriorityQueueId;
          state.queueHistory.push(highestPriorityQueueId);
          arrivalOccurred = true;
        }
        nextProcessIndex++;
      } else {
        break;
      }
    }
    return arrivalOccurred;
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

  function getNextArrivalTime() {
    if (nextProcessIndex < sortedProcesses.length) {
      return sortedProcesses[nextProcessIndex].arrivalTime;
    }
    return Infinity;
  }

  function getLowerPriorityQueueId(currentQId) {
    const idx = sortedQueueIds.indexOf(currentQId);
    if (idx >= 0 && idx + 1 < sortedQueueIds.length) {
      return sortedQueueIds[idx + 1];
    }
    return currentQId; // no lower queue
  }

  addArrivedProcesses(currentTime);

  while (completionTimes.size < sortedProcesses.length) {
    const selected = getHighestPriorityProcess();

    if (!selected) {
      const nextArrival = getNextArrivalTime();
      if (nextArrival !== Infinity && currentTime < nextArrival) {
        ganttChart.push(createIdleSegment(currentTime, nextArrival));
        currentTime = nextArrival;
        addArrivedProcesses(currentTime);
      }
      continue;
    }

    const { process, queueInfo } = selected;
    const pState = processState.get(process.pid);
    const start = currentTime;

    if (!firstStartTimes.has(process.pid)) {
      firstStartTimes.set(process.pid, start);
    }

    const isFcfs = queueInfo.config.algorithm === "fcfs";
    const quantum = isFcfs ? Infinity : Number(queueInfo.config.timeQuantum);
    
    // Remaining time process can run in this queue before demotion
    const quantumRemaining = quantum - pState.quantumUsedInCurrentQueue;
    const processRemaining = remainingBurstTimes.get(process.pid);
    
    // It can run until it finishes, quantum expires, or a new process arrives (if preemptive)
    // Actually, only new arrivals to a *higher* priority queue should preempt it.
    // Since all new arrivals go to the highest priority queue (index 0), 
    // any arrival will preempt if current queue is > 0.
    const nextArrival = getNextArrivalTime();
    const canBePreempted = sortedQueueIds.indexOf(String(queueInfo.config.id)) > 0;
    
    let runTime = Math.min(quantumRemaining, processRemaining);
    let preempted = false;

    if (canBePreempted && nextArrival < currentTime + runTime) {
      runTime = nextArrival - currentTime;
      preempted = true;
    }

    const end = start + runTime;
    ganttChart.push(createProcessSegment(process.pid, start, end));
    
    remainingBurstTimes.set(process.pid, processRemaining - runTime);
    pState.quantumUsedInCurrentQueue += runTime;
    currentTime = end;

    addArrivedProcesses(currentTime);

    const newProcessRemaining = remainingBurstTimes.get(process.pid);

    if (newProcessRemaining > 0) {
      if (preempted) {
        // Preempted by a higher priority arrival. Stays in current queue.
        queueInfo.readyQueue.push(process);
      } else if (!isFcfs && pState.quantumUsedInCurrentQueue >= quantum) {
        // Used up full quantum, demote to lower queue
        const nextQId = getLowerPriorityQueueId(String(queueInfo.config.id));
        queues.get(String(nextQId)).readyQueue.push(process);
        
        pState.currentQueueId = nextQId;
        pState.quantumUsedInCurrentQueue = 0;
        
        // Add to history only if queue changed
        if (pState.queueHistory[pState.queueHistory.length - 1] !== nextQId) {
            pState.queueHistory.push(nextQId);
        }
      } else {
        // FCFS or didn't use full quantum
        queueInfo.readyQueue.push(process);
      }
    } else {
      completionTimes.set(process.pid, currentTime);
    }
  }

  const extraMetricsMap = new Map();
  for (const p of sortedProcesses) {
    const state = processState.get(p.pid);
    extraMetricsMap.set(p.pid, {
      currentQueue: state.currentQueueId,
      queueHistory: state.queueHistory.join(" → ")
    });
  }

  return buildResult(sortedProcesses, ganttChart, completionTimes, firstStartTimes, contextSwitchTime, extraMetricsMap);
}
