import { runDiskFcfs } from "./fcfs.js";
import { runDiskSstf } from "./sstf.js";
import { runDiskScan } from "./scan.js";
import { runDiskCscan } from "./cscan.js";
import { runDiskLook } from "./look.js";
import { runDiskClook } from "./clook.js";

export const diskSchedulingAlgorithms = {
  fcfs: {
    id: "fcfs",
    name: "FCFS",
    description: "First Come First Serve — services requests in the order they arrive.",
    requiresDirection: false,
    run: runDiskFcfs
  },
  sstf: {
    id: "sstf",
    name: "SSTF",
    description: "Shortest Seek Time First — always moves to the closest pending request.",
    requiresDirection: false,
    run: runDiskSstf
  },
  scan: {
    id: "scan",
    name: "SCAN",
    description: "Elevator algorithm — moves to the disk boundary, then reverses direction.",
    requiresDirection: true,
    run: runDiskScan
  },
  cscan: {
    id: "cscan",
    name: "C-SCAN",
    description: "Circular SCAN — moves in one direction, then jumps to the opposite boundary.",
    requiresDirection: true,
    run: runDiskCscan
  },
  look: {
    id: "look",
    name: "LOOK",
    description: "Like SCAN but stops at the last request instead of travelling to the boundary.",
    requiresDirection: true,
    run: runDiskLook
  },
  clook: {
    id: "clook",
    name: "C-LOOK",
    description: "Like C-SCAN but jumps between the furthest requests, not the physical boundaries.",
    requiresDirection: true,
    run: runDiskClook
  }
};

export function runAllDiskAlgorithms(head, requests, diskSize, direction) {
  return Object.values(diskSchedulingAlgorithms).map(algo => ({
    algorithmId: algo.id,
    algorithmName: algo.name,
    ...algo.run(head, requests, diskSize, direction)
  }));
}
