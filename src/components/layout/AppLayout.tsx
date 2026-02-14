import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import MoodCheckModal from '../../features/mood/MoodCheckModal';
import NotificationPanel from './NotificationPanel';
import { Bell, Search, Smile } from 'lucide-react';

const MOOD_MAP: Record<string, { emoji: string; color: string; bg: string }> = {
    motivated: { emoji: '🔥', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    happy: { emoji: '😊', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    calm: { emoji: '🧘', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    tired: { emoji: '😴', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    stressed: { emoji: '😰', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    confused: { emoji: '🤔', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
};

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [showMood, setShowMood] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { profile } = useAuthStore();

    const mood = profile?.current_mood ? MOOD_MAP[profile.current_mood] : null;

    const handleUnreadCountChange = useCallback((count: number) => {
        setUnreadCount(count);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0a1e' }}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

            <div
                style={{
                    flex: 1,
                    marginLeft: collapsed ? 72 : 260,
                    transition: 'margin-left 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Top Bar */}
                <header
                    style={{
                        height: 64,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 28px',
                        background: 'rgba(15, 10, 30, 0.8)',
                        backdropFilter: 'blur(20px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 30,
                    }}
                >
                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: 360 }}>
                        <Search
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 16,
                                height: 16,
                                color: '#64748b',
                            }}
                        />
                        <input
                            className="input"
                            placeholder="Search rooms, friends..."
                            style={{ paddingLeft: 38, width: 320, fontSize: 13 }}
                        />
                    </div>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Mood Indicator */}
                        <button
                            onClick={() => setShowMood(true)}
                            className="badge"
                            style={{
                                background: mood?.bg || 'rgba(255,255,255,0.06)',
                                color: mood?.color || '#94a3b8',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {mood ? (
                                <>
                                    {mood.emoji} {profile?.current_mood}
                                </>
                            ) : (
                                <>
                                    <Smile style={{ width: 14, height: 14 }} /> Set mood
                                </>
                            )}
                        </button>

                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn-icon"
                                onClick={() => setShowNotifications(prev => !prev)}
                                style={{
                                    background: showNotifications
                                        ? 'rgba(168, 85, 247, 0.15)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: showNotifications
                                        ? '1px solid rgba(168, 85, 247, 0.3)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }}
                            >
                                <Bell style={{
                                    width: 18,
                                    height: 18,
                                    color: showNotifications ? '#d8b4fe' : '#94a3b8',
                                }} />
                                {unreadCount > 0 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            minWidth: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            background: '#a855f7',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: 'white',
                                            padding: '0 4px',
                                        }}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </div>
                                )}
                            </button>

                            <NotificationPanel
                                isOpen={showNotifications}
                                onClose={() => setShowNotifications(false)}
                                onUnreadCountChange={handleUnreadCountChange}
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main style={{ flex: 1, padding: 28 }}>
                    <Outlet />
                </main>
            </div>

            {showMood && <MoodCheckModal onClose={() => setShowMood(false)} />}
        </div>
    );
}
