import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});

// Endpoint to provide Deepgram API key to frontend
router.get('/deepgram/key', limiter, (req: Request, res: Response) => {
  try {
    if (!config.deepgramApiKey) {
      console.error('Deepgram API key not configured');
      return res.status(500).json({ error: 'Deepgram API key not configured' });
    }

    console.log('Providing Deepgram API key to frontend');

    res.json({
      apiKey: config.deepgramApiKey,
    });
  } catch (error) {
    console.error('Error in /deepgram/key route:', error);
    res.status(500).json({ error: 'Failed to provide Deepgram API key' });
  }
});

export default router;
