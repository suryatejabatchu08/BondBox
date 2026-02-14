import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { StudyRoom } from '../../types/database';
import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import {
    Plus,
    DoorOpen,
    Clock,
    Users,
    Search,
    LogIn,
    Volume2,
    HelpCircle,
    BookOpen,
    Moon,
} from 'lucide-react';

const ROOM_TYPE_ICONS: Record<string, typeof Volume2> = {
    silent: Volume2,
    doubt_solving: HelpCircle,
    group_revision: BookOpen,
    exam_night: Moon,
};

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

export default function RoomListPage() {
    const { profile } = useAuthStore();
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadRooms();
    }, [profile]);

    const loadRooms = async () => {
        if (!profile) return;
        setLoading(true);

        // Get rooms where user is a member
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
                .order('created_at', { ascending: false });
            if (roomData) setRooms(roomData as StudyRoom[]);
        }

        setLoading(false);
    };

    const filteredRooms = rooms.filter((room) => {
        const matchesType = filterType === 'all' || room.room_type === filterType;
        const matchesSearch =
            !search ||
            room.name.toLowerCase().includes(search.toLowerCase()) ||
            room.subject?.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>Study Rooms</h1>
                    <p style={{ fontSize: 14, color: '#94a3b8' }}>Create or join rooms to study with friends</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
                        <LogIn style={{ width: 16, height: 16 }} /> Join Room
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus style={{ width: 16, height: 16 }} /> Create Room
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                    <Search
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 14,
                            height: 14,
                            color: '#64748b',
                        }}
                    />
                    <input
                        className="input"
                        placeholder="Search rooms..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 36, width: 240, fontSize: 13 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'silent', 'doubt_solving', 'group_revision', 'exam_night'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 500,
                                border: '1px solid',
                                borderColor: filterType === type ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                background: filterType === type ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                                color: filterType === type ? '#d8b4fe' : '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {type === 'all' ? 'All' : ROOM_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Room Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <p style={{ color: '#94a3b8' }}>Loading rooms...</p>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                    <DoorOpen style={{ width: 48, height: 48, color: '#64748b', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 8 }}>
                        {rooms.length === 0 ? 'No rooms yet' : 'No rooms match your filters'}
                    </p>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                        Create a study room or join one with a code!
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
                            <LogIn style={{ width: 16, height: 16 }} /> Join Room
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            <Plus style={{ width: 16, height: 16 }} /> Create Room
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {filteredRooms.map((room) => {
                        const Icon = ROOM_TYPE_ICONS[room.room_type] || DoorOpen;
                        const color = ROOM_TYPE_COLORS[room.room_type] || '#a855f7';

                        return (
                            <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                                <div className="card card-glow" style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 12,
                                                    background: `${color}15`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon style={{ width: 20, height: 20, color }} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{room.name}</h3>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {ROOM_TYPE_LABELS[room.room_type]}
                                                </span>
                                            </div>
                                        </div>
                                        {room.is_active && (
                                            <div
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: '#10b981',
                                                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
                                                }}
                                            />
                                        )}
                                    </div>

                                    {room.subject && (
                                        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>
                                            📚 {room.subject} {room.topic && `• ${room.topic}`}
                                        </p>
                                    )}

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingTop: 12,
                                            borderTop: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock style={{ width: 12, height: 12 }} />
                                                {room.timer_duration}m / {room.break_duration}m
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Users style={{ width: 12, height: 12 }} />
                                                /{room.max_members}
                                            </span>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontFamily: 'monospace',
                                                color: '#64748b',
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                            }}
                                        >
                                            {room.room_code}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={loadRooms} />}
            {showJoin && <JoinRoomModal onClose={() => setShowJoin(false)} onJoined={loadRooms} />}
        </div>
    );
}
