import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { testDatabase } from './data/testDatabase.js';
import TestResult from './models/TestResult.js';
import protect from './middleware/authMiddleware.js';
import authRoutes  from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes  from './routes/userRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from the Vite dev server and any deployed frontend
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        process.env.FRONTEND_URL,  // set this in .env for production
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json());

// ─── Auth Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user',  userRoutes);

// ─── GET /api/tests — randomised question sets ──────────────────────────────
// Each module has up to 5 question sets; we pick one at random per request so
// that retakes always present a different set to the user.
app.get('/api/tests', (req, res) => {
    const randomised = testDatabase.map(module => {
        const sets = module.questionSets;
        if (sets && sets.length > 0) {
            const idx = Math.floor(Math.random() * sets.length);
            return { ...module, questions: sets[idx] };
        }
        return module;
    });
    res.json(randomised);
});

// ─── GET /api/tests/results — fetch results for logged-in user ────────────
app.get('/api/tests/results', protect, async (req, res) => {
    try {
        const results = await TestResult.find({ userId: req.user._id })
            .sort({ createdAt: -1 })   // newest first
            .lean();
        res.json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST /api/tests/results — save a new result for logged-in user ─────────
app.post('/api/tests/results', protect, async (req, res) => {
    try {
        const { testId, finalScore, maxScore, answers } = req.body;

        if (!testId) {
            return res.status(400).json({ error: 'Missing testId' });
        }

        const result = await TestResult.create({
            userId: req.user._id,
            testId,
            finalScore,
            maxScore,
            answers,
        });

        res.status(201).json({ message: 'Result saved successfully', resultId: result._id });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Accessible on local network at http://192.168.29.44:${PORT}`);
});
