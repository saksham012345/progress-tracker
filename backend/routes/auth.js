const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email or username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // Sign Token (7 days expiry as requested)
        const token = jwt.sign(
            { id: savedUser._id },
            process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod', // Ideally from env
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Sign Token (7 days expiry)
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
            { expiresIn: '7d' }
        );

        // Update Streak and points on login
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);

        if (user.lastActivityDate) {
            const lastDate = new Date(user.lastActivityDate);
            // If last activity was yesterday, increment streak
            if (lastDate.toDateString() === yesterday.toDateString()) {
                user.streak += 1;
            } else if (lastDate.toDateString() !== now.toDateString()) {
                // If skipped a day, reset streak (but keep today if it's a new day)
                user.streak = 1;
            }
        } else {
            user.streak = 1;
        }

        user.lastActivityDate = now;
        user.points += 10; // 10 points for daily login
        // Check for level up
        user.level = Math.floor(user.points / 200) + 1;
        await user.save();

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                points: user.points,
                level: user.level,
                streak: user.streak
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current User Profile (Stats)
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Search Users (for adding to workspaces)
router.get('/search', require('../middleware/auth'), async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.json([]);
        }
        const users = await User.find({
            _id: { $ne: req.user.id }, // Exclude self
            username: { $regex: query, $options: 'i' }
        }).select('_id username email').limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
