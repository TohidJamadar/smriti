import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/signup
export const signupUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`\n[AUTH DEBUG] Login attempt for email: ${email}`);

        // Check for user email
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`[AUTH DEBUG] User not found: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log(`[AUTH DEBUG] User found: ${user.email}, Role: ${user.role}`);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`[AUTH DEBUG] Password match result: ${isMatch}`);

        if (isMatch) {
            const token = generateToken(user._id);
            console.log(`[AUTH DEBUG] Login successful. Generated token.`);
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
            });
        } else {
            console.log(`[AUTH DEBUG] Password did not match for ${email}`);
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('[AUTH DEBUG] Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
