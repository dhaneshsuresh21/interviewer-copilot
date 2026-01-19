// Simplified FSM - only manages state transitions
// No timers, no refs, no side effects
// Deepgram handles utterance boundaries, we just track conversation phase

export type ConversationState =
  | 'IDLE'
  | 'LISTENING'
  | 'HAS_QUESTION'
  | 'HAS_ANSWER'
  | 'ANALYZING';

export type ConversationEvent =
  | 'START'
  | 'QUESTION_RECEIVED'
  | 'ANSWER_RECEIVED'
  | 'ANALYZE'
  | 'ANALYSIS_DONE'
  | 'RESET'
  | 'END';

export class ConversationStateMachine {
  private state: ConversationState = 'IDLE';

  getState(): ConversationState {
    return this.state;
  }

  dispatch(event: ConversationEvent): ConversationState {
    const prev = this.state;
    this.state = this.transition(this.state, event);
    
    if (prev !== this.state) {
      console.log(`[FSM] ${prev} -> ${this.state} (${event})`);
    }
    
    return this.state;
  }

  private transition(state: ConversationState, event: ConversationEvent): ConversationState {
    const transitions: Record<ConversationState, Partial<Record<ConversationEvent, ConversationState>>> = {
      'IDLE': {
        'START': 'LISTENING',
      },
      'LISTENING': {
        'QUESTION_RECEIVED': 'HAS_QUESTION',
        'END': 'IDLE',
      },
      'HAS_QUESTION': {
        'ANSWER_RECEIVED': 'HAS_ANSWER',
        'QUESTION_RECEIVED': 'HAS_QUESTION', // New question replaces old
        'END': 'IDLE',
      },
      'HAS_ANSWER': {
        'ANALYZE': 'ANALYZING',
        'QUESTION_RECEIVED': 'HAS_QUESTION', // Interviewer moved on
        'ANSWER_RECEIVED': 'HAS_ANSWER', // More answer content
        'END': 'IDLE',
      },
      'ANALYZING': {
        'ANALYSIS_DONE': 'LISTENING',
        'QUESTION_RECEIVED': 'HAS_QUESTION', // Interrupt
        'END': 'IDLE',
      },
    };

    return transitions[state]?.[event] ?? state;
  }

  canAnalyze(): boolean {
    return this.state === 'HAS_ANSWER';
  }

  isAnalyzing(): boolean {
    return this.state === 'ANALYZING';
  }

  hasQuestion(): boolean {
    return this.state === 'HAS_QUESTION' || this.state === 'HAS_ANSWER';
  }

  reset(): void {
    this.state = 'IDLE';
  }
}
