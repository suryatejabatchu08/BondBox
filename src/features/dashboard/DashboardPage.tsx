import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import type { StudyRoom } from '../../types/database';
import {
    DoorOpen,
    Users,
    Gamepad2,
    Heart,
    Zap,
    Clock,
    Plus,
    ArrowRight,
    BookOpen,
    Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
    const { profile } = useAuthStore();
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [stats, setStats] = useState({ totalSessions: 0, totalFriends: 0, doubtsHelped: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!profile) return;

        // Load user's active rooms
        const { data: memberData } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('user_id', profile.id)
            .is('left_at', null);

        if (memberData && memberData.length > 0) {
            const roomIds = memberData.map((m) => m.room_id);
            const { data: roomData } = await supabase
                .from('study_rooms')
                .select('*')
                .in('id', roomIds)
                .eq('is_active', true);
            if (roomData) setRooms(roomData as StudyRoom[]);
        }

        // Load stats
        const { count: friendCount } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
            .eq('status', 'accepted');

        const { count: helpCount } = await supabase
            .from('doubts')
            .select('*', { count: 'exact', head: true })
            .eq('helper_id', profile.id)
            .eq('status', 'resolved');

        setStats({
            totalSessions: profile.xp,
            totalFriends: friendCount || 0,
            doubtsHelped: helpCount || 0,
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const ROOM_TYPE_COLORS: Record<string, string> = {
        silent: '#3b82f6',
        doubt_solving: '#6366f1',
        group_revision: '#22c55e',
        exam_night: '#eab308',
    };

    return (
        <div className="animate-fade-in">
            {/* Welcome Section */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fafafa', marginBottom: 4, letterSpacing: '-0.025em' }}>
                    {getGreeting()}, {profile?.display_name || 'Student'} 👋
                </h1>
                <p style={{ fontSize: 14, color: '#71717a' }}>Ready to study with friends today?</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Total XP', value: profile?.xp || 0, icon: Zap, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
                    { label: 'Friends', value: stats.totalFriends, icon: Users, color: '#a1a1aa', bg: 'rgba(255, 255, 255, 0.04)' },
                    { label: 'Doubts Helped', value: stats.doubtsHelped, icon: Heart, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
                    { label: 'Room Coins', value: profile?.room_coins || 0, icon: Sparkles, color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon style={{ width: 22, height: 22, color }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>{value}</p>
                            <p style={{ fontSize: 11, color: '#52525b' }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
                <Link to="/rooms" style={{ textDecoration: 'none' }}>
                    <div className="card card-glow" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: '#6366f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Plus style={{ width: 22, height: 22, color: 'white' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Create Study Room</p>
                            <p style={{ fontSize: 12, color: '#52525b' }}>Start a new session with friends</p>
                        </div>
                        <ArrowRight style={{ width: 18, height: 18, color: '#64748b' }} />
                    </div>
                </Link>

                <Link to="/games" style={{ textDecoration: 'none' }}>
                    <div className="card card-glow" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: '#22c55e',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Gamepad2 style={{ width: 22, height: 22, color: 'white' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Play Mini Games</p>
                            <p style={{ fontSize: 12, color: '#52525b' }}>Take a fun study break</p>
                        </div>
                        <ArrowRight style={{ width: 18, height: 18, color: '#64748b' }} />
                    </div>
                </Link>
            </div>

            {/* Active Rooms */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DoorOpen style={{ width: 18, height: 18, color: '#6366f1' }} />
                        Your Active Rooms
                    </h2>
                    <Link to="/rooms" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                        View All →
                    </Link>
                </div>

                {rooms.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                        <BookOpen style={{ width: 36, height: 36, color: '#52525b', margin: '0 auto 12px' }} />
                        <p style={{ color: '#71717a', marginBottom: 8, fontSize: 13 }}>No active rooms yet</p>
                        <Link to="/rooms">
                            <button className="btn btn-primary btn-sm">Create Your First Room</button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {rooms.slice(0, 4).map((room) => (
                            <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                                <div className="card card-glow" style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>{room.name}</h3>
                                        <span
                                            className="badge"
                                            style={{
                                                background: `${ROOM_TYPE_COLORS[room.room_type]}20`,
                                                color: ROOM_TYPE_COLORS[room.room_type],
                                                border: `1px solid ${ROOM_TYPE_COLORS[room.room_type]}30`,
                                            }}
                                        >
                                            {room.room_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {room.subject && (
                                        <p style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>
                                            📚 {room.subject} {room.topic && `• ${room.topic}`}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#52525b' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock style={{ width: 12, height: 12 }} />
                                            {room.timer_duration}m work / {room.break_duration}m break
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            Code: {room.room_code}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
