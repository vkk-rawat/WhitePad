const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const Stroke = require('../models/Stroke');

// Create new session
const createSession = async (req, res, next) => {
    try {
        const { name, isPublic, maxUsers } = req.body;

        const session = new Session({
            sessionId: uuidv4(),
            name: name || 'Untitled Whiteboard',
            createdBy: req.userId,
            isPublic: isPublic || false,
            maxUsers: maxUsers || 10,
            inviteCode: uuidv4().substring(0, 8)
        });

        await session.save();

        res.status(201).json({
            sessionId: session.sessionId,
            name: session.name,
            inviteCode: session.inviteCode,
            createdAt: session.createdAt,
            settings: session.settings
        });
    } catch (error) {
        next(error);
    }
};

// Get session by ID
const getSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findOne({ sessionId }).populate('createdBy', 'name email');
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({
            sessionId: session.sessionId,
            name: session.name,
            createdBy: session.createdBy,
            createdAt: session.createdAt,
            isPublic: session.isPublic,
            settings: session.settings
        });
    } catch (error) {
        next(error);
    }
};

// Get session by invite code
const getSessionByInvite = async (req, res, next) => {
    try {
        const { inviteCode } = req.params;

        const session = await Session.findOne({ inviteCode });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({
            sessionId: session.sessionId,
            name: session.name
        });
    } catch (error) {
        next(error);
    }
};

// Get session history (strokes)
const getSessionHistory = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { limit = 1000 } = req.query;

        const strokes = await Stroke.find({
            sessionId,
            deleted: false
        })
            .sort({ createdAt: 1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            strokes,
            totalCount: strokes.length
        });
    } catch (error) {
        next(error);
    }
};

// Get user's sessions
const getUserSessions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const sessions = await Session.find({ createdBy: req.userId })
            .sort({ lastActivityAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalCount = await Session.countDocuments({ createdBy: req.userId });

        res.json({
            sessions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / limit),
                totalCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete session
const deleteSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.createdBy.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this session' });
        }

        // Delete session and all strokes
        await Session.deleteOne({ sessionId });
        await Stroke.deleteMany({ sessionId });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSession,
    getSession,
    getSessionByInvite,
    getSessionHistory,
    getUserSessions,
    deleteSession
};
