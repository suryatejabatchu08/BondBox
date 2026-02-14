import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
    Bell,
    UserPlus,
    HelpCircle,
    Heart,
    DoorOpen,
    Gamepad2,
    Info,
    Check,
    X,
} from 'lucide-react';

interface NotificationItem {
    id: string;
    type: 'friend_request' | 'doubt_help' | 'appreciation' | 'room_invite' | 'game_invite' | 'system';
    title: string;
    message: string | null;
    is_read: boolean;
    created_at: string;
}

const TYPE_ICONS: Record<NotificationItem['type'], typeof Bell> = {
    friend_request: UserPlus,
    doubt_help: HelpCircle,
    appreciation: Heart,
    room_invite: DoorOpen,
    game_invite: Gamepad2,
    system: Info,
};

const TYPE_COLORS: Record<NotificationItem['type'], string> = {
    friend_request: '#a855f7',
    doubt_help: '#10b981',
    appreciation: '#f43f5e',
    room_invite: '#3b82f6',
    game_invite: '#f97316',
    system: '#64748b',
};

function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange: (count: number) => void;
}

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }: NotificationPanelProps) {
    const { profile } = useAuthStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose]);

    // Load notifications when opened
    useEffect(() => {
        if (isOpen && profile) {
            loadNotifications();
        }
    }, [isOpen, profile]);

    // Poll for unread count every 30s
    useEffect(() => {
        if (!profile) return;
        const fetchCount = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);
            onUnreadCountChange(count || 0);
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [profile]);

    const loadNotifications = async () => {
        if (!profile) return;
        setLoading(true);

        const { data } = await supabase
            .from('notifications')
            .select('id, type, title, message, is_read, created_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (data) {
            setNotifications(data as NotificationItem[]);
            const unread = data.filter(n => !n.is_read).length;
            onUnreadCountChange(unread);
        }
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        onUnreadCountChange(notifications.filter(n => !n.is_read && n.id !== id).length);
    };

    const markAllRead = async () => {
        if (!profile) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', profile.id)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        onUnreadCountChange(0);
    };

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            style={{
                position: 'absolute',
                top: 52,
                right: 0,
                width: 380,
                maxHeight: 480,
                background: '#1a1333',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell style={{ width: 16, height: 16, color: '#a855f7' }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Notifications</h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={markAllRead}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 11,
                                color: '#a855f7',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            padding: 0,
                        }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {loading ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                        <Bell style={{ width: 32, height: 32, color: '#475569', margin: '0 auto 8px' }} />
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>No notifications yet</p>
                        <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                            You'll see friend requests, room invites, and more here
                        </p>
                    </div>
                ) : (
                    notifications.map(n => {
                        const Icon = TYPE_ICONS[n.type] || Bell;
                        const color = TYPE_COLORS[n.type] || '#64748b';
                        return (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    padding: '10px 16px',
                                    cursor: n.is_read ? 'default' : 'pointer',
                                    background: n.is_read ? 'transparent' : 'rgba(168, 85, 247, 0.04)',
                                    borderLeft: n.is_read ? '3px solid transparent' : `3px solid ${color}`,
                                    transition: 'background 0.2s',
                                }}
                            >
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    minWidth: 32,
                                    borderRadius: '50%',
                                    background: `${color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 2,
                                }}>
                                    <Icon style={{ width: 14, height: 14, color }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: 13,
                                        fontWeight: n.is_read ? 400 : 600,
                                        color: n.is_read ? '#94a3b8' : 'white',
                                        marginBottom: 2,
                                    }}>
                                        {n.title}
                                    </p>
                                    {n.message && (
                                        <p style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {n.message}
                                        </p>
                                    )}
                                    <p style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
                                        {timeAgo(n.created_at)}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: color,
                                        marginTop: 8,
                                        flexShrink: 0,
                                    }} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
