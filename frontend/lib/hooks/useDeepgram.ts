import { useRef, useCallback, useState, useEffect } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { DeepgramResult } from '../types';
import { API_BASE_URL } from '../constants';
import { logTranscriptEvent } from '../transcriptLogger';

interface UseDeepgramProps {
  onTranscript: (result: DeepgramResult) => void;
  onUtteranceEnd: () => void;
  onError?: (error: Error) => void;
}

export function useDeepgram({ onTranscript, onUtteranceEnd, onError }: UseDeepgramProps) {
  const connectionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isConnectingRef = useRef(false);
  const keepaliveRef = useRef<NodeJS.Timeout | null>(null); // FIX: Store keepalive in ref for proper cleanup
  const [isConnected, setIsConnected] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<Error | null>(null); // FIX: Track microphone errors

  // Use refs for callbacks to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  const onUtteranceEndRef = useRef(onUtteranceEnd);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onUtteranceEndRef.current = onUtteranceEnd;
    onErrorRef.current = onError;
  }, [onTranscript, onUtteranceEnd, onError]);

  const connect = useCallback(async (language: string = 'en') => {
    if (isConnectingRef.current || connectionRef.current) {
      console.log('[Deepgram] Already connected or connecting');
      return;
    }

    try {
      isConnectingRef.current = true;
      console.log('[Deepgram] Connecting...');

      const response = await fetch(`${API_BASE_URL}/api/deepgram/key`);
      if (!response.ok) throw new Error('Failed to get Deepgram API key');
      const { apiKey } = await response.json();

      const deepgram = createClient(apiKey);

      const connection = deepgram.listen.live({
        model: 'nova-3',
        language,
        punctuate: true,
        smart_format: true,
        interim_results: true,
        utterance_end_ms: 2000,  // Increased from 1000ms to reduce false triggers
        vad_events: true,
        filler_words: true,
        diarize: false,
        encoding: 'linear16',
        sample_rate: 16000,
        channels: 1,
      });

      connectionRef.current = connection;

      // FIX: Clear any existing keepalive before creating new one
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current);
      }
      
      // Keepalive - stored in ref for proper cleanup
      keepaliveRef.current = setInterval(() => {
        if (connection?.getReadyState() === 1) {
          try { connection.keepAlive(); } catch {}
        }
      }, 3000);

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('[Deepgram] Connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        logTranscriptEvent({ event: 'DEEPGRAM_CONNECTED', meta: { language } });
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const alt = data.channel?.alternatives?.[0];
        if (!alt?.transcript) return;

        const result: DeepgramResult = {
          text: alt.transcript,
          confidence: alt.confidence || 0,
          isFinal: data.is_final || false,
          speechFinal: data.speech_final || false,
        };

        if (result.isFinal) {
          logTranscriptEvent({
            event: 'TRANSCRIPT',
            text: result.text,
            confidence: result.confidence,
            isFinal: result.isFinal,
            speechFinal: result.speechFinal,
            wordCount: result.text.trim().split(/\s+/).filter(Boolean).length,
          });
        }

        onTranscriptRef.current(result);
      });

      connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        console.log('[Deepgram] UtteranceEnd event fired');
        logTranscriptEvent({ event: 'UTTERANCE_END' });
        onUtteranceEndRef.current();
      });

      connection.on(LiveTranscriptionEvents.Error, (err: any) => {
        console.error('[Deepgram] Error:', err);
        isConnectingRef.current = false;
        logTranscriptEvent({ event: 'DEEPGRAM_ERROR', meta: { message: err.message } });
        onErrorRef.current?.(new Error(err.message || 'Deepgram error'));
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('[Deepgram] Closed');
        setIsConnected(false);
        isConnectingRef.current = false;
        logTranscriptEvent({ event: 'DEEPGRAM_DISCONNECTED' });
      });

    } catch (error) {
      console.error('[Deepgram] Connection failed:', error);
      isConnectingRef.current = false;
      onErrorRef.current?.(error as Error);
    }
  }, []); // No dependencies - uses refs

  const startMicrophone = useCallback(async () => {
    try {
      console.log('[Deepgram] Starting microphone...');
      setMicrophoneError(null); // Clear previous errors

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule('/worklets/pcm-encoder.js');

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, 'pcm-encoder');
      workletNodeRef.current = worklet;

      worklet.port.onmessage = (e) => {
        if (connectionRef.current?.getReadyState() === 1) {
          connectionRef.current.send(e.data);
        }
      };

      source.connect(worklet);
      worklet.connect(audioContext.destination);

      console.log('[Deepgram] Microphone started');
    } catch (error) {
      console.error('[Deepgram] Microphone error:', error);
      const err = error as Error;
      setMicrophoneError(err);
      onErrorRef.current?.(err);
      // FIX: Re-throw error so caller can handle it
      throw err;
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    console.log('[Deepgram] Microphone stopped');
  }, []);

  const disconnect = useCallback(() => {
    console.log('[Deepgram] Disconnecting...');
    stopMicrophone();

    // FIX: Clear keepalive from ref instead of connection object
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }

    if (connectionRef.current) {
      try { connectionRef.current.finish(); } catch {}
      connectionRef.current = null;
    }

    isConnectingRef.current = false;
    setIsConnected(false);
  }, [stopMicrophone]);

  // FIX: Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current);
        keepaliveRef.current = null;
      }
      if (connectionRef.current) {
        try { connectionRef.current.finish(); } catch {}
        connectionRef.current = null;
      }
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    connect,
    disconnect,
    startMicrophone,
    stopMicrophone,
    isConnected,
    microphoneError, // FIX: Expose error state
  };
}
