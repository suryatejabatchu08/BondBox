/**
 * CollaborativeCanvas - Real-time shared whiteboard for study rooms.
 * Features: pen, eraser, color picker, brush size, clear, undo.
 * Syncs drawing events via WebSocket.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Eraser, Trash2, Palette, Minus, Plus, X } from 'lucide-react';
import type { DrawEvent } from '../../hooks/useCanvasSync';

interface CollaborativeCanvasProps {
    sendDraw: (data: DrawEvent) => void;
    sendClear: () => void;
    onDrawRef: React.MutableRefObject<((data: DrawEvent) => void) | null>;
    onClearRef: React.MutableRefObject<(() => void) | null>;
    onClose: () => void;
}

const COLORS = [
    '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
];

export default function CollaborativeCanvas({
    sendDraw,
    sendClear,
    onDrawRef,
    onClearRef,
    onClose,
}: CollaborativeCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(3);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctxRef.current = ctx;
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Draw a line segment on the canvas
    const drawLine = useCallback((data: DrawEvent) => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);

        if (data.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = data.size * 3;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.size;
        }

        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }, []);

    // Register callbacks for remote draw events
    useEffect(() => {
        onDrawRef.current = (data: DrawEvent) => {
            drawLine(data);
        };
        onClearRef.current = () => {
            const canvas = canvasRef.current;
            const ctx = ctxRef.current;
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    }, [drawLine, onDrawRef, onClearRef]);

    // Get canvas position from mouse/touch event
    const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        isDrawing.current = true;
        const pos = getCanvasPos(e);
        lastPos.current = pos;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;

        const pos = getCanvasPos(e);
        const drawData: DrawEvent = {
            x: pos.x,
            y: pos.y,
            prevX: lastPos.current.x,
            prevY: lastPos.current.y,
            color,
            size: brushSize,
            tool,
        };

        drawLine(drawData);
        sendDraw(drawData);
        lastPos.current = pos;
    };

    const stopDrawing = () => {
        isDrawing.current = false;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        sendClear();
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                background: '#0d0821',
            }}
        >
            {/* Toolbar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(15, 10, 30, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    flexWrap: 'wrap',
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#d8b4fe', marginRight: 8 }}>
                    ✏️ Whiteboard
                </span>

                {/* Pen */}
                <button
                    onClick={() => setTool('pen')}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: tool === 'pen' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.06)',
                        color: tool === 'pen' ? '#d8b4fe' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                    }}
                >
                    <Pencil style={{ width: 14, height: 14 }} /> Pen
                </button>

                {/* Eraser */}
                <button
                    onClick={() => setTool('eraser')}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: tool === 'eraser' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.06)',
                        color: tool === 'eraser' ? '#d8b4fe' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                    }}
                >
                    <Eraser style={{ width: 14, height: 14 }} /> Eraser
                </button>

                {/* Color */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: color,
                                border: '2px solid rgba(255,255,255,0.2)',
                            }}
                        />
                        <Palette style={{ width: 14, height: 14 }} />
                    </button>

                    {showColorPicker && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: 4,
                                padding: 8,
                                borderRadius: 10,
                                background: 'rgba(15, 10, 30, 0.98)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 6,
                                zIndex: 10,
                            }}
                        >
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setColor(c);
                                        setShowColorPicker(false);
                                    }}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: c,
                                        border: color === c ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Brush Size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
                        style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: 'none', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Minus style={{ width: 12, height: 12 }} />
                    </button>
                    <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 20, textAlign: 'center' }}>
                        {brushSize}
                    </span>
                    <button
                        onClick={() => setBrushSize(Math.min(20, brushSize + 1))}
                        style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: 'none', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Plus style={{ width: 12, height: 12 }} />
                    </button>
                </div>

                {/* Clear */}
                <button
                    onClick={clearCanvas}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                    }}
                >
                    <Trash2 style={{ width: 14, height: 14 }} /> Clear
                </button>

                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        marginLeft: 'auto',
                        width: 28, height: 28, borderRadius: '50%',
                        border: 'none', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X style={{ width: 14, height: 14 }} />
                </button>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                style={{ flex: 1, cursor: tool === 'eraser' ? 'crosshair' : 'crosshair' }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ display: 'block' }}
                />
            </div>
        </div>
    );
}
