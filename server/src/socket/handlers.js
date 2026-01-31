const jwt = require('jsonwebtoken');
const config = require('../config');
const Stroke = require('../models/Stroke');
const Session = require('../models/Session');

// In-memory store for active sessions
const activeSessions = new Map();

// Get or create session room
const getSessionRoom = (sessionId) => {
    if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, {
            users: new Map(),
            strokes: []
        });
    }
    return activeSessions.get(sessionId);
};

// Verify JWT token for socket
const verifySocketToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        return null;
    }
};

// Initialize socket handlers
const initializeSocket = (io) => {
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            const decoded = verifySocketToken(token);
            if (decoded) {
                socket.userId = decoded.userId;
            }
        }
        // Allow anonymous users for public sessions
        next();
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join session
        socket.on('join-session', async (data) => {
            const { sessionId, userName } = data;

            if (!sessionId) {
                socket.emit('error', { message: 'Session ID required' });
                return;
            }

            // Check if session exists in database
            const session = await Session.findOne({ sessionId });
            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }

            socket.join(sessionId);
            socket.sessionId = sessionId;
            socket.userName = userName || 'Anonymous';
            socket.cursorColor = getRandomColor();

            const room = getSessionRoom(sessionId);
            room.users.set(socket.id, {
                id: socket.id,
                oderId: socket.userId,
                name: socket.userName,
                cursorColor: socket.cursorColor
            });

            // Notify others that user joined
            socket.to(sessionId).emit('user-joined', {
                oderId: socket.id,
                userName: socket.userName,
                cursorColor: socket.cursorColor,
                timestamp: Date.now()
            });

            // Send current session state to joining user
            const strokes = await Stroke.find({
                sessionId,
                deleted: false
            }).sort({ createdAt: 1 }).lean();

            const users = Array.from(room.users.values());

            socket.emit('session-state', {
                strokes,
                users,
                timestamp: Date.now()
            });

            console.log(`User ${socket.userName} joined session ${sessionId}`);
        });

        // Handle drawing stroke
        socket.on('draw-stroke', async (data) => {
            const { sessionId, stroke } = data;

            if (!sessionId || !stroke) return;

            try {
                // Save stroke to database
                const newStroke = new Stroke({
                    sessionId,
                    userId: socket.userId || null,
                    strokeId: stroke.id,
                    tool: stroke.tool,
                    points: stroke.points,
                    color: stroke.color,
                    strokeWidth: stroke.strokeWidth,
                    opacity: stroke.opacity
                });

                await newStroke.save();

                // Update session activity
                await Session.updateOne(
                    { sessionId },
                    { lastActivityAt: new Date() }
                );

                // Broadcast to other users
                socket.to(sessionId).emit('stroke-drawn', {
                    userId: socket.id,
                    userName: socket.userName,
                    stroke: {
                        ...stroke,
                        _id: newStroke._id
                    }
                });
            } catch (error) {
                console.error('Error saving stroke:', error);
            }
        });

        // Handle cursor movement
        socket.on('cursor-move', (data) => {
            const { sessionId, position } = data;

            if (!sessionId || !position) return;

            socket.to(sessionId).emit('cursor-update', {
                oderId: socket.id,
                userName: socket.userName,
                position,
                cursorColor: socket.cursorColor
            });
        });

        // Handle undo
        socket.on('undo', async (data) => {
            const { sessionId, strokeId } = data;

            if (!sessionId || !strokeId) return;

            try {
                await Stroke.updateOne(
                    { strokeId },
                    { deleted: true, deletedAt: new Date() }
                );

                socket.to(sessionId).emit('stroke-undone', {
                    strokeId,
                    userId: socket.id
                });
            } catch (error) {
                console.error('Error undoing stroke:', error);
            }
        });

        // Handle redo
        socket.on('redo', async (data) => {
            const { sessionId, strokeId } = data;

            if (!sessionId || !strokeId) return;

            try {
                await Stroke.updateOne(
                    { strokeId },
                    { deleted: false, deletedAt: null }
                );

                const stroke = await Stroke.findOne({ strokeId }).lean();

                socket.to(sessionId).emit('stroke-redone', {
                    stroke,
                    userId: socket.id
                });
            } catch (error) {
                console.error('Error redoing stroke:', error);
            }
        });

        // Handle clear canvas
        socket.on('clear-canvas', async (data) => {
            const { sessionId } = data;

            if (!sessionId) return;

            try {
                await Stroke.updateMany(
                    { sessionId },
                    { deleted: true, deletedAt: new Date() }
                );

                io.to(sessionId).emit('canvas-cleared', {
                    userId: socket.id,
                    userName: socket.userName,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error clearing canvas:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (socket.sessionId) {
                const room = getSessionRoom(socket.sessionId);
                room.users.delete(socket.id);

                socket.to(socket.sessionId).emit('user-left', {
                    oderId: socket.id,
                    userName: socket.userName,
                    timestamp: Date.now()
                });

                // Clean up empty sessions from memory
                if (room.users.size === 0) {
                    activeSessions.delete(socket.sessionId);
                }
            }
            console.log('Client disconnected:', socket.id);
        });
    });
};

// Generate random cursor color
const getRandomColor = () => {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8B500', '#FF6F61'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = { initializeSocket };
