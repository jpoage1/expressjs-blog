// src/services/repeatDetector.js
// Tracks how many times each IP hits each route within a sliding time window.
// When the count crosses the threshold, it returns the count exactly once
// so the observer can create a single 'repeat' flag per burst.
//
// All state is in-memory. A periodic cleanup() call prevents the Map from
// growing unbounded. Call cleanup on an interval (the structuredLogger does
// this automatically every 5 minutes).

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_THRESHOLD = 20; // hits to same route in that window

class RepeatDetector {
  constructor(windowMs = DEFAULT_WINDOW_MS, threshold = DEFAULT_THRESHOLD) {
    this.windowMs = windowMs;
    this.threshold = threshold;
    this.counters = new Map(); // "ip:route" → { count, windowStart, flagged }
  }

  /**
   * Record a hit. Returns the count if the threshold was just crossed
   * (exactly once per window), otherwise returns null.
   */
  record(ip, route) {
    const key = `${ip}:${route}`;
    const now = Date.now();
    const entry = this.counters.get(key);

    // New window or expired window — start fresh
    if (!entry || now - entry.windowStart > this.windowMs) {
      this.counters.set(key, { count: 1, windowStart: now, flagged: false });
      return null;
    }

    entry.count++;

    // Only flag once per window, at the exact moment we cross threshold
    if (entry.count >= this.threshold && !entry.flagged) {
      entry.flagged = true;
      return entry.count;
    }

    return null;
  }

  /**
   * Remove stale entries. Safe to call frequently.
   */
  cleanup() {
    const now = Date.now();
    const cutoff = this.windowMs * 2;
    for (const [key, entry] of this.counters) {
      if (now - entry.windowStart > cutoff) {
        this.counters.delete(key);
      }
    }
  }
}

// Singleton — shared across all requests
module.exports = new RepeatDetector();
