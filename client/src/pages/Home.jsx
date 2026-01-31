import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/api';
import './Home.css';

const Home = () => {
    const [sessions, setSessions] = useState([]);
    const [newSessionName, setNewSessionName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            loadSessions();
        }
    }, [isAuthenticated]);

    const loadSessions = async () => {
        try {
            const data = await sessionService.getMySessions();
            setSessions(data.sessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const session = await sessionService.createSession(newSessionName || 'Untitled Whiteboard');
            navigate(`/whiteboard/${session.sessionId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSession = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const session = await sessionService.getSessionByInvite(joinCode);
            navigate(`/whiteboard/${session.sessionId}`);
        } catch (err) {
            setError('Session not found. Check the invite code.');
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!confirm('Are you sure you want to delete this whiteboard?')) return;

        try {
            await sessionService.deleteSession(sessionId);
            setSessions(sessions.filter(s => s.sessionId !== sessionId));
        } catch (err) {
            setError('Failed to delete session');
        }
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <h1 className="home-logo">🎨 White Pad</h1>
                <div className="home-nav">
                    {isAuthenticated ? (
                        <>
                            <span className="user-greeting">Hello, {user?.name}</span>
                            <button onClick={logout} className="btn-secondary">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary">Sign In</Link>
                            <Link to="/register" className="btn-primary">Sign Up</Link>
                        </>
                    )}
                </div>
            </header>

            <main className="home-main">
                <div className="hero-section">
                    <h2>Real-Time Collaborative Whiteboard</h2>
                    <p>Create, draw, and collaborate with your team in real-time.</p>
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>✨ Create New Whiteboard</h3>
                        <form onSubmit={handleCreateSession}>
                            <input
                                type="text"
                                placeholder="Whiteboard name (optional)"
                                value={newSessionName}
                                onChange={e => setNewSessionName(e.target.value)}
                            />
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Whiteboard'}
                            </button>
                        </form>
                    </div>

                    <div className="action-card">
                        <h3>🔗 Join Existing Whiteboard</h3>
                        <form onSubmit={handleJoinSession}>
                            <input
                                type="text"
                                placeholder="Enter invite code"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-secondary">
                                Join Whiteboard
                            </button>
                        </form>
                    </div>
                </div>

                {error && <div className="home-error">{error}</div>}

                {isAuthenticated && sessions.length > 0 && (
                    <div className="sessions-section">
                        <h3>📋 Your Whiteboards</h3>
                        <div className="sessions-grid">
                            {sessions.map(session => (
                                <div key={session.sessionId} className="session-card">
                                    <div className="session-info">
                                        <h4>{session.name}</h4>
                                        <p>Created {new Date(session.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="session-actions">
                                        <button
                                            onClick={() => navigate(`/whiteboard/${session.sessionId}`)}
                                            className="btn-small"
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.sessionId)}
                                            className="btn-small danger"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer className="home-footer">
                <p>Built with MERN Stack + Socket.IO</p>
            </footer>
        </div>
    );
};

export default Home;
