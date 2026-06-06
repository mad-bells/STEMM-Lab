/**
 * calculations.test.js
 * Unit tests for physics and maths helpers in src/utils/calculations.js
 */

import {
  finalVelocity,
  acceleration,
  netForce,
  weight,
  dragForce,
  gForceNoBounce,
  gForceBounce,
  average,
  stdDev,
  breathsPerMinute,
  scoreFromTime,
  scoreFromMagnitude,
} from '../src/utils/calculations';

const G = 9.8;

// ── Parachute: kinematics ─────────────────────────────────────────────────

describe('finalVelocity', () => {
  it('returns distance / time', () => {
    expect(finalVelocity(2.0, 0.5)).toBeCloseTo(4.0);
  });
  it('returns 0 when distance is 0', () => {
    expect(finalVelocity(0, 1)).toBe(0);
  });
});

describe('acceleration', () => {
  it('returns velocity / time', () => {
    expect(acceleration(4.0, 2.0)).toBeCloseTo(2.0);
  });
});

describe('netForce', () => {
  it('returns mass × acceleration', () => {
    expect(netForce(0.2, 5.0)).toBeCloseTo(1.0);
  });
  it('returns 0 for zero mass', () => {
    expect(netForce(0, 9.8)).toBe(0);
  });
});

describe('weight', () => {
  it('returns mass × G (9.8)', () => {
    expect(weight(1.0)).toBeCloseTo(9.8);
    expect(weight(0.2)).toBeCloseTo(1.96);
  });
  it('returns 0 for zero mass', () => {
    expect(weight(0)).toBe(0);
  });
});

describe('dragForce', () => {
  it('equals weight minus net force', () => {
    // mass=0.2kg, accel=5 m/s²
    // weight=1.96N, netForce=1.0N → drag=0.96N
    expect(dragForce(0.2, 5.0)).toBeCloseTo(0.96);
  });
  it('is zero when acceleration equals G (free fall)', () => {
    expect(dragForce(1.0, G)).toBeCloseTo(0);
  });
  it('is negative when acceleration exceeds G (unusual but handled)', () => {
    expect(dragForce(1.0, 12.0)).toBeLessThan(0);
  });
});

// ── G-Force ───────────────────────────────────────────────────────────────

describe('gForceNoBounce', () => {
  it('calculates g-force correctly', () => {
    // impactSpeed=2.0 m/s, contactTime=0.05s → 2.0/0.05/9.8 ≈ 4.08g
    expect(gForceNoBounce(2.0, 0.05)).toBeCloseTo(4.08, 1);
  });
  it('increases with higher impact speed', () => {
    expect(gForceNoBounce(4.0, 0.05)).toBeGreaterThan(gForceNoBounce(2.0, 0.05));
  });
  it('decreases with longer contact time', () => {
    expect(gForceNoBounce(2.0, 0.1)).toBeLessThan(gForceNoBounce(2.0, 0.05));
  });
});

describe('gForceBounce', () => {
  it('is greater than no-bounce for same speed', () => {
    const noBounce = gForceNoBounce(2.0, 0.02);
    const bounce = gForceBounce(2.0, 1.5, 0.02);
    expect(bounce).toBeGreaterThan(noBounce);
  });
  it('equals no-bounce when rebound speed is 0', () => {
    expect(gForceBounce(2.0, 0, 0.05)).toBeCloseTo(gForceNoBounce(2.0, 0.05));
  });
});

// ── Statistics ────────────────────────────────────────────────────────────

describe('average', () => {
  it('calculates mean correctly', () => {
    expect(average([1, 2, 3, 4, 5])).toBe(3);
  });
  it('returns 0 for empty array', () => {
    expect(average([])).toBe(0);
  });
  it('returns the value itself for single element', () => {
    expect(average([7])).toBe(7);
  });
});

describe('stdDev', () => {
  it('returns 0 for identical values', () => {
    expect(stdDev([5, 5, 5, 5])).toBe(0);
  });
  it('calculates population std dev correctly', () => {
    // [2,4,4,4,5,5,7,9] → mean=5, variance=4, stdDev=2
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0);
  });
  it('is always non-negative', () => {
    expect(stdDev([1, 100, 50, 3])).toBeGreaterThanOrEqual(0);
  });
});

// ── Breathing ─────────────────────────────────────────────────────────────

describe('breathsPerMinute', () => {
  it('converts 12 breaths in 60s to 12 bpm', () => {
    expect(breathsPerMinute(12, 60)).toBe(12);
  });
  it('scales correctly for shorter duration', () => {
    expect(breathsPerMinute(6, 30)).toBe(12);
  });
  it('returns 0 for zero breaths', () => {
    expect(breathsPerMinute(0, 60)).toBe(0);
  });
});

// ── Scoring ───────────────────────────────────────────────────────────────

describe('scoreFromTime', () => {
  it('returns 100 for best possible time', () => {
    expect(scoreFromTime(0.1)).toBe(100);
  });
  it('returns 0 for worst possible time', () => {
    expect(scoreFromTime(2.0)).toBe(0);
  });
  it('returns ~50 for midpoint', () => {
    expect(scoreFromTime(1.05)).toBeCloseTo(50, 0);
  });
  it('clamps values below best to 100', () => {
    expect(scoreFromTime(0.01)).toBe(100);
  });
  it('clamps values above worst to 0', () => {
    expect(scoreFromTime(99)).toBe(0);
  });
});

describe('scoreFromMagnitude', () => {
  it('returns 100 for zero magnitude', () => {
    expect(scoreFromMagnitude(0)).toBe(100);
  });
  it('returns 0 for worst magnitude', () => {
    expect(scoreFromMagnitude(5)).toBe(0);
  });
  it('returns ~50 for midpoint', () => {
    expect(scoreFromMagnitude(2.5)).toBeCloseTo(50, 0);
  });
});
