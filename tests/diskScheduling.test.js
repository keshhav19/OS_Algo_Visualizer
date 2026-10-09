import { describe, it } from "node:test";
import assert from "node:assert";
import { runDiskFcfs } from "../src/algorithms/diskScheduling/fcfs.js";
import { runDiskSstf } from "../src/algorithms/diskScheduling/sstf.js";
import { runDiskScan } from "../src/algorithms/diskScheduling/scan.js";
import { runDiskCscan } from "../src/algorithms/diskScheduling/cscan.js";
import { runDiskLook } from "../src/algorithms/diskScheduling/look.js";
import { runDiskClook } from "../src/algorithms/diskScheduling/clook.js";

// Standard textbook example:
// Disk size: 200, Head: 53, Requests: 98, 183, 37, 122, 14, 124, 65, 67
const STD_HEAD = 53;
const STD_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];
const STD_DISK = 200;

describe("Disk Scheduling — FCFS", () => {
  it("services requests in arrival order", () => {
    const r = runDiskFcfs(STD_HEAD, STD_REQUESTS, STD_DISK, "right");
    assert.deepStrictEqual(r.sequence, [53, 98, 183, 37, 122, 14, 124, 65, 67]);
    // 45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = 640
    assert.strictEqual(r.totalMovement, 640);
  });

  it("handles a single request", () => {
    const r = runDiskFcfs(50, [100], 200, "right");
    assert.deepStrictEqual(r.sequence, [50, 100]);
    assert.strictEqual(r.totalMovement, 50);
  });

  it("handles duplicate requests", () => {
    const r = runDiskFcfs(50, [100, 100, 100], 200, "right");
    assert.deepStrictEqual(r.sequence, [50, 100, 100, 100]);
    assert.strictEqual(r.totalMovement, 50);
  });
});

describe("Disk Scheduling — SSTF", () => {
  it("selects closest request at each step", () => {
    const r = runDiskSstf(STD_HEAD, STD_REQUESTS, STD_DISK, "right");
    // From 53: closest is 65(12), then 67(2), then 37(30), then 14(23),
    // then 98(84), then 122(24), then 124(2), then 183(59) → total = 236
    assert.deepStrictEqual(r.sequence, [53, 65, 67, 37, 14, 98, 122, 124, 183]);
    assert.strictEqual(r.totalMovement, 236);
  });

  it("breaks ties by choosing lower cylinder", () => {
    // Head at 50, requests at 40 (dist 10) and 60 (dist 10) — tie, lower wins
    const r = runDiskSstf(50, [40, 60], 200, "right");
    assert.deepStrictEqual(r.sequence, [50, 40, 60]);
    assert.strictEqual(r.totalMovement, 30);
  });

  it("handles requests on both sides of head", () => {
    const r = runDiskSstf(50, [10, 90], 200, "right");
    // 10 is dist 40, 90 is dist 40 → tie, lower wins → 10 first
    assert.deepStrictEqual(r.sequence, [50, 10, 90]);
    assert.strictEqual(r.totalMovement, 120);
  });
});

describe("Disk Scheduling — SCAN", () => {
  it("moves right then reverses at boundary", () => {
    const r = runDiskScan(STD_HEAD, STD_REQUESTS, STD_DISK, "right");
    // Right: 65, 67, 98, 122, 124, 183, boundary(199), then left: 37, 14
    assert.deepStrictEqual(r.sequence, [53, 65, 67, 98, 122, 124, 183, 199, 37, 14]);
    // 53→199 = 146, 199→14 = 185, total = 331
    assert.strictEqual(r.totalMovement, 146 + 185);
  });

  it("moves left then reverses at boundary", () => {
    const r = runDiskScan(STD_HEAD, STD_REQUESTS, STD_DISK, "left");
    // Left: 37, 14, boundary(0), then right: 65, 67, 98, 122, 124, 183
    assert.deepStrictEqual(r.sequence, [53, 37, 14, 0, 65, 67, 98, 122, 124, 183]);
    // 53→0 = 53, 0→183 = 183, total = 236
    assert.strictEqual(r.totalMovement, 236);
  });

  it("handles requests only on one side (right) — still visits boundary", () => {
    const r = runDiskScan(50, [60, 80, 100], 200, "right");
    // SCAN always goes to the boundary
    assert.deepStrictEqual(r.sequence, [50, 60, 80, 100, 199]);
    assert.strictEqual(r.totalMovement, 149);
  });

  it("handles head near boundary", () => {
    const r = runDiskScan(0, [50, 100], 200, "right");
    // Head at 0, going right → serves 50, 100, then boundary 199
    // No left requests, so after boundary it just stops
    assert.deepStrictEqual(r.sequence, [0, 50, 100, 199]);
    assert.strictEqual(r.totalMovement, 199);
  });
});

