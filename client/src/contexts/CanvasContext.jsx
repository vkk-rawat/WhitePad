import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CanvasContext = createContext(null);

export const CanvasProvider = ({ children }) => {
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [opacity, setOpacity] = useState(1);
    const [strokes, setStrokes] = useState([]);
    const [users, setUsers] = useState([]);
    const [cursors, setCursors] = useState({});

    const undoStack = useRef([]);
    const redoStack = useRef([]);

    const addStroke = useCallback((stroke) => {
        const newStroke = {
            id: uuidv4(),
            ...stroke,
            timestamp: Date.now()
        };
        setStrokes(prev => [...prev, newStroke]);
        undoStack.current.push(newStroke);
        redoStack.current = [];
        return newStroke;
    }, []);

    const removeStroke = useCallback((strokeId) => {
        setStrokes(prev => prev.filter(s => s.id !== strokeId));
    }, []);

    const addRemoteStroke = useCallback((stroke) => {
        setStrokes(prev => [...prev, stroke]);
    }, []);

    const loadStrokes = useCallback((strokesData) => {
        setStrokes(strokesData);
        undoStack.current = [...strokesData];
        redoStack.current = [];
    }, []);

    const clearCanvas = useCallback(() => {
        setStrokes([]);
        undoStack.current = [];
        redoStack.current = [];
    }, []);

    const undo = useCallback(() => {
        if (undoStack.current.length === 0) return null;

        const lastStroke = undoStack.current.pop();
        redoStack.current.push(lastStroke);
        setStrokes(prev => prev.filter(s => s.id !== lastStroke.id));
        return lastStroke;
    }, []);

    const redo = useCallback(() => {
        if (redoStack.current.length === 0) return null;

        const stroke = redoStack.current.pop();
        undoStack.current.push(stroke);
        setStrokes(prev => [...prev, stroke]);
        return stroke;
    }, []);

    const updateUsers = useCallback((usersData) => {
        setUsers(usersData);
    }, []);

    const addUser = useCallback((user) => {
        setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    }, []);

    const removeUser = useCallback((userId) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setCursors(prev => {
            const newCursors = { ...prev };
            delete newCursors[userId];
            return newCursors;
        });
    }, []);

    const updateCursor = useCallback((userId, position, userName, cursorColor) => {
        setCursors(prev => ({
            ...prev,
            [userId]: { position, userName, cursorColor }
        }));
    }, []);

    const value = {
        tool,
        setTool,
        color,
        setColor,
        strokeWidth,
        setStrokeWidth,
        opacity,
        setOpacity,
        strokes,
        addStroke,
        removeStroke,
        addRemoteStroke,
        loadStrokes,
        clearCanvas,
        undo,
        redo,
        users,
        updateUsers,
        addUser,
        removeUser,
        cursors,
        updateCursor,
        canUndo: undoStack.current.length > 0,
        canRedo: redoStack.current.length > 0
    };

    return (
        <CanvasContext.Provider value={value}>
            {children}
        </CanvasContext.Provider>
    );
};

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvas must be used within a CanvasProvider');
    }
    return context;
};

export default CanvasContext;
