import { runFcfs } from "./fcfs.js";
import { runPriority } from "./priority.js";
import { runRoundRobin } from "./roundRobin.js";
import { runSjf } from "./sjf.js";
import { runMlq } from "./mlq.js";
import { runMlfq } from "./mlfq.js";

export const schedulingAlgorithms = {
  fcfs: {
    id: "fcfs",
    name: "FCFS",
    description: "First Come First Served executes processes in arrival order.",
    requiresPriority: false,
    requiresQuantum: false,
    requiresQueueConfig: false,
    requiresQueueAssignment: false,
    run: runFcfs
  },
  sjf: {
    id: "sjf",
    name: "SJF",
    description: "Shortest Job First selects the shortest burst among arrived processes.",
    requiresPriority: false,
    requiresQuantum: false,
    requiresQueueConfig: false,
    requiresQueueAssignment: false,
    run: runSjf
  },
  priority: {
    id: "priority",
    name: "Priority",
    description: "Lower priority number means higher scheduling priority.",
    requiresPriority: true,
    requiresQuantum: false,
    requiresQueueConfig: false,
    requiresQueueAssignment: false,
    run: runPriority
  },
  roundRobin: {
    id: "roundRobin",
    name: "Round Robin",
    description: "Processes rotate through the ready queue using a fixed time quantum.",
    requiresPriority: false,
    requiresQuantum: true,
    requiresQueueConfig: false,
    requiresQueueAssignment: false,
    run: runRoundRobin
  },
  mlq: {
    id: "mlq",
    name: "Multi-Level Queue",
    description: "Processes are permanently assigned to priority queues, each with its own scheduling policy.",
    requiresPriority: false,
    requiresQuantum: false,
    requiresQueueConfig: true,
    requiresQueueAssignment: true,
    run: runMlq
  },
  mlfq: {
    id: "mlfq",
    name: "Multi-Level Feedback Queue",
    description: "Processes move between priority queues based on CPU usage. Long-running processes are demoted to lower queues.",
    requiresPriority: false,
    requiresQuantum: false,
    requiresQueueConfig: true,
    requiresQueueAssignment: false,
    run: runMlfq
  }
};
