import { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import './Canvas.css';

const Canvas = ({ sessionId, onStrokeComplete, onCursorMove }) => {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const containerRef = useRef(null);
    const isDrawing = useRef(false);
    const currentPoints = useRef([]);
    const lastCursorUpdate = useRef(0);

    const {
        tool,
        color,
        strokeWidth,
        opacity,
        strokes,
        cursors
    } = useCanvas();

    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
    const isPanning = useRef(false);
    const lastPanPosition = useRef({ x: 0, y: 0 });

    // Setup canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const overlay = overlayRef.current;
        const container = containerRef.current;

        if (!canvas || !overlay || !container) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            overlay.width = rect.width * dpr;
            overlay.height = rect.height * dpr;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            const overlayCtx = overlay.getContext('2d');
            overlayCtx.scale(dpr, dpr);

            redrawCanvas();
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Redraw when strokes change
    useEffect(() => {
        redrawCanvas();
    }, [strokes, viewport]);

    // Draw cursors on overlay
    useEffect(() => {
        drawCursors();
    }, [cursors]);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Apply viewport transform
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.scale, viewport.scale);

        // Draw all strokes
        strokes.forEach(stroke => {
            drawStroke(ctx, stroke);
        });

        ctx.restore();
    }, [strokes, viewport]);

    const drawStroke = (ctx, stroke) => {
        if (!stroke.points || stroke.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = stroke.color || '#000000';
        ctx.lineWidth = stroke.strokeWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.opacity || 1;

        if (stroke.tool === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.3;
        } else if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        const points = stroke.points;
        ctx.moveTo(points[0].x, points[0].y);

        // Use quadratic curves for smoother lines
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        // Last point
        if (points.length > 1) {
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawCursors = useCallback(() => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const ctx = overlay.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);

        Object.entries(cursors).forEach(([userId, cursor]) => {
            const { position, userName, cursorColor } = cursor;

            // Transform cursor position
            const x = position.x * viewport.scale + viewport.x;
            const y = position.y * viewport.scale + viewport.y;

            // Draw cursor
            ctx.fillStyle = cursorColor || '#4ECDC4';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 12, y + 10);
            ctx.lineTo(x + 6, y + 10);
            ctx.lineTo(x + 6, y + 16);
            ctx.lineTo(x, y);
            ctx.fill();

            // Draw name label
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = cursorColor || '#4ECDC4';
            ctx.fillText(userName || 'Anonymous', x + 14, y + 14);
        });
    }, [cursors, viewport]);

    const getCanvasPoint = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Account for viewport transform
        const x = (clientX - rect.left - viewport.x) / viewport.scale;
        const y = (clientY - rect.top - viewport.y) / viewport.scale;

        return { x, y, pressure: e.pressure || 1 };
    };

    const handlePointerDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle mouse or Alt+click for panning
            isPanning.current = true;
            lastPanPosition.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (tool === 'pan') {
            isPanning.current = true;
            lastPanPosition.current = { x: e.clientX, y: e.clientY };
            return;
        }

        isDrawing.current = true;
        currentPoints.current = [getCanvasPoint(e)];

        // Draw initial point
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.scale, viewport.scale);

        const point = currentPoints.current[0];
        ctx.beginPath();
        ctx.arc(point.x, point.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = tool === 'highlighter' ? 0.3 : opacity;
        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        }
        ctx.fill();
        ctx.restore();
    };

    const handlePointerMove = (e) => {
        const point = getCanvasPoint(e);

        // Update cursor position (throttled)
        const now = Date.now();
        if (now - lastCursorUpdate.current > 16 && onCursorMove) {
            lastCursorUpdate.current = now;
            onCursorMove({ x: point.x, y: point.y });
        }

        if (isPanning.current) {
            const dx = e.clientX - lastPanPosition.current.x;
            const dy = e.clientY - lastPanPosition.current.y;
            setViewport(prev => ({
                ...prev,
                x: prev.x + dx,
                y: prev.y + dy
            }));
            lastPanPosition.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (!isDrawing.current) return;

        currentPoints.current.push(point);

        // Draw current line segment
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const points = currentPoints.current;

        if (points.length < 2) return;

        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.scale, viewport.scale);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = tool === 'highlighter' ? 0.3 : opacity;

        if (tool === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
        } else if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        }

        const lastTwo = points.slice(-2);
        ctx.moveTo(lastTwo[0].x, lastTwo[0].y);
        ctx.lineTo(lastTwo[1].x, lastTwo[1].y);
        ctx.stroke();

        ctx.restore();
    };

    const handlePointerUp = () => {
        if (isPanning.current) {
            isPanning.current = false;
            return;
        }

        if (!isDrawing.current) return;

        isDrawing.current = false;

        if (currentPoints.current.length > 0 && onStrokeComplete) {
            onStrokeComplete({
                tool,
                color,
                strokeWidth,
                opacity: tool === 'highlighter' ? 0.3 : opacity,
                points: currentPoints.current
            });
        }

        currentPoints.current = [];
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(viewport.scale * delta, 0.1), 4);

        // Zoom toward cursor position
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setViewport(prev => ({
            scale: newScale,
            x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
            y: mouseY - (mouseY - prev.y) * (newScale / prev.scale)
        }));
    };

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
            <canvas
                ref={overlayRef}
                className="overlay-canvas"
            />
        </div>
    );
};

export default Canvas;
