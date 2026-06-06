import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export default function useAccelerometer(updateIntervalMs = 100) {
  const [data, setData] = useState({ x: 0, y: 0, z: 0, magnitude: 0 });
  const [available, setAvailable] = useState(true);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    Accelerometer.isAvailableAsync().then((isAvailable) => {
      if (!isAvailable) { setAvailable(false); return; }
      Accelerometer.setUpdateInterval(updateIntervalMs);
      subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
        if (!mounted) return;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        setData({ x, y, z, magnitude });
      });
    });
    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
    };
  }, [updateIntervalMs]);

  return { ...data, available };
}