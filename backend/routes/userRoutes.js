import express from 'express';
import AdminMessage from '../models/AdminMessage.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// ── GET /api/user/messages — messages for logged-in user ─────────────────────
router.get('/messages', async (req, res) => {
    try {
        // Return messages sorted newest first
        const msgs = [...(req.user.msg || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(msgs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── PATCH /api/user/message/:messageId/read — mark inline message as read ────
router.patch('/message/:messageId/read', async (req, res) => {
    try {
        const { messageId } = req.params;
        
        // Find the message inside the user document and update it
        const msgIndex = req.user.msg.findIndex(m => m._id.toString() === messageId);
        
        if (msgIndex === -1) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Update checked status
        req.user.msg[msgIndex].checked = true;
        
        // Save the updated user document
        await req.user.save();

        res.json({ success: true, message: 'Message marked as read' });
    } catch (err) {
        console.error('Mark as read error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── PATCH /api/user/messages/read-all — mark all inline messages as read ─────
router.patch('/messages/read-all', async (req, res) => {
    try {
        let updated = false;
        
        req.user.msg.forEach(m => {
            if (!m.checked) {
                m.checked = true;
                updated = true;
            }
        });

        if (updated) {
            await req.user.save();
        }

        // Return updated messages sorted newest first
        const msgs = [...(req.user.msg || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, messages: msgs });
    } catch (err) {
        console.error('Mark all read error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
