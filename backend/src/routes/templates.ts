import { Router } from 'express';
import { prismaStorageService as storageService } from '../services/prismaStorageService';

const router = Router();

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await storageService.getTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await storageService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/templates', async (req, res) => {
  try {
    const template = await storageService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const template = await storageService.updateTemplate(req.params.id, req.body);
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    await storageService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
