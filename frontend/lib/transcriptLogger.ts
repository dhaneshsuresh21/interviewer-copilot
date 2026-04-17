import { API_BASE_URL } from './constants';

export type LogEvent =
  | 'TRANSCRIPT'
  | 'UTTERANCE_FINALIZED'
  | 'INTENT_CLASSIFIED'
  | 'UTTERANCE_END'
  | 'FSM_TRANSITION'
  | 'TRIGGER_DECISION'
  | 'ANALYSIS_TRIGGERED'
  | 'DEEPGRAM_CONNECTED'
  | 'DEEPGRAM_DISCONNECTED'
  | 'DEEPGRAM_ERROR';

export interface TranscriptLogEntry {
  event: LogEvent;
  sessionId?: string;
  text?: string;
  isFinal?: boolean;
  speechFinal?: boolean;
  confidence?: number;
  wordCount?: number;
  intent?: string;
  intentConf?: number;
  reason?: string;
  isQuestion?: boolean;
  isAnswer?: boolean;
  fsmState?: string;
  trigger?: boolean;
  triggerReason?: string;
  silenceMs?: number;
  meta?: Record<string, unknown>;
}

/**
 * Fire-and-forget POST to the backend log endpoint.
 * Failures are silently swallowed so logging never breaks the main flow.
 */
export function logTranscriptEvent(entry: TranscriptLogEntry): void {
  fetch(`${API_BASE_URL}/api/logs/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {
    // intentionally silent — log failures must not affect the interview
  });
}
