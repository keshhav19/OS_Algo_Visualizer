import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isInteger,
  isNonNegativeInteger,
  isPositiveInteger,
  parsePositiveIntegerList,
  validateBankersInput,
  validateDetectionInput,
  validateProcesses
} from "../src/utils/validation.js";

describe("strict integer validation", () => {
  it("accepts only clean safe base-10 integers", () => {
    for (const value of ["1e3", "0x10", "+5", "5.", " ", null, true, [5], "9007199254740992"]) {
      assert.equal(isInteger(value), false, String(value));
    }
    assert.equal(isInteger("-5"), true);
    assert.equal(isInteger(5), true);
    assert.equal(isPositiveInteger("5"), true);
    assert.equal(isPositiveInteger(" 5"), false);
    assert.equal(isNonNegativeInteger(" "), false);
  });

  it("uses a shared comma-list rule and enforces list bounds", () => {
    assert.deepEqual(parsePositiveIntegerList("10,,20,", "Items"), { values: [10, 20], errors: [] });
    assert.ok(parsePositiveIntegerList("1000001", "Items").errors.length > 0);
    assert.ok(parsePositiveIntegerList(Array(101).fill("1").join(","), "Items").errors.length > 0);
  });

  it("rejects oversized scheduling inputs", () => {
    assert.ok(validateProcesses([{ pid: "P1", arrivalTime: " ", burstTime: 1 }]).some(error => error.includes("Arrival Time")));
    assert.ok(validateProcesses([{ pid: "P1", arrivalTime: 0, burstTime: 10001 }]).some(error => error.includes("Burst Time")));
    assert.ok(validateProcesses(Array.from({ length: 51 }, (_, i) => ({ pid: `P${i}`, arrivalTime: 0, burstTime: 1 }))).some(error => error.includes("50 processes")));
  });

  it("rejects empty and oversized Banker and detection dimensions", () => {
    assert.ok(validateBankersInput([], [], []).some(error => error.includes("at least one")));
    assert.ok(validateDetectionInput([], [], []).some(error => error.includes("at least one")));
  });
});
