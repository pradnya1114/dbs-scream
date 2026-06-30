import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioAnalyzer = () => {
  const [db, setDb] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsAnalyzing(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS for more accurate volume detection
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // Map RMS (0-255) to dB (0-120)
        // Sensitivity floor: 10
        const normalized = Math.max(0, (rms - 10) / (255 - 10));
        const dbValue = Math.min(120, normalized * 100 + 20); 
        setDb(dbValue);

        animationFrameRef.current = requestAnimationFrame(update);
      };

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      update();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    setIsAnalyzing(false);
    setDb(0);
  }, []);

  useEffect(() => {
    return () => stopAnalysis();
  }, [stopAnalysis]);

  return { db, isAnalyzing, startAnalysis, stopAnalysis };
};
