import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { StudyRoom, Profile } from '../../types/database';
import PomodoroTimer from '../../components/study-room/PomodoroTimer';
import TodoList from '../../components/study-room/TodoList';
import ImStuckButton from '../doubts/ImStuckButton';
import DoubtsList from '../doubts/DoubtsList';
import VideoGrid from '../../components/study-room/VideoGrid';
import VideoControls from '../../components/study-room/VideoControls';
import CollaborativeCanvas from '../../components/study-room/CollaborativeCanvas';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useCanvasSync } from '../../hooks/useCanvasSync';
import { usePresence } from '../../hooks/usePresence';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import {
    ArrowLeft,
    Copy,
    Users,
    Check,
    LogOut,
    Video,
    Timer,
    HelpCircle,
    ListTodo,
    Pencil,
} from 'lucide-react';

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

type ActiveTab = 'video' | 'timer' | 'doubts' | 'todos' | 'canvas';

export default function RoomPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const [room, setRoom] = useState<StudyRoom | null>(null);
    const [members, setMembers] = useState<(Profile & { role: string })[]>([]);
    const [codeCopied, setCodeCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('video');
    const [isInCall, setIsInCall] = useState(false);
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);

    // WebRTC hook
    const webrtc = useWebRTC({
        roomId: id || '',
        userId: profile?.id || '',
        displayName: profile?.display_name || 'Anonymous',
        enabled: isInCall,
    });

    // Canvas sync hook (also provides shared wsRef)
    const canvas = useCanvasSync(
        id || '',
        profile?.id || '',
        profile?.display_name || 'Anonymous'
    );

    // Presence tracking (heartbeat + online users)
    const { onlineUsers } = usePresence({
        roomId: id || '',
        userId: profile?.id || '',
        wsRef: canvas.wsRef,
    });

    // Typing indicators
    const { typingText, isAnyoneTyping } = useTypingIndicator({
        roomId: id || '',
        userId: profile?.id || '',
        wsRef: canvas.wsRef,
    });

    useEffect(() => {
        if (id) loadRoom();
    }, [id]);

    // Auto-connect WebSocket when room loads (for presence/typing)
    useEffect(() => {
        if (id && profile?.id) {
            canvas.connect();
        }
        return () => {
            canvas.disconnect();
        };
    }, [id, profile?.id]);

    const loadRoom = async () => {
        if (!id) return;
        setLoading(true);

        const { data: roomData } = await supabase
            .from('study_rooms')
            .select('*')
            .eq('id', id)
            .single();

        if (roomData) setRoom(roomData as StudyRoom);

        const { data: memberData } = await supabase
            .from('room_members')
            .select('user_id, role')
            .eq('room_id', id)
            .is('left_at', null);

        if (memberData && memberData.length > 0) {
            const userIds = memberData.map((m) => m.user_id);
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            if (profileData) {
                const merged = profileData.map((p) => ({
                    ...p,
                    role: memberData.find((m) => m.user_id === p.id)?.role || 'member',
                })) as (Profile & { role: string })[];
                setMembers(merged);
            }
        }

        setLoading(false);
    };

    const copyCode = () => {
        if (room) {
            navigator.clipboard.writeText(room.room_code);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const leaveRoom = async () => {
        if (!profile || !id) return;
        if (isInCall) {
            webrtc.leaveCall();
            setIsInCall(false);
        }
        canvas.disconnect();
        await supabase
            .from('room_members')
            .update({ left_at: new Date().toISOString() })
            .eq('room_id', id)
            .eq('user_id', profile.id);
        navigate('/rooms');
    };

    const handleJoinCall = async () => {
        await webrtc.joinCall();
        setIsInCall(true);
    };

    const handleLeaveCall = () => {
        webrtc.leaveCall();
        setIsInCall(false);
    };

    const handleToggleCanvas = () => {
        if (!isCanvasOpen) {
            canvas.connect();
            setIsCanvasOpen(true);
            setActiveTab('canvas');
        } else {
            setIsCanvasOpen(false);
            setActiveTab('video');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <p style={{ color: '#94a3b8' }}>Loading room...</p>
            </div>
        );
    }

    if (!room) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: '#94a3b8' }}>Room not found</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/rooms')} style={{ marginTop: 12 }}>
                    Back to Rooms
                </button>
            </div>
        );
    }

    const color = ROOM_TYPE_COLORS[room.room_type];

    const tabs = [
        { id: 'video' as const, label: 'Video', icon: Video },
        { id: 'canvas' as const, label: 'Canvas', icon: Pencil },
        { id: 'timer' as const, label: 'Timer', icon: Timer },
        { id: 'doubts' as const, label: 'Doubts', icon: HelpCircle },
        { id: 'todos' as const, label: 'Todos', icon: ListTodo },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate('/rooms')}>
                        <ArrowLeft style={{ width: 20, height: 20 }} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{room.name}</h1>
                            <span className="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                                {ROOM_TYPE_LABELS[room.room_type]}
                            </span>
                        </div>
                        {room.subject && (
                            <p style={{ fontSize: 13, color: '#94a3b8' }}>
                                📚 {room.subject} {room.topic && `• ${room.topic}`}
                            </p>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={copyCode}>
                        {codeCopied ? <Check style={{ width: 14, height: 14, color: '#10b981' }} /> : <Copy style={{ width: 14, height: 14 }} />}
                        {room.room_code}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={leaveRoom}>
                        <LogOut style={{ width: 14, height: 14 }} /> Leave
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div
                style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: 16,
                    padding: 4,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'canvas') {
                                    handleToggleCanvas();
                                } else {
                                    setActiveTab(tab.id);
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                background: isActive ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                                color: isActive ? '#d8b4fe' : '#64748b',
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Icon style={{ width: 16, height: 16 }} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
                {/* Left Column - Main Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Video Tab */}
                    {activeTab === 'video' && (
                        <div className="card" style={{ padding: 16 }}>
                            {!isInCall ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <div
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Video style={{ width: 32, height: 32, color: '#a855f7' }} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 6 }}>
                                        Ready to study together?
                                    </h3>
                                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                                        Join the video call to see and talk with your study buddies
                                    </p>
                                    <button className="btn btn-primary btn-lg" onClick={handleJoinCall}>
                                        <Video style={{ width: 18, height: 18 }} /> Join Call
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <VideoGrid
                                        localStream={webrtc.localStream}
                                        remoteStreams={webrtc.remoteStreams}
                                        displayName={profile?.display_name || 'You'}
                                        isVideoEnabled={webrtc.isVideoEnabled}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <VideoControls
                                            isAudioEnabled={webrtc.isAudioEnabled}
                                            isVideoEnabled={webrtc.isVideoEnabled}
                                            isScreenSharing={webrtc.isScreenSharing}
                                            isCanvasOpen={isCanvasOpen}
                                            onToggleAudio={webrtc.toggleAudio}
                                            onToggleVideo={webrtc.toggleVideo}
                                            onToggleScreenShare={webrtc.toggleScreenShare}
                                            onToggleCanvas={handleToggleCanvas}
                                            onLeaveCall={handleLeaveCall}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Canvas Tab */}
                    {activeTab === 'canvas' && (
                        <div style={{ height: 500 }}>
                            <CollaborativeCanvas
                                sendDraw={canvas.sendDraw}
                                sendClear={canvas.sendClear}
                                onDrawRef={canvas.onDrawRef}
                                onClearRef={canvas.onClearRef}
                                onClose={() => {
                                    setIsCanvasOpen(false);
                                    setActiveTab('video');
                                }}
                            />
                        </div>
                    )}

                    {/* Timer Tab */}
                    {activeTab === 'timer' && (
                        <div>
                            <PomodoroTimer
                                workDuration={room.timer_duration}
                                breakDuration={room.break_duration}
                            />
                        </div>
                    )}

                    {/* Doubts Tab */}
                    {activeTab === 'doubts' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <ImStuckButton roomId={room.id} />
                            <DoubtsList roomId={room.id} />
                        </div>
                    )}

                    {/* Todos Tab */}
                    {activeTab === 'todos' && (
                        <TodoList roomId={room.id} />
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Members */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Users style={{ width: 18, height: 18, color: '#a855f7' }} />
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>
                                Members ({members.length}/{room.max_members})
                            </h3>
                            {onlineUsers.length > 0 && (
                                <span style={{ fontSize: 11, color: '#10b981', marginLeft: 'auto' }}>
                                    🟢 {onlineUsers.length} online
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {members.map((member) => {
                                const isOnline = onlineUsers.includes(member.id);
                                return (
                                    <div
                                        key={member.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '8px 10px',
                                            borderRadius: 10,
                                            background: 'rgba(255,255,255,0.03)',
                                        }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <div className="avatar avatar-sm avatar-placeholder">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.display_name} />
                                                ) : (
                                                    member.display_name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            {/* Online indicator dot */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    background: isOnline ? '#10b981' : '#475569',
                                                    border: '2px solid #1a1333',
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>
                                                {member.display_name}
                                                {member.id === profile?.id && (
                                                    <span style={{ color: '#64748b', fontWeight: 400 }}> (you)</span>
                                                )}
                                            </p>
                                        </div>
                                        {member.role === 'host' && (
                                            <span className="badge badge-purple" style={{ fontSize: 10 }}>Host</span>
                                        )}
                                        {member.role === 'mentor' && (
                                            <span className="badge badge-green" style={{ fontSize: 10 }}>Mentor</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Typing indicator */}
                        {isAnyoneTyping && (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(168, 85, 247, 0.08)',
                                    border: '1px solid rgba(168, 85, 247, 0.15)',
                                    fontSize: 12,
                                    color: '#d8b4fe',
                                    fontStyle: 'italic',
                                }}
                            >
                                ✏️ {typingText}
                            </div>
                        )}
                    </div>

                    {/* Room Info */}
                    <div className="card">
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 12 }}>Room Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Type</span>
                                <span style={{ color: 'white' }}>{ROOM_TYPE_LABELS[room.room_type]}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Work Timer</span>
                                <span style={{ color: 'white' }}>{room.timer_duration} min</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Break Timer</span>
                                <span style={{ color: 'white' }}>{room.break_duration} min</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Room Code</span>
                                <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 600 }}>{room.room_code}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions in Sidebar */}
                    {activeTab === 'video' && isInCall && (
                        <div className="card" style={{ padding: 12 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Quick Actions
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: '100%', justifyContent: 'flex-start' }}
                                    onClick={() => setActiveTab('timer')}
                                >
                                    <Timer style={{ width: 14, height: 14 }} /> Start Timer
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: '100%', justifyContent: 'flex-start' }}
                                    onClick={handleToggleCanvas}
                                >
                                    <Pencil style={{ width: 14, height: 14 }} /> Open Whiteboard
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: '100%', justifyContent: 'flex-start' }}
                                    onClick={() => setActiveTab('doubts')}
                                >
                                    <HelpCircle style={{ width: 14, height: 14 }} /> I'm Stuck
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
