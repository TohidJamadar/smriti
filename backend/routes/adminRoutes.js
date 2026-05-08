import express from 'express';
import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import AdminMessage from '../models/AdminMessage.js';
import protect, { adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ── MODULE META (mirrors frontend MODULE_META) ────────────────────────────────
const MODULE_META = {
    'mindcheck-full':        { label: 'General Cognitive',     domains: { Memory: 0.3, Language: 0.4, Attention: 0.3 } },
    'executive-us-standard': { label: 'Executive Function',    domains: { Executive: 0.5, Attention: 0.3, Memory: 0.2 } },
    'spatial-dynamics':      { label: 'Spatial & Reaction',   domains: { Spatial: 0.6, Reaction: 0.4 } },
    'ai-semantic':           { label: 'AI Clinical Interview', domains: { Language: 0.5, Executive: 0.3, Memory: 0.2 } },
    'alzheimers-extended':   { label: "Alzheimer's Battery",  domains: { Memory: 0.5, Language: 0.3, Attention: 0.2 } },
};
const DOMAINS = ['Memory', 'Attention', 'Language', 'Executive', 'Spatial', 'Reaction'];

function pct(score, max) { return max > 0 ? Math.round((score / max) * 100) : 0; }

function computeDomainScores(results) {
    const moduleGroups = {};
    results.forEach(r => { (moduleGroups[r.testId] = moduleGroups[r.testId] || []).push(r); });
    return Object.fromEntries(DOMAINS.map(d => {
        const contrib = Object.keys(moduleGroups).flatMap(id => {
            const m = MODULE_META[id];
            if (!m?.domains[d]) return [];
            const best = Math.max(...moduleGroups[id].map(r => pct(r.finalScore, r.maxScore)));
            return [{ pct: best, w: m.domains[d] }];
        });
        if (!contrib.length) return [d, 0];
        const tw = contrib.reduce((s, x) => s + x.w, 0);
        return [d, Math.round(contrib.reduce((s, x) => s + x.pct * x.w, 0) / tw)];
    }));
}

// ── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password').lean();
        const allResults = await TestResult.find({
            userId: { $in: users.map(u => u._id) }
        }).lean();

        // Group results by userId
        const resultsByUser = {};
        allResults.forEach(r => {
            const key = r.userId.toString();
            (resultsByUser[key] = resultsByUser[key] || []).push(r);
        });

        const enriched = users.map(u => {
            const userResults = resultsByUser[u._id.toString()] || [];
            const allPcts = userResults
                .filter(r => r.maxScore > 0)
                .map(r => pct(r.finalScore, r.maxScore));
            const avgScore = allPcts.length
                ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length)
                : 0;
            const latestResult = userResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            const latestScore  = latestResult ? pct(latestResult.finalScore, latestResult.maxScore) : 0;
            const domainScores = computeDomainScores(userResults);
            const strengths    = DOMAINS.filter(d => domainScores[d] >= 70);
            const weakAreas    = DOMAINS.filter(d => domainScores[d] > 0 && domainScores[d] < 45);

            return {
                _id:          u._id,
                name:         u.name,
                email:        u.email,
                createdAt:    u.createdAt,
                lastActive:   latestResult?.createdAt || u.createdAt,
                totalTests:   userResults.length,
                avgScore,
                latestScore,
                domainScores,
                strengths,
                weakAreas,
                needsAttention: avgScore > 0 && avgScore < 45,
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error('Admin /users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── GET /api/admin/leaderboard?period=all|month|week ─────────────────────────
router.get('/leaderboard', async (req, res) => {
    try {
        const { period = 'all' } = req.query;
        const users = await User.find({ role: 'user' }).select('-password').lean();

        let dateFilter = {};
        if (period === 'week') {
            dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } };
        } else if (period === 'month') {
            dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } };
        }

        const results = await TestResult.find({
            userId: { $in: users.map(u => u._id) },
            ...dateFilter,
        }).lean();

        const resultsByUser = {};
        results.forEach(r => {
            const k = r.userId.toString();
            (resultsByUser[k] = resultsByUser[k] || []).push(r);
        });

        const ranked = users.map(u => {
            const ur = resultsByUser[u._id.toString()] || [];
            const allPcts = ur.filter(r => r.maxScore > 0).map(r => pct(r.finalScore, r.maxScore));
            const avgScore = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;
            // Trend: compare latest 2 tests
            const sorted = [...ur].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            let trend = 'stable';
            if (sorted.length >= 2) {
                const diff = pct(sorted[0].finalScore, sorted[0].maxScore) - pct(sorted[1].finalScore, sorted[1].maxScore);
                if (diff > 5) trend = 'improving';
                else if (diff < -5) trend = 'declining';
            }
            const badge = avgScore >= 75 ? 'Excellent' : avgScore >= 50 ? 'Stable' : avgScore > 0 ? 'Needs Attention' : 'Not Tested';
            return { _id: u._id, name: u.name, email: u.email, avgScore, totalTests: ur.length, trend, badge };
        })
        .filter(u => u.totalTests > 0)
        .sort((a, b) => b.avgScore - a.avgScore)
        .map((u, i) => ({ ...u, rank: i + 1 }));

        res.json(ranked);
    } catch (err) {
        console.error('Admin /leaderboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const totalUsers   = await User.countDocuments({ role: 'user' });
        const totalTests   = await TestResult.countDocuments();
        const allResults   = await TestResult.find({ maxScore: { $gt: 0 } }).lean();
        const allPcts      = allResults.map(r => pct(r.finalScore, r.maxScore));
        const avgPlatform  = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;

        // Domain averages across all users
        const users = await User.find({ role: 'user' }).select('_id').lean();
        const resultsByUser = {};
        allResults.forEach(r => { (resultsByUser[r.userId.toString()] = resultsByUser[r.userId.toString()] || []).push(r); });

        const domainTotals = Object.fromEntries(DOMAINS.map(d => [d, { sum: 0, count: 0 }]));
        users.forEach(u => {
            const ur = resultsByUser[u._id.toString()] || [];
            if (!ur.length) return;
            const ds = computeDomainScores(ur);
            DOMAINS.forEach(d => { if (ds[d] > 0) { domainTotals[d].sum += ds[d]; domainTotals[d].count++; } });
        });
        const avgDomains = Object.fromEntries(
            DOMAINS.map(d => [d, domainTotals[d].count ? Math.round(domainTotals[d].sum / domainTotals[d].count) : 0])
        );
        const weakestDomain = DOMAINS.reduce((w, d) => (avgDomains[d] > 0 && avgDomains[d] < (avgDomains[w] || 999) ? d : w), DOMAINS[0]);

        res.json({ totalUsers, totalTests, avgPlatform, avgDomains, weakestDomain });
    } catch (err) {
        console.error('Admin /stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── GET /api/admin/users/:id/results ─────────────────────────────────────────
router.get('/users/:id/results', async (req, res) => {
    try {
        const results = await TestResult.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean();
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── POST /api/admin/messages — send message to user ──────────────────────────
router.post('/messages', async (req, res) => {
    try {
        const { toUserId, subject, body } = req.body;
        if (!toUserId || !subject || !body) {
            return res.status(400).json({ message: 'toUserId, subject and body are required' });
        }
        const target = await User.findById(toUserId);
        if (!target || target.role === 'admin') {
            return res.status(404).json({ message: 'User not found' });
        }
        const msg = await AdminMessage.create({ toUserId, subject, body });
        res.status(201).json({ message: 'Message sent', id: msg._id });
    } catch (err) {
        console.error('Admin /messages POST error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── GET /api/admin/messages — list all sent messages ─────────────────────────
router.get('/messages', async (req, res) => {
    try {
        const msgs = await AdminMessage.find()
            .sort({ createdAt: -1 })
            .populate('toUserId', 'name email')
            .lean();
        res.json(msgs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
