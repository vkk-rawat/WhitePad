import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCanvas } from '../contexts/CanvasContext';
import { sessionService } from '../services/api';
import socketService from '../services/socket';
import Canvas from '../components/Canvas/Canvas';
import Toolbar from '../components/Toolbar/Toolbar';
import UserList from '../components/UserList/UserList';
import './Whiteboard.css';

const Whiteboard = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token, isAuthenticated } = useAuth();
    const {
        addStroke,
        addRemoteStroke,
        removeStroke,
        loadStrokes,
        clearCanvas,
        undo,
        redo,
        users,
        updateUsers,
        addUser,
        removeUser,
        updateCursor
    } = useCanvas();

    const [sessionInfo, setSessionInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadSession();
        return () => {
            socketService.disconnect();
        };
    }, [sessionId]);

    const loadSession = async () => {
        try {
            const session = await sessionService.getSession(sessionId);
            setSessionInfo(session);

            const history = await sessionService.getSessionHistory(sessionId);
            loadStrokes(history.strokes);

            // Connect to socket
            socketService.connect(token);
            socketService.joinSession(sessionId, user?.name || 'Anonymous');

            setupSocketListeners();
            setLoading(false);
        } catch (err) {
            console.error('Failed to load session:', err);
            setError('Failed to load whiteboard');
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        socketService.on('session-state', (data) => {
            loadStrokes(data.strokes);
            updateUsers(data.users);
        });

        socketService.on('user-joined', (data) => {
            addUser({
                id: data.userId,
                name: data.userName,
                cursorColor: data.cursorColor
            });
        });

        socketService.on('user-left', (data) => {
            removeUser(data.userId);
        });

        socketService.on('stroke-drawn', (data) => {
            addRemoteStroke(data.stroke);
        });

        socketService.on('cursor-update', (data) => {
            updateCursor(data.userId, data.position, data.userName, data.cursorColor);
        });

        socketService.on('stroke-undone', (data) => {
            removeStroke(data.strokeId);
        });

        socketService.on('stroke-redone', (data) => {
            if (data.stroke) {
                addRemoteStroke(data.stroke);
            }
        });

        socketService.on('canvas-cleared', () => {
            clearCanvas();
        });

        socketService.on('error', (data) => {
            setError(data.message);
        });
    };

    const handleStrokeComplete = useCallback((strokeData) => {
        const stroke = addStroke(strokeData);
        socketService.drawStroke(sessionId, stroke);
    }, [sessionId, addStroke]);

    const handleCursorMove = useCallback((position) => {
        socketService.moveCursor(sessionId, position);
    }, [sessionId]);

    const handleUndo = useCallback(() => {
        const stroke = undo();
        if (stroke) {
            socketService.undo(sessionId, stroke.id);
        }
    }, [sessionId, undo]);

    const handleRedo = useCallback(() => {
        const stroke = redo();
        if (stroke) {
            socketService.redo(sessionId, stroke.id);
        }
    }, [sessionId, redo]);

    const handleClear = useCallback(() => {
        if (confirm('Are you sure you want to clear the canvas?')) {
            clearCanvas();
            socketService.clearCanvas(sessionId);
        }
    }, [sessionId, clearCanvas]);

    const copyInviteLink = () => {
        const link = `${window.location.origin}/whiteboard/${sessionId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    handleUndo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    if (loading) {
        return (
            <div className="whiteboard-loading">
                <div className="loading-spinner" />
                <p>Loading whiteboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="whiteboard-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    return (
        <div className="whiteboard-container">
            <header className="whiteboard-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back
                    </button>
                    <h1 className="session-name">{sessionInfo?.name}</h1>
                </div>
                <div className="header-right">
                    <button className="share-btn" onClick={copyInviteLink}>
                        {copied ? '✓ Copied!' : '🔗 Share'}
                    </button>
                </div>
            </header>

            <Toolbar
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                canUndo={true}
                canRedo={true}
            />

            <div className="whiteboard-canvas-area">
                <Canvas
                    sessionId={sessionId}
                    onStrokeComplete={handleStrokeComplete}
                    onCursorMove={handleCursorMove}
                />
                <UserList users={users} />
            </div>
        </div>
    );
};

export default Whiteboard;
