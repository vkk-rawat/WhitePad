const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        default: 'Untitled Whiteboard'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    maxUsers: {
        type: Number,
        default: 10
    },
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    },
    settings: {
        canvasWidth: {
            type: Number,
            default: 3000
        },
        canvasHeight: {
            type: Number,
            default: 2000
        },
        backgroundColor: {
            type: String,
            default: '#ffffff'
        }
    }
}, {
    timestamps: true
});

// Update lastActivityAt on save
sessionSchema.pre('save', function (next) {
    this.lastActivityAt = new Date();
    next();
});

module.exports = mongoose.model('Session', sessionSchema);
