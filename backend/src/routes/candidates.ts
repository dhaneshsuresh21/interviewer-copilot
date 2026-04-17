import { Router, Request, Response } from 'express';
import { prismaStorageService as storageService } from '../services/prismaStorageService';

const router = Router();

/**
 * GET /api/candidates/lookup
 * Query params: email, phone
 * Returns sessions from the last 6 months that match the email or phone.
 */
router.get('/candidates/lookup', async (req: Request, res: Response) => {
  const email = (req.query.email as string | undefined)?.trim().toLowerCase();
  const phone = (req.query.phone as string | undefined)?.trim();

  if (!email && !phone) {
    return res.status(400).json({ error: 'At least one of email or phone is required' });
  }

  try {
    const sessions = await storageService.lookupCandidateSessions({ email, phone, withinMonths: 6 });
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
