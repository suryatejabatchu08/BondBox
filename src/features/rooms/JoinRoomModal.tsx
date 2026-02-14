import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { X, LogIn } from 'lucide-react';

interface Props {
    onClose: () => void;
    onJoined: () => void;
}

export default function JoinRoomModal({ onClose, onJoined }: Props) {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async () => {
        if (!profile || !code.trim()) return;
        setLoading(true);
        setError('');

        // Find room by code
        const { data: room, error: findError } = await supabase
            .from('study_rooms')
            .select('*')
            .eq('room_code', code.toUpperCase().trim())
            .eq('is_active', true)
            .single();

        if (findError || !room) {
            setError('Room not found. Please check the code and try again.');
            setLoading(false);
            return;
        }

        // Check if already a member
        const { data: existing } = await supabase
            .from('room_members')
            .select('id')
            .eq('room_id', room.id)
            .eq('user_id', profile.id)
            .is('left_at', null)
            .single();

        if (existing) {
            navigate(`/rooms/${room.id}`);
            onClose();
            return;
        }

        // Join room
        const { error: joinError } = await supabase.from('room_members').insert({
            room_id: room.id,
            user_id: profile.id,
            role: 'member',
        });

        if (joinError) {
            setError(joinError.message);
            setLoading(false);
            return;
        }

        setLoading(false);
        onJoined();
        navigate(`/rooms/${room.id}`);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <LogIn style={{ width: 22, height: 22, color: '#a855f7' }} />
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Join Room</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X style={{ width: 20, height: 20, color: '#64748b' }} />
                    </button>
                </div>

                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                    Enter the room code shared by your friend to join their study session.
                </p>

                <div style={{ marginBottom: 20 }}>
                    <label className="input-label">Room Code</label>
                    <input
                        className="input"
                        placeholder="e.g., AB3F2K"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        style={{ fontSize: 20, textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace', fontWeight: 700 }}
                        maxLength={6}
                        autoFocus
                    />
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
                            marginBottom: 16,
                        }}
                    >
                        {error}
                    </div>
                )}

                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={handleJoin}
                    disabled={!code.trim() || loading}
                >
                    {loading ? 'Joining...' : 'Join Study Room'}
                </button>
            </div>
        </div>
    );
}
