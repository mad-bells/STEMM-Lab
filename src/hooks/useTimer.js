/**
 * useTimer.js
 * Simple stopwatch hook used across multiple activity screens.
 */

import { useState, useEffect, useRef } from 'react';

export default function useTimer() {
  const [elapsed, setElapsed] = useState(0); // milliseconds
  const [running, setRunning] = useState(false);
  const startRef = useRef(null);
  const intervalRef = useRef(null);
  const elapsedRef = useRef(0); // sync ref so reset + start work in same render cycle

  function start() {
    if (running) return;
    startRef.current = Date.now() - elapsedRef.current;
    intervalRef.current = setInterval(() => {
      const next = Date.now() - startRef.current;
      elapsedRef.current = next;
      setElapsed(next);
    }, 50);
    setRunning(true);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
  }

  function reset() {
    stop();
    elapsedRef.current = 0;
    setElapsed(0);
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const seconds = elapsed / 1000;
  const display = seconds.toFixed(2) + 's';

  return { elapsed, seconds, display, running, start, stop, reset };
}
