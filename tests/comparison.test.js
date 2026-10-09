import { test, describe } from "node:test";
import assert from "node:assert";
import { schedulingAlgorithms } from "../src/algorithms/scheduling/index.js";
import { memoryAlgorithms } from "../src/algorithms/memory/index.js";
import { pageReplacementAlgorithms } from "../src/algorithms/pageReplacement/index.js";
import { diskSchedulingAlgorithms } from "../src/algorithms/diskScheduling/index.js";

describe("Comparison Engine Simulation", () => {
  test("CPU Scheduling Comparison uses identical input and returns correctly", () => {
    const processes = [
      { pid: "P1", arrivalTime: 0, burstTime: 5, priority: 2 },
      { pid: "P2", arrivalTime: 1, burstTime: 3, priority: 1 }
    ];
    
    // Simulate what handleCpuSchedulingAction does
    const results = ["fcfs", "sjf", "priority"].map(algoId => {
      const alg = schedulingAlgorithms[algoId];
      // exact deep copy
      const processesCopy = processes.map(p => ({ ...p }));
      return { algorithmId: alg.id, algorithmName: alg.name, ...alg.run(processesCopy, 0) };
    });

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].algorithmId, "fcfs");
    assert.strictEqual(results[1].algorithmId, "sjf");
    assert.strictEqual(results[2].algorithmId, "priority");
    
    // FCFS: P1 runs (0-5), P2 runs (5-8). WT: P1=0, P2=4. Avg=2
    assert.strictEqual(results[0].averages.waitingTime, 2);
    
    // SJF (non-preemptive): P1 runs (0-5), P2 runs (5-8). WT: P1=0, P2=4. Avg=2
    assert.strictEqual(results[1].averages.waitingTime, 2);
  });

  test("Memory Management Comparison handles identical input", () => {
    const blocks = [100, 500, 200, 300, 600];
    const requests = [212, 417, 112, 426];
    
    const results = ["firstFit", "bestFit", "worstFit"].map(algoId => {
      const alg = memoryAlgorithms[algoId];
      return { algorithmId: alg.id, algorithmName: alg.name, ...alg.run([...blocks], [...requests]) };
    });

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].algorithmId, "firstFit");
    assert.strictEqual(results[1].algorithmId, "bestFit");
    assert.strictEqual(results[2].algorithmId, "worstFit");
  });

  test("Page Replacement Comparison handles identical input", () => {
    const refString = [7, 0, 1, 2, 0, 3, 0, 4];
    const frames = 3;
    
    const results = ["fifo", "lru", "optimal"].map(algoId => {
      const alg = pageReplacementAlgorithms[algoId];
      return { algorithmId: alg.id, algorithmName: alg.name, ...alg.run([...refString], frames) };
    });

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].algorithmId, "fifo");
    assert.strictEqual(results[1].algorithmId, "lru");
    assert.strictEqual(results[2].algorithmId, "optimal");
  });

  test("Disk Scheduling Comparison handles identical input", () => {
    const requests = [98, 183, 37, 122, 14, 124, 65, 67];
    const diskSize = 200;
    const initialHead = 53;
    const direction = "right";
    
    const results = ["fcfs", "sstf", "scan", "cscan", "look", "clook"].map(algoId => {
      const alg = diskSchedulingAlgorithms[algoId];
      return { algorithmId: alg.id, algorithmName: alg.name, ...alg.run(initialHead, [...requests], diskSize, direction) };
    });

    assert.strictEqual(results.length, 6);
    assert.strictEqual(results[0].algorithmId, "fcfs");
    assert.strictEqual(results[1].algorithmId, "sstf");
    assert.strictEqual(results[2].algorithmId, "scan");
  });
});
