import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runFcfs } from "../src/algorithms/scheduling/fcfs.js";
import { runPriority } from "../src/algorithms/scheduling/priority.js";
import { runRoundRobin } from "../src/algorithms/scheduling/roundRobin.js";
import { runSjf } from "../src/algorithms/scheduling/sjf.js";

describe("CPU scheduling algorithms", () => {
  it("matches the textbook FCFS, Round Robin, and SJF waiting-time examples", () => {
    const fcfsProcesses = [
      { pid: "P1", arrivalTime: 0, burstTime: 24 },
      { pid: "P2", arrivalTime: 0, burstTime: 3 },
      { pid: "P3", arrivalTime: 0, burstTime: 3 }
    ];
    assert.equal(runFcfs(fcfsProcesses).averages.waitingTime, 17);
    assert.equal(runRoundRobin(fcfsProcesses, 4).averages.waitingTime, 5.67);
    assert.equal(runSjf([
      { pid: "P1", arrivalTime: 0, burstTime: 7 },
      { pid: "P2", arrivalTime: 2, burstTime: 4 },
      { pid: "P3", arrivalTime: 4, burstTime: 1 },
      { pid: "P4", arrivalTime: 5, burstTime: 4 }
    ]).averages.waitingTime, 4);
  });

  it("calculates FCFS metrics with staggered arrivals", () => {
    const result = runFcfs([
      { pid: "P1", arrivalTime: 0, burstTime: 4 },
      { pid: "P2", arrivalTime: 1, burstTime: 3 },
      { pid: "P3", arrivalTime: 2, burstTime: 1 }
    ]);

    assert.deepEqual(result.ganttChart.map(segmentKey), ["P1:0-4", "P2:4-7", "P3:7-8"]);
    assertProcess(result, "P1", { completionTime: 4, turnaroundTime: 4, waitingTime: 0, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 7, turnaroundTime: 6, waitingTime: 3, responseTime: 3 });
    assertProcess(result, "P3", { completionTime: 8, turnaroundTime: 6, waitingTime: 5, responseTime: 5 });
    assert.deepEqual(result.averages, { turnaroundTime: 5.33, waitingTime: 2.67, responseTime: 2.67 });
  });

  it("shows idle time when the first FCFS process arrives later", () => {
    const result = runFcfs([
      { pid: "P1", arrivalTime: 3, burstTime: 2 },
      { pid: "P2", arrivalTime: 5, burstTime: 2 }
    ]);

    assert.deepEqual(result.ganttChart.map(segmentKey), ["Idle:0-3", "P1:3-5", "P2:5-7"]);
    assertProcess(result, "P1", { completionTime: 5, turnaroundTime: 2, waitingTime: 0, responseTime: 0 });
  });

  it("runs non-preemptive SJF using only arrived processes", () => {
    const result = runSjf([
      { pid: "P1", arrivalTime: 0, burstTime: 7 },
      { pid: "P2", arrivalTime: 2, burstTime: 4 },
      { pid: "P3", arrivalTime: 4, burstTime: 1 },
      { pid: "P4", arrivalTime: 5, burstTime: 2 }
    ]);

    assert.deepEqual(result.ganttChart.map(segmentKey), ["P1:0-7", "P3:7-8", "P4:8-10", "P2:10-14"]);
    assertProcess(result, "P1", { completionTime: 7, turnaroundTime: 7, waitingTime: 0, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 14, turnaroundTime: 12, waitingTime: 8, responseTime: 8 });
    assertProcess(result, "P3", { completionTime: 8, turnaroundTime: 4, waitingTime: 3, responseTime: 3 });
    assertProcess(result, "P4", { completionTime: 10, turnaroundTime: 5, waitingTime: 3, responseTime: 3 });
  });

  it("runs non-preemptive priority scheduling with smaller number as higher priority", () => {
    const result = runPriority([
      { pid: "P1", arrivalTime: 0, burstTime: 5, priority: 3 },
      { pid: "P2", arrivalTime: 1, burstTime: 2, priority: 1 },
      { pid: "P3", arrivalTime: 2, burstTime: 1, priority: 2 }
    ]);

    assert.deepEqual(result.ganttChart.map(segmentKey), ["P1:0-5", "P2:5-7", "P3:7-8"]);
    assertProcess(result, "P1", { completionTime: 5, turnaroundTime: 5, waitingTime: 0, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 7, turnaroundTime: 6, waitingTime: 4, responseTime: 4 });
    assertProcess(result, "P3", { completionTime: 8, turnaroundTime: 6, waitingTime: 5, responseTime: 5 });
  });

  it("runs Round Robin with correct ready queue order and response times", () => {
    const result = runRoundRobin([
      { pid: "P1", arrivalTime: 0, burstTime: 5 },
      { pid: "P2", arrivalTime: 1, burstTime: 4 },
      { pid: "P3", arrivalTime: 2, burstTime: 2 }
    ], 2);

    assert.deepEqual(result.ganttChart.map(segmentKey), [
      "P1:0-2",
      "P2:2-4",
      "P3:4-6",
      "P1:6-8",
      "P2:8-10",
      "P1:10-11"
    ]);
    assertProcess(result, "P1", { completionTime: 11, turnaroundTime: 11, waitingTime: 6, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 10, turnaroundTime: 9, waitingTime: 5, responseTime: 1 });
    assertProcess(result, "P3", { completionTime: 6, turnaroundTime: 4, waitingTime: 2, responseTime: 2 });
    assert.deepEqual(result.averages, { turnaroundTime: 8, waitingTime: 4.33, responseTime: 1 });
  });

  it("runs Round Robin after an idle gap", () => {
    const result = runRoundRobin([
      { pid: "P1", arrivalTime: 4, burstTime: 3 },
      { pid: "P2", arrivalTime: 5, burstTime: 4 }
    ], 2);

    assert.deepEqual(result.ganttChart.map(segmentKey), ["Idle:0-4", "P1:4-6", "P2:6-8", "P1:8-9", "P2:9-11"]);
    assertProcess(result, "P1", { completionTime: 9, turnaroundTime: 5, waitingTime: 2, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 11, turnaroundTime: 6, waitingTime: 2, responseTime: 1 });
  });

  it("inserts context switches between different processes in FCFS", () => {
    // P1(0-4) CS(4-5) P2(5-8) CS(8-9) P3(9-10)
    const result = runFcfs([
      { pid: "P1", arrivalTime: 0, burstTime: 4 },
      { pid: "P2", arrivalTime: 1, burstTime: 3 },
      { pid: "P3", arrivalTime: 2, burstTime: 1 }
    ], undefined, 1);

    assert.deepEqual(result.ganttChart.map(segmentKey), [
      "P1:0-4", "CS:4-5", "P2:5-8", "CS:8-9", "P3:9-10"
    ]);
    assertProcess(result, "P1", { completionTime: 4, turnaroundTime: 4, waitingTime: 0, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 8, turnaroundTime: 7, waitingTime: 4, responseTime: 4 });
    assertProcess(result, "P3", { completionTime: 10, turnaroundTime: 8, waitingTime: 7, responseTime: 7 });
  });

  it("inserts context switches in Round Robin between different processes", () => {
    // Without CS: P1(0-2) P2(2-4) P3(4-6) P1(6-8) P2(8-10) P1(10-11)
    // With CS=1:  P1(0-2) CS(2-3) P2(3-5) CS(5-6) P3(6-8) CS(8-9) P1(9-11) CS(11-12) P2(12-14) CS(14-15) P1(15-16)
    const result = runRoundRobin([
      { pid: "P1", arrivalTime: 0, burstTime: 5 },
      { pid: "P2", arrivalTime: 1, burstTime: 4 },
      { pid: "P3", arrivalTime: 2, burstTime: 2 }
    ], 2, 1);

    assert.deepEqual(result.ganttChart.map(segmentKey), [
      "P1:0-2", "CS:2-3", "P2:3-5", "CS:5-6", "P3:6-8",
      "CS:8-9", "P1:9-11", "CS:11-12", "P2:12-14", "CS:14-15", "P1:15-16"
    ]);
    assertProcess(result, "P1", { completionTime: 16, turnaroundTime: 16, waitingTime: 11, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 14, turnaroundTime: 13, waitingTime: 9, responseTime: 2 });
    assertProcess(result, "P3", { completionTime: 8, turnaroundTime: 6, waitingTime: 4, responseTime: 4 });
  });

  it("does not insert context switch after an idle gap", () => {
    // Idle(0-3) P1(3-5) CS(5-6) P2(6-8)
    const result = runFcfs([
      { pid: "P1", arrivalTime: 3, burstTime: 2 },
      { pid: "P2", arrivalTime: 5, burstTime: 2 }
    ], undefined, 1);

    assert.deepEqual(result.ganttChart.map(segmentKey), [
      "Idle:0-3", "P1:3-5", "CS:5-6", "P2:6-8"
    ]);
    // No CS between Idle and P1 — only between P1 and P2
    assertProcess(result, "P1", { completionTime: 5, turnaroundTime: 2, waitingTime: 0, responseTime: 0 });
    assertProcess(result, "P2", { completionTime: 8, turnaroundTime: 3, waitingTime: 1, responseTime: 1 });
  });

  it("shrinks an idle gap when prior context switches extend past it", () => {
    const result = runFcfs([
      { pid: "P1", arrivalTime: 0, burstTime: 2 },
      { pid: "P2", arrivalTime: 0, burstTime: 2 },
      { pid: "P3", arrivalTime: 5, burstTime: 1 }
    ], undefined, 2);
    assert.deepStrictEqual(result.ganttChart.map(({ pid, start, end }) => [pid, start, end]), [
      ["P1", 0, 2], ["CS", 2, 4], ["P2", 4, 6], ["CS", 6, 8], ["P3", 8, 9]
    ]);
    assert.deepStrictEqual(result.metrics.map(({ pid, waitingTime, turnaroundTime, responseTime }) => [pid, waitingTime, turnaroundTime, responseTime]), [
      ["P1", 0, 2, 0], ["P2", 4, 6, 4], ["P3", 3, 4, 3]
    ]);
  });

  it("produces identical results when context switch time is 0", () => {
    const processes = [
      { pid: "P1", arrivalTime: 0, burstTime: 4 },
      { pid: "P2", arrivalTime: 1, burstTime: 3 }
    ];

    const withoutCS = runFcfs(processes);
    const withZeroCS = runFcfs(processes, undefined, 0);

    assert.deepEqual(withoutCS.ganttChart.map(segmentKey), withZeroCS.ganttChart.map(segmentKey));
    assert.deepEqual(withoutCS.metrics, withZeroCS.metrics);
    assert.deepEqual(withoutCS.averages, withZeroCS.averages);
  });

  it("does not insert context switch when same process continues in Round Robin", () => {
    // Only one process — quantum expires but same process continues, no CS needed
    const result = runRoundRobin([
      { pid: "P1", arrivalTime: 0, burstTime: 5 }
    ], 2, 1);

    assert.deepEqual(result.ganttChart.map(segmentKey), [
      "P1:0-2", "P1:2-4", "P1:4-5"
    ]);
    assertProcess(result, "P1", { completionTime: 5, turnaroundTime: 5, waitingTime: 0, responseTime: 0 });
  });

  it("handles context switching with SJF and different arrival times", () => {
    // SJF order: P1(0-7) CS P3(8-9) CS P4(10-12) CS P2(13-17)
    const result = runSjf([
      { pid: "P1", arrivalTime: 0, burstTime: 7 },
      { pid: "P2", arrivalTime: 2, burstTime: 4 },
      { pid: "P3", arrivalTime: 4, burstTime: 1 },
      { pid: "P4", arrivalTime: 5, burstTime: 2 }
    ], undefined, 1);

    assert.deepEqual(result.ganttChart.map(segmentKey), [
      "P1:0-7", "CS:7-8", "P3:8-9", "CS:9-10", "P4:10-12", "CS:12-13", "P2:13-17"
    ]);
    assertProcess(result, "P1", { completionTime: 7, turnaroundTime: 7, waitingTime: 0, responseTime: 0 });
    assertProcess(result, "P3", { completionTime: 9, turnaroundTime: 5, waitingTime: 4, responseTime: 4 });
    assertProcess(result, "P4", { completionTime: 12, turnaroundTime: 7, waitingTime: 5, responseTime: 5 });
    assertProcess(result, "P2", { completionTime: 17, turnaroundTime: 15, waitingTime: 11, responseTime: 11 });
  });
});

function assertProcess(result, pid, expectedMetrics) {
  const actual = result.metrics.find((process) => process.pid === pid);
  assert.deepEqual(pick(actual, Object.keys(expectedMetrics)), expectedMetrics);
}

function pick(item, keys) {
  return Object.fromEntries(keys.map((key) => [key, item[key]]));
}

function segmentKey(segment) {
  return `${segment.pid}:${segment.start}-${segment.end}`;
}
