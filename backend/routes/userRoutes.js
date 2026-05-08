import express from 'express';
import AdminMessage from '../models/AdminMessage.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// ── GET /api/user/messages — messages for logged-in user ─────────────────────
router.get('/messages', async (req, res) => {
    try {
        const msgs = await AdminMessage.find({ toUserId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
        res.json(msgs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── PATCH /api/user/messages/:id/read — mark as read ─────────────────────────
router.patch('/messages/:id/read', async (req, res) => {
    try {
        const msg = await AdminMessage.findOneAndUpdate(
            { _id: req.params.id, toUserId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!msg) return res.status(404).json({ message: 'Message not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
