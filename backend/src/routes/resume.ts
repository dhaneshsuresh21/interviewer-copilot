import { Router, Request, Response } from 'express';
import multer from 'multer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and plain text files are accepted'));
    }
  }
});

/**
 * POST /api/resume/parse
 * Accepts a multipart/form-data upload with field name "resume".
 * Returns { text: string } — extracted plain text from the file.
 */
router.post('/resume/parse', upload.single('resume'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    let text = '';

    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    const trimmed = text.replace(/\s+/g, ' ').trim();
    res.json({ text: trimmed });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to parse resume: ${error.message}` });
  }
});

export default router;
