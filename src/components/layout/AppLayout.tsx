import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import MoodCheckModal from '../../features/mood/MoodCheckModal';
import NotificationPanel from './NotificationPanel';
import { Bell, Search, Smile } from 'lucide-react';
import PixelSnow from '../ui/PixelSnow';

const MOOD_MAP: Record<string, { emoji: string; color: string; bg: string }> = {
    motivated: { emoji: '🔥', color: '#e4e4e7', bg: 'rgba(255,255,255,0.06)' },
    happy: { emoji: '😊', color: '#e4e4e7', bg: 'rgba(255,255,255,0.06)' },
    calm: { emoji: '🧘', color: '#e4e4e7', bg: 'rgba(255,255,255,0.06)' },
    tired: { emoji: '😴', color: '#a1a1aa', bg: 'rgba(255,255,255,0.04)' },
    stressed: { emoji: '😰', color: '#a1a1aa', bg: 'rgba(255,255,255,0.04)' },
    confused: { emoji: '🤔', color: '#a1a1aa', bg: 'rgba(255,255,255,0.04)' },
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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b' }}>
            <PixelSnow count={60} maxOpacity={0.08} speed={0.3} />
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

            <div
                style={{
                    flex: 1,
                    marginLeft: collapsed ? 68 : 240,
                    transition: 'margin-left 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Top Bar */}
                <header
                    style={{
                        height: 56,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 24px',
                        background: 'rgba(9, 9, 11, 0.9)',
                        backdropFilter: 'blur(16px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 30,
                    }}
                >
                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: 320 }}>
                        <Search
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 14,
                                height: 14,
                                color: '#52525b',
                            }}
                        />
                        <input
                            className="input"
                            placeholder="Search rooms, friends..."
                            style={{ paddingLeft: 32, width: 280, fontSize: 12, height: 34 }}
                        />
                    </div>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Mood Indicator */}
                        <button
                            onClick={() => setShowMood(true)}
                            className="badge"
                            style={{
                                background: mood?.bg || 'rgba(255,255,255,0.04)',
                                color: mood?.color || '#71717a',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                            }}
                        >
                            {mood ? (
                                <>
                                    {mood.emoji} {profile?.current_mood}
                                </>
                            ) : (
                                <>
                                    <Smile style={{ width: 13, height: 13 }} /> Set mood
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
                                        ? 'rgba(99, 102, 241, 0.1)'
                                        : 'rgba(255,255,255,0.04)',
                                    border: showNotifications
                                        ? '1px solid rgba(99, 102, 241, 0.2)'
                                        : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }}
                            >
                                <Bell style={{
                                    width: 16,
                                    height: 16,
                                    color: showNotifications ? '#a5b4fc' : '#71717a',
                                }} />
                                {unreadCount > 0 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: -3,
                                            right: -3,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: 8,
                                            background: '#6366f1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 9,
                                            fontWeight: 600,
                                            color: 'white',
                                            padding: '0 3px',
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
                <main style={{ flex: 1, padding: 24 }}>
                    <Outlet />
                </main>
            </div>

            {showMood && <MoodCheckModal onClose={() => setShowMood(false)} />}
        </div>
    );
}
