import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { X, DoorOpen, Volume2, HelpCircle, BookOpen, Moon } from 'lucide-react';

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

const ROOM_TYPES = [
    { value: 'silent', label: 'Silent Study', desc: 'Focus mode with minimal interaction', icon: Volume2, color: '#3b82f6' },
    { value: 'doubt_solving', label: 'Doubt Solving', desc: 'Active discussion and whiteboard', icon: HelpCircle, color: '#a855f7' },
    { value: 'group_revision', label: 'Group Revision', desc: 'Collaborative review sessions', icon: BookOpen, color: '#10b981' },
    { value: 'exam_night', label: 'Exam Night', desc: 'High-focus pre-exam environment', icon: Moon, color: '#f97316' },
];

export default function CreateRoomModal({ onClose, onCreated }: Props) {
    const { profile } = useAuthStore();
    const [name, setName] = useState('');
    const [roomType, setRoomType] = useState('doubt_solving');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [maxMembers, setMaxMembers] = useState(10);
    const [timerDuration, setTimerDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!profile || !name.trim()) return;
        setLoading(true);
        setError('');

        const { data: room, error: createError } = await supabase
            .from('study_rooms')
            .insert({
                name: name.trim(),
                room_type: roomType as 'silent' | 'doubt_solving' | 'group_revision' | 'exam_night',
                subject: subject || undefined,
                topic: topic || undefined,
                host_id: profile.id,
                max_members: maxMembers,
                timer_duration: timerDuration,
                break_duration: breakDuration,
            })
            .select()
            .single();

        if (createError) {
            setError(createError.message);
            setLoading(false);
            return;
        }

        // Add host as room member
        if (room) {
            await supabase.from('room_members').insert({
                room_id: room.id,
                user_id: profile.id,
                role: 'host',
            });
        }

        setLoading(false);
        onCreated();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <DoorOpen style={{ width: 22, height: 22, color: '#a855f7' }} />
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Create Study Room</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                        <X style={{ width: 20, height: 20, color: '#64748b' }} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Room Name */}
                    <div>
                        <label className="input-label">Room Name *</label>
                        <input
                            className="input"
                            placeholder="e.g., Math Study Session"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Room Type */}
                    <div>
                        <label className="input-label">Room Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {ROOM_TYPES.map(({ value, label, desc, icon: Icon, color }) => (
                                <button
                                    key={value}
                                    onClick={() => setRoomType(value)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: 12,
                                        border: '1px solid',
                                        borderColor: roomType === value ? color : 'rgba(255,255,255,0.08)',
                                        background: roomType === value ? `${color}10` : 'rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Icon style={{ width: 16, height: 16, color }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{label}</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#64748b' }}>{desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject & Topic */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label className="input-label">Subject</label>
                            <input
                                className="input"
                                placeholder="e.g., Mathematics"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="input-label">Topic</label>
                            <input
                                className="input"
                                placeholder="e.g., Calculus"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Timer Settings */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                            <label className="input-label">Work (min)</label>
                            <input
                                type="number"
                                className="input"
                                value={timerDuration}
                                onChange={(e) => setTimerDuration(Number(e.target.value))}
                                min={5}
                                max={90}
                            />
                        </div>
                        <div>
                            <label className="input-label">Break (min)</label>
                            <input
                                type="number"
                                className="input"
                                value={breakDuration}
                                onChange={(e) => setBreakDuration(Number(e.target.value))}
                                min={1}
                                max={30}
                            />
                        </div>
                        <div>
                            <label className="input-label">Max Members</label>
                            <input
                                type="number"
                                className="input"
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(Number(e.target.value))}
                                min={2}
                                max={15}
                            />
                        </div>
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        onClick={handleCreate}
                        disabled={!name.trim() || loading}
                    >
                        {loading ? 'Creating...' : 'Create Room 🎉'}
                    </button>
                </div>
            </div>
        </div>
    );
}
