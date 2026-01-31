import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.sessionId = null;
    }

    connect(token = null) {
        if (this.socket?.connected) return;

        this.socket = io('/', {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            if (this.sessionId) {
                this.rejoinSession();
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.sessionId = null;
        }
    }

    joinSession(sessionId, userName) {
        if (!this.socket) return;

        this.sessionId = sessionId;
        this.userName = userName;

        this.socket.emit('join-session', {
            sessionId,
            userName
        });
    }

    rejoinSession() {
        if (this.sessionId && this.userName) {
            this.joinSession(this.sessionId, this.userName);
        }
    }

    drawStroke(sessionId, stroke) {
        if (!this.socket) return;

        this.socket.emit('draw-stroke', {
            sessionId,
            stroke
        });
    }

    moveCursor(sessionId, position) {
        if (!this.socket) return;

        this.socket.emit('cursor-move', {
            sessionId,
            position
        });
    }

    undo(sessionId, strokeId) {
        if (!this.socket) return;

        this.socket.emit('undo', {
            sessionId,
            strokeId
        });
    }

    redo(sessionId, strokeId) {
        if (!this.socket) return;

        this.socket.emit('redo', {
            sessionId,
            strokeId
        });
    }

    clearCanvas(sessionId) {
        if (!this.socket) return;

        this.socket.emit('clear-canvas', {
            sessionId
        });
    }

    on(event, callback) {
        if (!this.socket) return;
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) return;
        this.socket.off(event, callback);
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
export default socketService;
