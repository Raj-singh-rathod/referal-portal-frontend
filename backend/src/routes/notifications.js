const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const list = await notificationService.getUserNotifications(req.user.id);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
