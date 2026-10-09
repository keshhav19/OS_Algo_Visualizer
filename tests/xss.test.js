import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderGanttChart } from "../src/components/ganttChart.js";
import { renderMetricsTable } from "../src/components/metricsTable.js";
import { renderProcessTable } from "../src/components/processTable.js";

describe("user supplied process IDs are escaped in HTML", () => {
  it("renders a hostile ID as text in tables and the Gantt chart", () => {
    const pid = "<img src=x onerror=alert(1)>";
    const safe = "&lt;img src=x onerror=alert(1)&gt;";
    assert.ok(renderProcessTable([{ pid, arrivalTime: 0, burstTime: 1 }]).includes(safe));
    assert.ok(renderMetricsTable({
      metrics: [{ pid, arrivalTime: 0, burstTime: 1, completionTime: 1, turnaroundTime: 1, waitingTime: 0, responseTime: 0 }],
      averages: { turnaroundTime: 1, waitingTime: 0, responseTime: 0 }
    }).includes(safe));
    assert.ok(renderGanttChart([{ pid, start: 0, end: 1 }]).includes(safe));
    assert.ok(!renderGanttChart([{ pid, start: 0, end: 1 }]).includes("<img"));
  });
});
