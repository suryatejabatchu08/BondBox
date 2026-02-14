import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
    History,
    Clock,
    DoorOpen,
    ArrowRight,
    Calendar,
} from 'lucide-react';

interface RoomHistoryItem {
    id: string;
    roomId: string;
    roomName: string;
    roomType: string;
    subject: string | null;
    topic: string | null;
    joinedAt: string;
    leftAt: string | null;
    role: string;
    isActive: boolean;
}

const ROOM_TYPE_COLORS: Record<string, string> = {
    silent: '#3b82f6',
    doubt_solving: '#a855f7',
    group_revision: '#10b981',
    exam_night: '#f97316',
};

const ROOM_TYPE_LABELS: Record<string, string> = {
    silent: 'Silent Study',
    doubt_solving: 'Doubt Solving',
    group_revision: 'Group Revision',
    exam_night: 'Exam Night',
};

function formatDuration(joinedAt: string, leftAt: string | null): string {
    const start = new Date(joinedAt).getTime();
    const end = leftAt ? new Date(leftAt).getTime() : Date.now();
    const mins = Math.floor((end - start) / 60000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

function formatDate(date: string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RoomHistoryPage() {
    const { profile } = useAuthStore();
    const [items, setItems] = useState<RoomHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadHistory();
    }, [profile]);

    const loadHistory = async () => {
        if (!profile) return;
        setLoading(true);

        // Get all room memberships for this user
        const { data: memberships } = await supabase
            .from('room_members')
            .select('id, room_id, role, joined_at, left_at')
            .eq('user_id', profile.id)
            .order('joined_at', { ascending: false })
            .limit(100);

        if (!memberships || memberships.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }

        // Get room details
        const roomIds = [...new Set(memberships.map(m => m.room_id))];
        const { data: rooms } = await supabase
            .from('study_rooms')
            .select('id, name, room_type, subject, topic, is_active')
            .in('id', roomIds);

        const roomMap = new Map(rooms?.map(r => [r.id, r]) || []);

        const history: RoomHistoryItem[] = memberships.map(m => {
            const room = roomMap.get(m.room_id);
            return {
                id: m.id,
                roomId: m.room_id,
                roomName: room?.name || 'Unknown Room',
                roomType: room?.room_type || 'silent',
                subject: room?.subject || null,
                topic: room?.topic || null,
                joinedAt: m.joined_at,
                leftAt: m.left_at,
                role: m.role,
                isActive: !m.left_at && (room?.is_active ?? false),
            };
        });

        setItems(history);
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <p style={{ color: '#94a3b8' }}>Loading room history...</p>
            </div>
        );
    }

    // Group by date
    const grouped = new Map<string, RoomHistoryItem[]>();
    for (const item of items) {
        const date = formatDate(item.joinedAt);
        if (!grouped.has(date)) grouped.set(date, []);
        grouped.get(date)!.push(item);
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <History style={{ width: 24, height: 24, color: '#a855f7' }} />
                    Room History
                </h1>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>All the study rooms you've been part of</p>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#a855f7' }}>{items.length}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total Sessions</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{items.filter(i => i.isActive).length}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Active Now</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{items.filter(i => i.role === 'host').length}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Rooms Hosted</p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <DoorOpen style={{ width: 40, height: 40, color: '#475569', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94a3b8', marginBottom: 4 }}>No room history yet</p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>Join or create a study room to get started!</p>
                    <Link to="/rooms">
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                            Browse Rooms
                        </button>
                    </Link>
                </div>
            ) : (
                Array.from(grouped.entries()).map(([date, dateItems]) => (
                    <div key={date} style={{ marginBottom: 24 }}>
                        {/* Date header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 12,
                        }}>
                            <Calendar style={{ width: 14, height: 14, color: '#64748b' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{date}</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        </div>

                        {/* Room cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {dateItems.map((item) => {
                                const color = ROOM_TYPE_COLORS[item.roomType] || '#a855f7';
                                return (
                                    <div
                                        key={item.id}
                                        className="card"
                                        style={{
                                            padding: '14px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            borderLeft: `3px solid ${color}`,
                                        }}
                                    >
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 12,
                                            background: `${color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <DoorOpen style={{ width: 18, height: 18, color }} />
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                                    {item.roomName}
                                                </p>
                                                <span className="badge" style={{
                                                    fontSize: 9,
                                                    background: `${color}20`,
                                                    color,
                                                    border: `1px solid ${color}30`,
                                                }}>
                                                    {ROOM_TYPE_LABELS[item.roomType] || item.roomType}
                                                </span>
                                                {item.isActive && (
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            color: '#10b981',
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        🟢 Active
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                marginTop: 4,
                                                fontSize: 12,
                                                color: '#64748b',
                                            }}>
                                                {item.subject && (
                                                    <span>📚 {item.subject}{item.topic ? ` • ${item.topic}` : ''}</span>
                                                )}
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Clock style={{ width: 10, height: 10 }} />
                                                    {formatDuration(item.joinedAt, item.leftAt)}
                                                </span>
                                                {item.role === 'host' && (
                                                    <span style={{ color: '#a855f7', fontWeight: 500 }}>👑 Host</span>
                                                )}
                                            </div>
                                        </div>

                                        {item.isActive && (
                                            <Link to={`/rooms/${item.roomId}`}>
                                                <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                                                    <ArrowRight style={{ width: 14, height: 14 }} /> Rejoin
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
