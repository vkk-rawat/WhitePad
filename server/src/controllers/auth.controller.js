const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
};

// Register new user
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, password, and name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const user = new User({
            email: email.toLowerCase(),
            passwordHash: password,
            name
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        next(error);
    }
};

// Login user
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            userId: user._id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        next(error);
    }
};

// Get current user
const getMe = async (req, res) => {
    res.json({
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        preferences: req.user.preferences
    });
};

module.exports = { register, login, getMe };
