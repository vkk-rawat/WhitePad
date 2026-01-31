const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    strokeId: {
        type: String,
        required: true,
        unique: true
    },
    tool: {
        type: String,
        enum: ['pen', 'highlighter', 'eraser', 'rectangle', 'circle', 'line', 'arrow', 'text'],
        required: true
    },
    points: [{
        x: Number,
        y: Number,
        pressure: {
            type: Number,
            default: 1
        },
        timestamp: Number
    }],
    color: {
        type: String,
        default: '#000000'
    },
    strokeWidth: {
        type: Number,
        default: 3
    },
    opacity: {
        type: Number,
        default: 1
    },
    fillColor: String,
    text: String,
    fontSize: Number,
    fontFamily: String,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

// Compound index for efficient querying
strokeSchema.index({ sessionId: 1, createdAt: -1 });
strokeSchema.index({ sessionId: 1, deleted: 1 });

module.exports = mongoose.model('Stroke', strokeSchema);
