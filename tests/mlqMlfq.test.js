import { describe, it } from "node:test";
import assert from "node:assert";
import { runMlq } from "../src/algorithms/scheduling/mlq.js";
import { runMlfq } from "../src/algorithms/scheduling/mlfq.js";

describe("MLQ algorithm", () => {
  it("respects queue priority and limits RR execution", () => {
    const processes = [
      { pid: "P1", arrivalTime: 0, burstTime: 5, queueId: 2 }, // Lower priority, FCFS
      { pid: "P2", arrivalTime: 1, burstTime: 4, queueId: 1 }  // Higher priority, RR quantum 2
    ];
    const queueConfigs = [
      { id: 1, priority: 1, algorithm: "rr", timeQuantum: 2 },
      { id: 2, priority: 2, algorithm: "fcfs", timeQuantum: 0 }
    ];
    
    const result = runMlq(processes, queueConfigs);
    
    assert.deepStrictEqual(
      result.ganttChart.map(s => `${s.pid}:${s.start}-${s.end}`),
      [
        "P1:0-5", // Non-preemptive, P1 starts and finishes burst
        "P2:5-7", // P2 runs RR quantum 2
        "P2:7-9"  // P2 runs remaining 2
      ]
    );
  });

  it("schedules multiple processes in same queue using its algorithm", () => {
    const processes = [
      { pid: "P1", arrivalTime: 0, burstTime: 4, queueId: 1 },
      { pid: "P2", arrivalTime: 1, burstTime: 4, queueId: 1 }
    ];
    const queueConfigs = [
      { id: 1, priority: 1, algorithm: "rr", timeQuantum: 2 },
      { id: 2, priority: 2, algorithm: "fcfs", timeQuantum: 0 }
    ];

    const result = runMlq(processes, queueConfigs);
    assert.deepStrictEqual(
      result.ganttChart.map(s => `${s.pid}:${s.start}-${s.end}`),
      [
        "P1:0-2",
        "P2:2-4",
        "P1:4-6",
        "P2:6-8"
      ]
    );
  });

  it("rejects an unknown queue assignment and a zero quantum", () => {
    const queues = [
      { id: 1, priority: 1, algorithm: "rr", timeQuantum: 0 },
      { id: 2, priority: 2, algorithm: "fcfs", timeQuantum: 0 }
    ];
    assert.throws(() => runMlq([{ pid: "P1", arrivalTime: 0, burstTime: 2, queueId: 1 }], queues), /quanta/);
    queues[0].timeQuantum = 1;
    assert.throws(() => runMlq([{ pid: "P1", arrivalTime: 0, burstTime: 2, queueId: 3 }], queues), /assigned/);
  });
});

describe("MLFQ algorithm", () => {
  it("preempts lower priority queue and demotes after full quantum", () => {
    const processes = [
      { pid: "P1", arrivalTime: 0, burstTime: 8 },
      { pid: "P2", arrivalTime: 1, burstTime: 2 }
    ];
    const queueConfigs = [
      { id: 1, priority: 1, algorithm: "rr", timeQuantum: 3 },
      { id: 2, priority: 2, algorithm: "fcfs", timeQuantum: 0 }
    ];

    const result = runMlfq(processes, queueConfigs);

    // Timeline:
    // t=0: P1 arrives in Q1. Starts executing.
    // t=1: P2 arrives in Q1. P1 still has quantum, doesn't preempt itself.
    // t=3: P1 finishes its Q1 quantum. Demoted to Q2. P2 starts from Q1.
    // t=5: P2 finishes burst (2ms). P1 starts from Q2.
    // t=10: P1 finishes burst (5ms remaining). FCFS queue, no demotion limit.
    
    assert.deepStrictEqual(
      result.ganttChart.map(s => `${s.pid}:${s.start}-${s.end}`),
      [
        "P1:0-3",
        "P2:3-5",
        "P1:5-10"
      ]
    );
  });

  it("handles preemptive arrival properly", () => {
    const processes = [
      { pid: "P1", arrivalTime: 0, burstTime: 8 }, // Demoted to Q2 at t=3
      { pid: "P2", arrivalTime: 4, burstTime: 2 }  // Arrives while P1 is in Q2
    ];
    const queueConfigs = [
      { id: 1, priority: 1, algorithm: "rr", timeQuantum: 3 },
      { id: 2, priority: 2, algorithm: "fcfs", timeQuantum: 0 }
    ];

    const result = runMlfq(processes, queueConfigs);

    // Timeline:
    // t=0: P1 in Q1 runs 3ms.
    // t=3: P1 demoted to Q2. P1 runs in Q2.
    // t=4: P2 arrives in Q1. Preempts P1. P2 runs in Q1 for 2ms.
    // t=6: P2 finishes. P1 resumes in Q2 for remaining 4ms.
    // t=10: P1 finishes.
    assert.deepStrictEqual(
      result.ganttChart.map(s => `${s.pid}:${s.start}-${s.end}`),
      [
        "P1:0-3",
        "P1:3-4",
        "P2:4-6",
        "P1:6-10"
      ]
    );
  });

  it("rejects an invalid feedback queue quantum", () => {
    const queues = [
      { id: 1, priority: 1, algorithm: "rr", timeQuantum: 0 },
      { id: 2, priority: 2, algorithm: "fcfs", timeQuantum: 0 }
    ];
    assert.throws(() => runMlfq([{ pid: "P1", arrivalTime: 0, burstTime: 2 }], queues), /quanta/);
  });
});
