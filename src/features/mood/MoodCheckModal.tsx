import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { X, Smile } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const MOODS = [
    { emoji: '🔥', label: 'Motivated', mood: 'motivated', color: '#f97316' },
    { emoji: '😊', label: 'Happy', mood: 'happy', color: '#10b981' },
    { emoji: '🧘', label: 'Calm', mood: 'calm', color: '#3b82f6' },
    { emoji: '😴', label: 'Tired', mood: 'tired', color: '#8b5cf6' },
    { emoji: '😰', label: 'Stressed', mood: 'stressed', color: '#ef4444' },
    { emoji: '🤔', label: 'Confused', mood: 'confused', color: '#f59e0b' },
];

export default function MoodCheckModal({ onClose }: Props) {
    const { profile, updateProfile } = useAuthStore();
    const [selected, setSelected] = useState<string>(profile?.current_mood || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        await updateProfile({ current_mood: selected });
        setSaving(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Smile style={{ width: 22, height: 22, color: '#fbbf24' }} />
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>How are you feeling?</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X style={{ width: 20, height: 20, color: '#64748b' }} />
                    </button>
                </div>

                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                    Let your study buddies know your mood! They can offer support when you need it. 💛
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
                    {MOODS.map(({ emoji, label, mood, color }) => (
                        <button
                            key={mood}
                            onClick={() => setSelected(mood)}
                            style={{
                                padding: '16px 12px',
                                borderRadius: 14,
                                border: '2px solid',
                                borderColor: selected === mood ? color : 'rgba(255,255,255,0.06)',
                                background: selected === mood ? `${color}15` : 'rgba(255,255,255,0.03)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                transform: selected === mood ? 'scale(1.05)' : 'scale(1)',
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 6 }}>{emoji}</div>
                            <p style={{ fontSize: 12, fontWeight: 500, color: selected === mood ? color : '#94a3b8' }}>
                                {label}
                            </p>
                        </button>
                    ))}
                </div>

                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={handleSave}
                    disabled={!selected || saving}
                >
                    {saving ? 'Saving...' : 'Update Mood'}
                </button>
            </div>
        </div>
    );
}