describe("Disk Scheduling — C-SCAN", () => {
  it("moves right, boundary, jumps to 0, continues right", () => {
    const r = runDiskCscan(STD_HEAD, STD_REQUESTS, STD_DISK, "right");
    // Right: 65, 67, 98, 122, 124, 183, boundary(199), jump(0), left requests ascending: 14, 37
    assert.deepStrictEqual(r.sequence, [53, 65, 67, 98, 122, 124, 183, 199, 0, 14, 37]);
    // 53→199=146, 199→0=199, 0→37=37 → total = 382
    assert.strictEqual(r.totalMovement, 382);
  });

  it("moves left, boundary, jumps to end, continues left", () => {
    const r = runDiskCscan(STD_HEAD, STD_REQUESTS, STD_DISK, "left");
    // Left descending: 37, 14, boundary(0), jump(199), right requests descending: 183, 124, 122, 98, 67, 65
    assert.deepStrictEqual(r.sequence, [53, 37, 14, 0, 199, 183, 124, 122, 98, 67, 65]);
    // 53→0=53, 0→199=199, 199→65=134 → total = 386
    assert.strictEqual(r.totalMovement, 386);
  });

  it("includes boundary and circular jump events in steps", () => {
    const r = runDiskCscan(50, [60, 10], 100, "right");
    const events = r.steps.map(s => s.event);
    assert.ok(events.includes("Boundary"), "Should have boundary event");
    assert.ok(events.includes("Circular Jump"), "Should have circular jump event");
  });
});

describe("Disk Scheduling — LOOK", () => {
  it("does NOT go to physical boundary — stops at last request", () => {
    const r = runDiskLook(STD_HEAD, STD_REQUESTS, STD_DISK, "right");
    // Right: 65, 67, 98, 122, 124, 183 (stops, no 199), then left: 37, 14
    assert.deepStrictEqual(r.sequence, [53, 65, 67, 98, 122, 124, 183, 37, 14]);
    // 53→183=130, 183→14=169 → total = 299
    assert.strictEqual(r.totalMovement, 299);
    // Should NOT include 199 in the sequence
    assert.ok(!r.sequence.includes(199), "LOOK should not visit physical boundary");
  });

  it("handles direction left", () => {
    const r = runDiskLook(STD_HEAD, STD_REQUESTS, STD_DISK, "left");
    // Left: 37, 14 (stops, no 0), then right: 65, 67, 98, 122, 124, 183
    assert.deepStrictEqual(r.sequence, [53, 37, 14, 65, 67, 98, 122, 124, 183]);
    // 53→14=39, 14→183=169 → total = 208
    assert.strictEqual(r.totalMovement, 208);
    assert.ok(!r.sequence.includes(0), "LOOK should not visit physical boundary");
  });

  it("handles requests only on one side", () => {
    const r = runDiskLook(50, [10, 20, 30], 200, "right");
    // No requests to the right, so immediately reverses
    assert.deepStrictEqual(r.sequence, [50, 30, 20, 10]);
    assert.strictEqual(r.totalMovement, 40);
  });
});

