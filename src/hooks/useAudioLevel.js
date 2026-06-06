import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

const DBFS_OFFSET = 90;

export default function useAudioLevel(active = false) {
  const [dB, setDb] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  useEffect(() => {
    if (!active || !hasPermission) return;
    let stopped = false;

    async function startMetering() {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      recordingRef.current = recording;
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });
      await recording.startAsync();

      const interval = setInterval(async () => {
        if (stopped) { clearInterval(interval); return; }
        const status = await recording.getStatusAsync();
        if (status.isRecording && status.metering != null) {
          setDb(Math.round(Math.max(0, status.metering + DBFS_OFFSET)));
        }
      }, 300);
    }

    startMetering().catch(console.error);
    return () => {
      stopped = true;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      setDb(0);
    };
  }, [active, hasPermission]);

  return { dB, hasPermission };
}