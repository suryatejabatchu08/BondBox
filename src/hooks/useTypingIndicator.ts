import { useEffect, useRef, useCallback, useState } from 'react';

interface TypingUser {
    userId: string;
    displayName: string;
}

interface UseTypingIndicatorOptions {
    roomId: string;
    userId: string;
    wsRef: React.MutableRefObject<WebSocket | null>;
}

/**
 * Hook that broadcasts typing status over the room WebSocket
 * and tracks who else is currently typing.
 */
export function useTypingIndicator({ userId, wsRef }: UseTypingIndicatorOptions) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTyping = useRef(false);

    // Send typing-start with debounce
    const startTyping = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        if (!isTyping.current) {
            isTyping.current = true;
            wsRef.current.send(JSON.stringify({ type: 'typing-start' }));
        }

        // Reset the stop timer
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        // Auto-stop after 3 seconds of no typing
        typingTimeout.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    }, [wsRef]);

    // Send typing-stop
    const stopTyping = useCallback(() => {
        if (!isTyping.current) return;
        isTyping.current = false;

        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'typing-stop' }));
        }
    }, [wsRef]);

    // Listen for typing events from others
    useEffect(() => {
        const ws = wsRef.current;
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'typing-start' && data.userId !== userId) {
                    setTypingUsers((prev) => {
                        // Don't add duplicates
                        if (prev.some((u) => u.userId === data.userId)) return prev;
                        return [...prev, { userId: data.userId, displayName: data.displayName }];
                    });

                    // Auto-remove after 4 seconds (server TTL is 3s)
                    setTimeout(() => {
                        setTypingUsers((prev) =>
                            prev.filter((u) => u.userId !== data.userId)
                        );
                    }, 4000);
                }

                if (data.type === 'typing-stop' && data.userId !== userId) {
                    setTypingUsers((prev) =>
                        prev.filter((u) => u.userId !== data.userId)
                    );
                }
            } catch {
                // Ignore parse errors
            }
        };

        ws.addEventListener('message', handleMessage);
        return () => ws.removeEventListener('message', handleMessage);
    }, [wsRef, userId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTyping();
        };
    }, [stopTyping]);

    // Format typing text
    const typingText =
        typingUsers.length === 0
            ? ''
            : typingUsers.length === 1
                ? `${typingUsers[0].displayName} is typing...`
                : typingUsers.length === 2
                    ? `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing...`
                    : `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing...`;

    return {
        typingUsers,
        typingText,
        startTyping,
        stopTyping,
        isAnyoneTyping: typingUsers.length > 0,
    };
}
