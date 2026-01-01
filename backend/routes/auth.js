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

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
