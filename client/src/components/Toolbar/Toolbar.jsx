import { useCanvas } from '../../contexts/CanvasContext';
import './Toolbar.css';

const tools = [
    { id: 'pen', icon: '✏️', label: 'Pen' },
    { id: 'highlighter', icon: '🖍️', label: 'Highlighter' },
    { id: 'eraser', icon: '🧹', label: 'Eraser' },
    { id: 'pan', icon: '✋', label: 'Pan' }
];

const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
];

const strokeWidths = [2, 4, 6, 10, 16, 24];

const Toolbar = ({ onUndo, onRedo, onClear, canUndo, canRedo }) => {
    const {
        tool,
        setTool,
        color,
        setColor,
        strokeWidth,
        setStrokeWidth
    } = useCanvas();

    return (
        <div className="toolbar">
            <div className="toolbar-section">
                <div className="toolbar-label">Tools</div>
                <div className="tool-buttons">
                    {tools.map(t => (
                        <button
                            key={t.id}
                            className={`tool-btn ${tool === t.id ? 'active' : ''}`}
                            onClick={() => setTool(t.id)}
                            title={t.label}
                        >
                            {t.icon}
                        </button>
                    ))}
                </div>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-section">
                <div className="toolbar-label">Colors</div>
                <div className="color-grid">
                    {colors.map(c => (
                        <button
                            key={c}
                            className={`color-btn ${color === c ? 'active' : ''}`}
                            style={{
                                backgroundColor: c,
                                border: c === '#ffffff' ? '1px solid #ddd' : 'none'
                            }}
                            onClick={() => setColor(c)}
                            title={c}
                        />
                    ))}
                </div>
                <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="color-picker"
                    title="Custom color"
                />
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-section">
                <div className="toolbar-label">Size: {strokeWidth}px</div>
                <div className="size-buttons">
                    {strokeWidths.map(size => (
                        <button
                            key={size}
                            className={`size-btn ${strokeWidth === size ? 'active' : ''}`}
                            onClick={() => setStrokeWidth(size)}
                            title={`${size}px`}
                        >
                            <span
                                className="size-indicator"
                                style={{
                                    width: Math.min(size, 20),
                                    height: Math.min(size, 20)
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-section">
                <div className="toolbar-label">Actions</div>
                <div className="action-buttons">
                    <button
                        className="action-btn"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        ↩️ Undo
                    </button>
                    <button
                        className="action-btn"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        ↪️ Redo
                    </button>
                    <button
                        className="action-btn danger"
                        onClick={onClear}
                        title="Clear canvas"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
