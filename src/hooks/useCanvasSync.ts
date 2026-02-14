/**
 * useCanvasSync - Hook for real-time collaborative canvas via WebSocket.
 * Also exposes the WebSocket ref for use by other hooks (presence, typing).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DrawEvent {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    color: string;
    size: number;
    tool: 'pen' | 'eraser';
}

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useCanvasSync(roomId: string, userId: string, displayName: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const onDrawRef = useRef<((data: DrawEvent) => void) | null>(null);
    const onClearRef = useRef<(() => void) | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(
            `${WS_BASE}/ws/room/${roomId}?user_id=${userId}&display_name=${encodeURIComponent(displayName)}`
        );

        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'canvas-draw' && message.drawData) {
                onDrawRef.current?.(message.drawData);
            } else if (message.type === 'canvas-clear') {
                onClearRef.current?.();
            }
            // Other message types (presence-update, typing-start, etc.)
            // are handled by their respective hooks via wsRef
        };

        wsRef.current = ws;
    }, [roomId, userId, displayName]);

    const sendDraw = useCallback((drawData: DrawEvent) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'canvas-draw', drawData }));
        }
    }, []);

    const sendClear = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'canvas-clear' }));
        }
    }, []);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        wsRef.current = null;
        setIsConnected(false);
    }, []);

    useEffect(() => {
        return () => { disconnect(); };
    }, [disconnect]);

    return {
        wsRef,  // Exposed for presence/typing hooks
        isConnected,
        connect,
        disconnect,
        sendDraw,
        sendClear,
        onDrawRef,
        onClearRef,
    };
}
