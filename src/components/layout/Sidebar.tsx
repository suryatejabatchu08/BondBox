import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    LayoutDashboard,
    DoorOpen,
    Users,
    Gamepad2,
    Heart,
    Trophy,
    BookOpen,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Coins,
    Zap,
    History,
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const NAV_ITEMS = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/rooms', icon: DoorOpen, label: 'Study Rooms' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/games', icon: Gamepad2, label: 'Mini Games' },
    { path: '/appreciation', icon: Heart, label: 'Appreciation' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/activity', icon: Zap, label: 'XP History' },
    { path: '/room-history', icon: History, label: 'Room History' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const navigate = useNavigate();
    const { profile, signOut } = useAuthStore();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <aside
            style={{
                width: collapsed ? 68 : 240,
                minHeight: '100vh',
                background: '#0c0c0e',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.25s ease',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 40,
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: collapsed ? '18px 14px' : '18px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <BookOpen style={{ width: 18, height: 18, color: 'white' }} />
                </div>
                {!collapsed && (
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em' }}>
                        Bond<span style={{ color: '#818cf8' }}>Box</span>
                    </span>
                )}
            </div>

            {/* User Card */}
            {profile && (
                <div
                    style={{
                        padding: collapsed ? '14px 10px' : '14px 18px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-placeholder" style={{ flexShrink: 0, width: 34, height: 34, fontSize: 14 }}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.display_name} />
                            ) : (
                                profile.display_name.charAt(0).toUpperCase()
                            )}
                        </div>
                        {!collapsed && (
                            <div style={{ overflow: 'hidden' }}>
                                <p
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#e4e4e7',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {profile.display_name}
                                </p>
                                <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                                    <span style={{ fontSize: 11, color: '#71717a', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Zap style={{ width: 10, height: 10, color: '#6366f1' }} />
                                        {profile.xp} XP
                                    </span>
                                    <span style={{ fontSize: 11, color: '#71717a', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Coins style={{ width: 10, height: 10, color: '#a1a1aa' }} />
                                        {profile.room_coins}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Nav Items */}
            <nav style={{ flex: 1, padding: '10px 6px' }}>
                {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: collapsed ? '10px' : '8px 12px',
                            borderRadius: 8,
                            marginBottom: 2,
                            textDecoration: 'none',
                            color: isActive ? '#e4e4e7' : '#71717a',
                            background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            transition: 'all 0.15s ease',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            fontSize: 13,
                        })}
                    >
                        <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                        {!collapsed && <span style={{ fontWeight: 500 }}>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div style={{ padding: '10px 6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={handleSignOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: collapsed ? '10px' : '8px 12px',
                        borderRadius: 8,
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: '#71717a',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        fontSize: 13,
                    }}
                >
                    <LogOut style={{ width: 18, height: 18 }} />
                    {!collapsed && 'Sign Out'}
                </button>

                <button
                    onClick={onToggle}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '7px',
                        borderRadius: 8,
                        width: '100%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#52525b',
                        cursor: 'pointer',
                        marginTop: 4,
                    }}
                >
                    {collapsed ? <ChevronRight style={{ width: 16, height: 16 }} /> : <ChevronLeft style={{ width: 16, height: 16 }} />}
                </button>
            </div>
        </aside>
    );
}