describe("Disk Scheduling — C-LOOK", () => {
  it("jumps between furthest requests, not boundaries", () => {
    const r = runDiskClook(STD_HEAD, STD_REQUESTS, STD_DISK, "right");
    // Right: 65, 67, 98, 122, 124, 183, jump to 14, then 37
    assert.deepStrictEqual(r.sequence, [53, 65, 67, 98, 122, 124, 183, 14, 37]);
    // 53→183=130, 183→14=169, 14→37=23 → total = 322
    assert.strictEqual(r.totalMovement, 322);
    assert.strictEqual(r.averageMovement, 40.25);
    assert.strictEqual(r.steps.filter(step => step.event === "Circular Jump" || step.event === "Request").length, 8);
    assert.ok(!r.sequence.includes(199), "C-LOOK should not visit physical boundary");
    assert.ok(!r.sequence.includes(0), "C-LOOK should not visit physical boundary");
  });

  it("handles direction left", () => {
    const r = runDiskClook(STD_HEAD, STD_REQUESTS, STD_DISK, "left");
    // Left descending: 37, 14, jump to 183, then descending: 124, 122, 98, 67, 65
    assert.deepStrictEqual(r.sequence, [53, 37, 14, 183, 124, 122, 98, 67, 65]);
    // 53→14=39, 14→183=169, 183→65=118 → total = 326
    assert.strictEqual(r.totalMovement, 326);
  });

  it("handles requests only on one side (no jump needed)", () => {
    const r = runDiskClook(50, [60, 70, 80], 200, "right");
    assert.deepStrictEqual(r.sequence, [50, 60, 70, 80]);
    assert.strictEqual(r.totalMovement, 30);
    // No circular jump events
    const jumpEvents = r.steps.filter(s => s.event === "Circular Jump");
    assert.strictEqual(jumpEvents.length, 0);
  });
});

describe("Disk request averages", () => {
  it("counts each request once for all algorithms in either direction", () => {
    for (const algorithm of [runDiskFcfs, runDiskSstf, runDiskScan, runDiskCscan, runDiskLook, runDiskClook]) {
      for (const direction of ["left", "right"]) {
        const result = algorithm(STD_HEAD, STD_REQUESTS, STD_DISK, direction);
        assert.strictEqual(result.averageMovement, Number((result.totalMovement / STD_REQUESTS.length).toFixed(2)));
      }
    }
  });

  it("matches the textbook total movement values", () => {
    assert.equal(runDiskFcfs(STD_HEAD, STD_REQUESTS, STD_DISK, "right").totalMovement, 640);
    assert.equal(runDiskSstf(STD_HEAD, STD_REQUESTS, STD_DISK, "right").totalMovement, 236);
    assert.equal(runDiskScan(STD_HEAD, STD_REQUESTS, STD_DISK, "left").totalMovement, 236);
    assert.equal(runDiskScan(STD_HEAD, STD_REQUESTS, STD_DISK, "right").totalMovement, 331);
    assert.equal(runDiskLook(STD_HEAD, STD_REQUESTS, STD_DISK, "left").totalMovement, 208);
    assert.equal(runDiskLook(STD_HEAD, STD_REQUESTS, STD_DISK, "right").totalMovement, 299);
    assert.equal(runDiskCscan(STD_HEAD, STD_REQUESTS, STD_DISK, "right").totalMovement, 382);
    assert.equal(runDiskClook(STD_HEAD, STD_REQUESTS, STD_DISK, "right").totalMovement, 322);
  });
});

describe("Disk Scheduling — Edge Cases", () => {
  it("handles initial head being a requested cylinder", () => {
    const r = runDiskFcfs(50, [50, 100], 200, "right");
    assert.deepStrictEqual(r.sequence, [50, 50, 100]);
    assert.strictEqual(r.totalMovement, 50);
  });

  it("handles initial head at cylinder 0", () => {
    const r = runDiskScan(0, [50, 100, 150], 200, "left");
    // At boundary already, no left requests, boundary is at 0 (already there)
    // Reverses and goes right: 50, 100, 150
    assert.deepStrictEqual(r.sequence, [0, 50, 100, 150]);
    assert.strictEqual(r.totalMovement, 150);
  });

  it("handles initial head at final cylinder", () => {
    const r = runDiskScan(199, [50, 100, 150], 200, "right");
    // Already at right boundary. Reverses: 150, 100, 50
    assert.deepStrictEqual(r.sequence, [199, 150, 100, 50]);
    assert.strictEqual(r.totalMovement, 149);
  });

  it("handles very small disk size", () => {
    const r = runDiskFcfs(0, [1], 2, "right");
    assert.strictEqual(r.totalMovement, 1);
  });
});
