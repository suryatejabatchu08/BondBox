import { useState, useEffect } from 'react';
import { Trophy, Zap, Coins, Medal, Crown, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface LeaderboardUser {
    id: string;
    display_name: string;
    avatar_url: string | null;
    xp: number;
    teaching_xp: number;
    room_coins: number;
}

type Tab = 'xp' | 'teaching' | 'coins';

export default function LeaderboardPage() {
    const { profile } = useAuthStore();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('xp');

    useEffect(() => {
        fetchLeaderboard();
    }, [activeTab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        const orderBy = activeTab === 'xp' ? 'xp' : activeTab === 'teaching' ? 'teaching_xp' : 'room_coins';

        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, xp, teaching_xp, room_coins')
            .order(orderBy, { ascending: false })
            .limit(50);

        if (!error && data) {
            setUsers(data as LeaderboardUser[]);
        }
        setLoading(false);
    };

    const tabs: { key: Tab; label: string; icon: typeof Zap; color: string }[] = [
        { key: 'xp', label: 'XP', icon: Zap, color: '#f97316' },
        { key: 'teaching', label: 'Teaching XP', icon: Star, color: '#a855f7' },
        { key: 'coins', label: 'Coins', icon: Coins, color: '#fbbf24' },
    ];

    const getValue = (user: LeaderboardUser) => {
        if (activeTab === 'xp') return user.xp;
        if (activeTab === 'teaching') return user.teaching_xp;
        return user.room_coins;
    };

    const getRankIcon = (rank: number) => {
        if (rank === 0) return <Crown style={{ width: 22, height: 22, color: '#fbbf24' }} />;
        if (rank === 1) return <Medal style={{ width: 22, height: 22, color: '#c0c0c0' }} />;
        if (rank === 2) return <Medal style={{ width: 22, height: 22, color: '#cd7f32' }} />;
        return null;
    };

    const getRankBg = (rank: number) => {
        if (rank === 0) return 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.05))';
        if (rank === 1) return 'linear-gradient(135deg, rgba(192, 192, 192, 0.12), rgba(148, 163, 184, 0.04))';
        if (rank === 2) return 'linear-gradient(135deg, rgba(205, 127, 50, 0.12), rgba(180, 83, 9, 0.04))';
        return 'transparent';
    };

    // Find current user's rank
    const myRank = users.findIndex((u) => u.id === profile?.id);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Trophy style={{ width: 24, height: 24, color: '#fbbf24' }} />
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Leaderboard</h1>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>
                    See who's on top! Earn XP by studying, teaching, and playing games 🏆
                </p>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 24,
                    padding: 4,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 14,
                    width: 'fit-content',
                }}
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: isActive ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                                color: isActive ? tab.color : '#64748b',
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Icon style={{ width: 15, height: 15 }} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* My Rank Card */}
            {myRank >= 0 && (
                <div
                    className="card"
                    style={{
                        marginBottom: 20,
                        padding: '14px 20px',
                        background: 'rgba(168, 85, 247, 0.08)',
                        borderColor: 'rgba(168, 85, 247, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 600 }}>Your Rank</span>
                        <span
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: 'white',
                            }}
                        >
                            #{myRank + 1}
                        </span>
                    </div>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>
                        {getValue(users[myRank]).toLocaleString()}{' '}
                        {activeTab === 'coins' ? 'coins' : activeTab === 'teaching' ? 'teaching XP' : 'XP'}
                    </span>
                </div>
            )}

            {/* Leaderboard List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No data yet</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {users.map((user, index) => {
                        const isMe = user.id === profile?.id;
                        return (
                            <div
                                key={user.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    padding: '12px 16px',
                                    borderRadius: 14,
                                    background: getRankBg(index),
                                    border: isMe
                                        ? '1px solid rgba(168, 85, 247, 0.3)'
                                        : '1px solid rgba(255,255,255,0.04)',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {/* Rank */}
                                <div
                                    style={{
                                        width: 36,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {getRankIcon(index) || (
                                        <span
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: '#64748b',
                                            }}
                                        >
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div
                                    className="avatar avatar-placeholder"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        flexShrink: 0,
                                        fontSize: 14,
                                    }}
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.display_name}
                                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                        />
                                    ) : (
                                        user.display_name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {/* Name */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p
                                        style={{
                                            fontSize: 14,
                                            fontWeight: isMe ? 700 : 500,
                                            color: isMe ? '#d8b4fe' : 'white',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {user.display_name}
                                        {isMe && (
                                            <span style={{ fontSize: 11, color: '#a855f7', marginLeft: 6 }}>
                                                (You)
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Value */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color:
                                                activeTab === 'xp'
                                                    ? '#f97316'
                                                    : activeTab === 'teaching'
                                                        ? '#a855f7'
                                                        : '#fbbf24',
                                        }}
                                    >
                                        {getValue(user).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
