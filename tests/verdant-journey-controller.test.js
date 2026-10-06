import test from "node:test";
import assert from "node:assert/strict";

import {
  accumulateWheelDelta,
  clampStage,
  getCinematicStageStatus,
  getOffsetInsideScroller,
  normalizeWheelDelta,
} from "../src/templates/verdant-vow/useVerdantJourneyController.js";

test("clampStage keeps a requested stage inside the configured journey", () => {
  assert.equal(clampStage(-4), 0);
  assert.equal(clampStage(2.9), 2);
  assert.equal(clampStage(99), 4);
  assert.equal(clampStage(3, 3), 2);
  assert.equal(clampStage("not-a-stage"), 0);
});

test("normalizeWheelDelta converts line and page deltas to pixels", () => {
  assert.equal(normalizeWheelDelta(12, 0), 12);
  assert.equal(normalizeWheelDelta(3, 1), 48);
  assert.equal(normalizeWheelDelta(-1, 2, 720), -720);
  assert.equal(normalizeWheelDelta(undefined), 0);
});

test("accumulateWheelDelta triggers exactly when its threshold is reached", () => {
  const first = accumulateWheelDelta({ total: 0, direction: 0 }, 30, 72);
  assert.deepEqual(first, { total: 30, direction: 1, triggered: 0 });

  const second = accumulateWheelDelta(first, 42, 72);
  assert.deepEqual(second, { total: 0, direction: 1, triggered: 1 });
});

test("accumulateWheelDelta discards momentum when gesture direction reverses", () => {
  const result = accumulateWheelDelta({ total: 60, direction: 1 }, -20, 72);
  assert.deepEqual(result, { total: -20, direction: -1, triggered: 0 });

  const triggered = accumulateWheelDelta(result, -52, 72);
  assert.deepEqual(triggered, { total: 0, direction: -1, triggered: -1 });
});

test("getCinematicStageStatus describes active and transitioning stages", () => {
  assert.equal(getCinematicStageStatus(null, 0), "inactive");
  assert.equal(getCinematicStageStatus({ activeStage: 2, isTransitioning: false }, 2), "active");

  const transition = {
    activeStage: 1,
    fromStage: 1,
    targetStage: 2,
    isTransitioning: true,
  };
  assert.equal(getCinematicStageStatus(transition, 1), "leaving");
  assert.equal(getCinematicStageStatus(transition, 2), "entering");
  assert.equal(getCinematicStageStatus(transition, 4), "inactive");
});

test("getOffsetInsideScroller calculates a stable scroller-relative offset", () => {
  const scroller = {
    scrollTop: 180,
    getBoundingClientRect: () => ({ top: 40 }),
  };
  const node = {
    getBoundingClientRect: () => ({ top: 310 }),
  };

  assert.equal(getOffsetInsideScroller(node, scroller), 450);
  assert.equal(getOffsetInsideScroller(null, scroller), 0);
  assert.equal(getOffsetInsideScroller(node, null), 0);
});
