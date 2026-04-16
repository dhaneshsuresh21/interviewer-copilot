import { Router, Request, Response } from 'express';
import { transcriptLogger } from '../utils/logger';

const router = Router();

/**
 * POST /api/logs/transcript
 *
 * Receives structured log entries from the frontend and writes them to
 * logs/transcript.log via winston.
 *
 * Expected body shape (all fields optional except `event`):
 * {
 *   event:        string,          // e.g. "TRANSCRIPT", "INTENT", "UTTERANCE_END", "FSM"
 *   sessionId?:   string,
 *   text?:        string,          // raw transcript text
 *   isFinal?:     boolean,
 *   speechFinal?: boolean,
 *   confidence?:  number,
 *   wordCount?:   number,
 *   intent?:      string,          // classifyIntent result
 *   intentConf?:  number,
 *   reason?:      string,
 *   isQuestion?:  boolean,
 *   isAnswer?:    boolean,
 *   fsmState?:    string,
 *   trigger?:     boolean,
 *   triggerReason?: string,
 *   silenceMs?:   number,
 *   meta?:        object,          // any extra fields
 * }
 */
router.post('/logs/transcript', (req: Request, res: Response) => {
  const body = req.body;

  if (!body || !body.event) {
    return res.status(400).json({ error: 'Missing required field: event' });
  }

  const { event, ...rest } = body;

  transcriptLogger.info(event, rest);

  res.status(204).end();
});

export default router;
