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
                width: collapsed ? 72 : 260,
                minHeight: '100vh',
                background: 'rgba(15, 10, 30, 0.95)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 40,
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: collapsed ? '20px 16px' : '20px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #a855f7, #f97316)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <BookOpen style={{ width: 20, height: 20, color: 'white' }} />
                </div>
                {!collapsed && (
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                        Bond<span style={{ color: '#a855f7' }}>Box</span>
                    </span>
                )}
            </div>

            {/* User Card */}
            {profile && (
                <div
                    style={{
                        padding: collapsed ? '16px 12px' : '16px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-placeholder" style={{ flexShrink: 0 }}>
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
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: 'white',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {profile.display_name}
                                </p>
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Zap style={{ width: 11, height: 11, color: '#f97316' }} />
                                        {profile.xp} XP
                                    </span>
                                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Coins style={{ width: 11, height: 11, color: '#fbbf24' }} />
                                        {profile.room_coins}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Nav Items */}
            <nav style={{ flex: 1, padding: '12px 8px' }}>
                {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: collapsed ? '12px' : '10px 14px',
                            borderRadius: 12,
                            marginBottom: 4,
                            textDecoration: 'none',
                            color: isActive ? '#d8b4fe' : '#94a3b8',
                            background: isActive ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                            transition: 'all 0.2s ease',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        })}
                    >
                        <Icon style={{ width: 20, height: 20, flexShrink: 0 }} />
                        {!collapsed && <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                    onClick={handleSignOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: collapsed ? '12px' : '10px 14px',
                        borderRadius: 12,
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        fontSize: 14,
                    }}
                >
                    <LogOut style={{ width: 20, height: 20 }} />
                    {!collapsed && 'Sign Out'}
                </button>

                <button
                    onClick={onToggle}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        borderRadius: 10,
                        width: '100%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#64748b',
                        cursor: 'pointer',
                        marginTop: 4,
                    }}
                >
                    {collapsed ? <ChevronRight style={{ width: 18, height: 18 }} /> : <ChevronLeft style={{ width: 18, height: 18 }} />}
                </button>
            </div>
        </aside>
    );
}
