import { Router } from 'express';

const router = Router();

// Simple in-memory user store (in production, use a database)
const users = [
  { username: 'interviewer', password: 'demo123', name: 'Demo Interviewer' },
  { username: 'john', password: 'pass123', name: 'John Smith' },
  { username: 'sarah', password: 'pass123', name: 'Sarah Johnson' },
];

// Login endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user info (excluding password)
    res.json({
      username: user.username,
      name: user.name
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
router.post('/auth/logout', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/auth/me', async (req, res) => {
  try {
    // In a real app, you'd verify a session token here
    res.json({ authenticated: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
