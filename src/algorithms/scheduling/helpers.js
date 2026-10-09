export function cloneProcesses(processes) {
  return processes.map((process, index) => ({
    ...process,
    pid: String(process.pid).trim(),
    arrivalTime: Number(process.arrivalTime),
    burstTime: Number(process.burstTime),
    priority: process.priority === "" || process.priority === undefined ? null : Number(process.priority),
    inputOrder: index
  }));
}

export function createIdleSegment(start, end) {
  return {
    pid: "Idle",
    start,
    end,
    duration: end - start,
    isIdle: true,
    isContextSwitch: false
  };
}

export function createProcessSegment(pid, start, end) {
  return {
    pid,
    start,
    end,
    duration: end - start,
    isIdle: false,
    isContextSwitch: false
  };
}

export function createContextSwitchSegment(start, end) {
  return {
    pid: "CS",
    start,
    end,
    duration: end - start,
    isIdle: false,
    isContextSwitch: true
  };
}

/**
 * Post-processes a gantt chart to insert context switch segments.
 * A context switch is added between two adjacent segments only when:
 *   - Neither segment is idle
 *   - Neither segment is a context switch
 *   - They belong to different processes (different PIDs)
 *
 * Rebuilds the timeline so context switches consume idle time where possible.
 */
export function insertContextSwitches(ganttChart, contextSwitchTime) {
  if (contextSwitchTime <= 0 || ganttChart.length < 2) {
    return ganttChart;
  }

  const result = [];
  let clock = ganttChart[0].start;
  let previousProcess = null;

  for (const segment of ganttChart) {
    if (segment.isIdle) {
      if (clock < segment.end) {
        const start = Math.max(clock, segment.start);
        result.push(createIdleSegment(start, segment.end));
        clock = segment.end;
        previousProcess = null;
      }
      continue;
    }

    if (segment.isContextSwitch) continue;

    if (previousProcess !== null && previousProcess !== segment.pid) {
      result.push(createContextSwitchSegment(clock, clock + contextSwitchTime));
      clock += contextSwitchTime;
    }

    const start = Math.max(clock, segment.start);
    const end = start + segment.duration;
    result.push({ ...segment, start, end });
    clock = end;
    previousProcess = segment.pid;
  }

  return result;
}

export function buildResult(processes, ganttChart, completionTimes, firstStartTimes, contextSwitchTime = 0, extraMetricsMap = new Map()) {
  const csTime = Number(contextSwitchTime) || 0;
  const finalGantt = csTime > 0 ? insertContextSwitches(ganttChart, csTime) : ganttChart;

  // When context switches are inserted, recalculate completion times and
  // first start times from the modified gantt chart.
  const finalCompletionTimes = csTime > 0 ? new Map() : completionTimes;
  const finalFirstStartTimes = csTime > 0 ? new Map() : firstStartTimes;

  if (csTime > 0) {
    for (const segment of finalGantt) {
      if (segment.isIdle || segment.isContextSwitch) {
        continue;
      }
      // Track the latest end time for each process (completion time)
      finalCompletionTimes.set(segment.pid, segment.end);
      // Track the earliest start time for each process (first start / response)
      if (!finalFirstStartTimes.has(segment.pid)) {
        finalFirstStartTimes.set(segment.pid, segment.start);
      }
    }
  }

  const metrics = processes
    .map((process) => {
      const completionTime = finalCompletionTimes.get(process.pid);
      const turnaroundTime = completionTime - process.arrivalTime;
      const waitingTime = turnaroundTime - process.burstTime;
      const responseTime = finalFirstStartTimes.get(process.pid) - process.arrivalTime;
      const extraMetrics = extraMetricsMap.get(process.pid) || {};

      return {
        pid: process.pid,
        arrivalTime: process.arrivalTime,
        burstTime: process.burstTime,
        priority: process.priority,
        ...extraMetrics,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      };
    })
    .sort((a, b) => a.pid.localeCompare(b.pid, undefined, { numeric: true, sensitivity: "base" }));

  return {
    ganttChart: finalGantt,
    metrics,
    averages: {
      turnaroundTime: average(metrics, "turnaroundTime"),
      waitingTime: average(metrics, "waitingTime"),
      responseTime: average(metrics, "responseTime")
    }
  };
}

export function average(items, key) {
  if (items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => sum + item[key], 0);
  return Number((total / items.length).toFixed(2));
}

export function sortByArrivalThenInputOrder(a, b) {
  if (a.arrivalTime !== b.arrivalTime) {
    return a.arrivalTime - b.arrivalTime;
  }

  return a.inputOrder - b.inputOrder;
}
