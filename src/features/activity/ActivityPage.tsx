import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
    Zap,
    Gamepad2,
    HelpCircle,
    Heart,
    Clock,
    TrendingUp,
    Coins,
} from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'quiz' | 'math' | 'doubt_helped' | 'appreciation';
    title: string;
    description: string;
    xpEarned: number;
    coinsEarned: number;
    timestamp: string;
}

const TYPE_CONFIG: Record<ActivityItem['type'], {
    icon: typeof Zap;
    color: string;
    bg: string;
    label: string;
}> = {
    quiz: {
        icon: Gamepad2,
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        label: 'Quiz Battle',
    },
    math: {
        icon: TrendingUp,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        label: 'Math Duel',
    },
    doubt_helped: {
        icon: HelpCircle,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        label: 'Doubt Helped',
    },
    appreciation: {
        icon: Heart,
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.12)',
        label: 'Appreciation',
    },
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

export default function ActivityPage() {
    const { profile } = useAuthStore();
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadActivity();
    }, [profile]);

    const loadActivity = async () => {
        if (!profile) return;
        setLoading(true);
        const activities: ActivityItem[] = [];

        // 1. Game scores (quiz & math)
        const { data: gameScores } = await supabase
            .from('game_scores')
            .select('id, game_session_id, score, coins_earned, created_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (gameScores) {
            // Get game session types
            const sessionIds = [...new Set(gameScores.map(g => g.game_session_id))];
            const { data: sessions } = await supabase
                .from('game_sessions')
                .select('id, game_type')
                .in('id', sessionIds.length > 0 ? sessionIds : ['_']);

            const sessionTypeMap = new Map(sessions?.map(s => [s.id, s.game_type]) || []);

            for (const gs of gameScores) {
                const gameType = sessionTypeMap.get(gs.game_session_id);
                const isQuiz = gameType === 'quiz_battle';
                const xpMultiplier = isQuiz ? 5 : 8;
                const coinMultiplier = isQuiz ? 2 : 3;

                activities.push({
                    id: `game-${gs.id}`,
                    type: isQuiz ? 'quiz' : 'math',
                    title: isQuiz ? 'Quiz Battle' : 'Math Duel',
                    description: `Scored ${gs.score} points`,
                    xpEarned: (gs.score || 0) * xpMultiplier,
                    coinsEarned: gs.coins_earned || (gs.score || 0) * coinMultiplier,
                    timestamp: gs.created_at,
                });
            }
        }

        // 2. Doubts helped
        const { data: doubtsHelped } = await supabase
            .from('doubts')
            .select('id, title, created_at')
            .eq('helper_id', profile.id)
            .eq('status', 'resolved')
            .order('created_at', { ascending: false })
            .limit(30);

        if (doubtsHelped) {
            for (const d of doubtsHelped) {
                activities.push({
                    id: `doubt-${d.id}`,
                    type: 'doubt_helped',
                    title: 'Helped with a doubt',
                    description: d.title || 'Resolved a doubt',
                    xpEarned: 15,
                    coinsEarned: 5,
                    timestamp: d.created_at,
                });
            }
        }

        // 3. Appreciations received
        const { data: appreciations } = await supabase
            .from('appreciations')
            .select('id, message, sticker_type, created_at')
            .eq('receiver_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (appreciations) {
            for (const a of appreciations) {
                activities.push({
                    id: `appr-${a.id}`,
                    type: 'appreciation',
                    title: 'Received appreciation',
                    description: a.message || `${a.sticker_type || 'Kind'} sticker`,
                    xpEarned: 10,
                    coinsEarned: 0,
                    timestamp: a.created_at,
                });
            }
        }

        // Sort by time descending
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setItems(activities);
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <p style={{ color: '#94a3b8' }}>Loading activity...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap style={{ width: 24, height: 24, color: '#f97316' }} />
                    XP &amp; Activity History
                </h1>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>Track how you earned your XP and coins</p>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#f97316' }}>{profile?.xp || 0}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total XP</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>{profile?.room_coins || 0}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total Coins</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#a855f7' }}>{items.length}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Activities</p>
                </div>
            </div>

            {/* Timeline */}
            {items.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <Zap style={{ width: 40, height: 40, color: '#475569', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94a3b8', marginBottom: 4 }}>No activity yet</p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>Play games, help with doubts, and earn XP!</p>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    {/* Timeline line */}
                    <div style={{
                        position: 'absolute',
                        left: 20,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: 'linear-gradient(to bottom, rgba(168,85,247,0.3), rgba(168,85,247,0.05))',
                    }} />

                    {items.map((item) => {
                        const cfg = TYPE_CONFIG[item.type];
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    gap: 16,
                                    marginBottom: 4,
                                    position: 'relative',
                                    paddingLeft: 0,
                                }}
                            >
                                {/* Dot on timeline */}
                                <div style={{
                                    width: 42,
                                    minWidth: 42,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    paddingTop: 18,
                                    zIndex: 1
                                }}>
                                    <div style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: '50%',
                                        background: cfg.bg,
                                        border: `2px solid ${cfg.color}40`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Icon style={{ width: 16, height: 16, color: cfg.color }} />
                                    </div>
                                </div>

                                {/* Card */}
                                <div
                                    className="card"
                                    style={{
                                        flex: 1,
                                        padding: '14px 16px',
                                        marginBottom: 0,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <div>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5,
                                                color: cfg.color,
                                            }}>
                                                {cfg.label}
                                            </span>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'white', marginTop: 2 }}>
                                                {item.title}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {item.xpEarned > 0 && (
                                                <span style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#f97316',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 3,
                                                }}>
                                                    <Zap style={{ width: 12, height: 12 }} />+{item.xpEarned}
                                                </span>
                                            )}
                                            {item.coinsEarned > 0 && (
                                                <span style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#fbbf24',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 3,
                                                }}>
                                                    <Coins style={{ width: 12, height: 12 }} />+{item.coinsEarned}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#94a3b8' }}>{item.description}</p>
                                    <p style={{ fontSize: 11, color: '#475569', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock style={{ width: 10, height: 10 }} />
                                        {timeAgo(item.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
