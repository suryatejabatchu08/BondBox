import { useEffect, useRef, useState } from 'react';

interface UsePresenceOptions {
    roomId: string;
    userId: string;
    wsRef: React.MutableRefObject<WebSocket | null>;
}

/**
 * Hook that sends heartbeat pings over the existing room WebSocket
 * and tracks online users from presence-update messages.
 */
export function usePresence({ wsRef }: UsePresenceOptions) {
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Start heartbeat when connected
    useEffect(() => {
        const sendHeartbeat = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
            }
        };

        // Send immediately and then every 30 seconds
        sendHeartbeat();
        heartbeatInterval.current = setInterval(sendHeartbeat, 30_000);

        return () => {
            if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
            }
        };
    }, [wsRef]);

    // Listen for presence updates
    useEffect(() => {
        const ws = wsRef.current;
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'presence-update' && data.online) {
                    setOnlineUsers(data.online);
                }
            } catch {
                // Ignore parse errors
            }
        };

        ws.addEventListener('message', handleMessage);
        return () => ws.removeEventListener('message', handleMessage);
    }, [wsRef]);

    return { onlineUsers, onlineCount: onlineUsers.length };
}
