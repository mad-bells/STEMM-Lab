/**
 * calculations.js
 * Physics and maths helpers for STEMM Lab activities.
 * All functions are pure — easy to unit-test.
 */

const G = 9.8; // m/s²

// ── Parachute Drop ────────────────────────────────────────────────────────

/** Final velocity from drop height and time (initial v = 0). */
export function finalVelocity(distanceM, timeS) {
  return distanceM / timeS;
}

/** Acceleration from final velocity and time (initial v = 0). */
export function acceleration(finalVelocityMs, timeS) {
  return finalVelocityMs / timeS;
}

/** Net force (F = ma). */
export function netForce(massKg, accelMs2) {
  return massKg * accelMs2;
}

/** Weight force (F = mg). */
export function weight(massKg) {
  return massKg * G;
}

/** Drag force = Weight - Net Force. */
export function dragForce(massKg, accelMs2) {
  return weight(massKg) - netForce(massKg, accelMs2);
}

/** G-force on impact (no bounce). */
export function gForceNoBounce(impactSpeedMs, contactTimeS) {
  return impactSpeedMs / contactTimeS / G;
}

/** G-force on impact (with bounce). */
export function gForceBounce(impactSpeedMs, bounceSpeedMs, contactTimeS) {
  return (impactSpeedMs + bounceSpeedMs) / contactTimeS / G;
}

// ── Reaction Board ────────────────────────────────────────────────────────

/** Average of an array of numbers. */
export function average(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Standard deviation. */
export function stdDev(values) {
  const avg = average(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ── Breathing Pace ────────────────────────────────────────────────────────

/** Breaths per minute from breath count and duration in seconds. */
export function breathsPerMinute(breathCount, durationS) {
  return (breathCount / durationS) * 60;
}

// ── Scoring ───────────────────────────────────────────────────────────────

/**
 * Convert a raw measurement to a 0-100 score.
 * Lower is better for some activities (e.g. reaction time), higher for others.
 */
/** Lower time = better score by default (e.g. reaction board). Invert at call site for slow-is-better activities. */
export function scoreFromTime(timeS, bestS = 0.1, worstS = 2.0) {
  if (worstS <= bestS) return 0;
  const clamped = Math.min(Math.max(timeS, bestS), worstS);
  return Math.round(((worstS - clamped) / (worstS - bestS)) * 100);
}

export function scoreFromMagnitude(magnitude, bestMag = 0, worstMag = 5) {
  const clamped = Math.min(Math.max(magnitude, bestMag), worstMag);
  return Math.round(((worstMag - clamped) / (worstMag - bestMag)) * 100);
}
