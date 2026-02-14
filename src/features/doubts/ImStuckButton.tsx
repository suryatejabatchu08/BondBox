import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle, X, Send } from 'lucide-react';

interface Props {
    roomId: string;
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics'];
const DIFFICULTIES = [
    { value: 'easy', label: '🟢 Easy', color: '#10b981' },
    { value: 'medium', label: '🟡 Medium', color: '#f59e0b' },
    { value: 'hard', label: '🔴 Hard', color: '#ef4444' },
];

export default function ImStuckButton({ roomId }: Props) {
    const { profile } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [description, setDescription] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async () => {
        if (!profile || !subject) return;
        setSending(true);

        await supabase.from('doubts').insert({
            room_id: roomId,
            requester_id: profile.id,
            subject,
            topic: topic || subject,
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            description: description || undefined,
        });

        setSending(false);
        setIsOpen(false);
        setSubject('');
        setTopic('');
        setDescription('');
        setDifficulty('medium');
    };

    return (
        <>
            <button
                className="btn btn-lg animate-pulse-glow"
                onClick={() => setIsOpen(true)}
                style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 16,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                }}
            >
                <AlertCircle style={{ width: 22, height: 22 }} />
                I'm Stuck! 🆘
            </button>

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>🆘 Ask for Help</h2>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X style={{ width: 20, height: 20, color: '#64748b' }} />
                            </button>
                        </div>

                        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                            Don't worry! Asking for help is brave. Your friends are here to support you! 💪
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Subject */}
                            <div>
                                <label className="input-label">Subject *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {SUBJECTS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSubject(s)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 16,
                                                fontSize: 12,
                                                border: '1px solid',
                                                borderColor: subject === s ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                                background: subject === s ? 'rgba(168,85,247,0.15)' : 'transparent',
                                                color: subject === s ? '#d8b4fe' : '#94a3b8',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="input-label">Specific Topic</label>
                                <input
                                    className="input"
                                    placeholder="e.g., Quadratic equations"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="input-label">Difficulty Level</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {DIFFICULTIES.map(({ value, label, color }) => (
                                        <button
                                            key={value}
                                            onClick={() => setDifficulty(value)}
                                            style={{
                                                flex: 1,
                                                padding: '8px 12px',
                                                borderRadius: 10,
                                                fontSize: 13,
                                                border: '1px solid',
                                                borderColor: difficulty === value ? color : 'rgba(255,255,255,0.1)',
                                                background: difficulty === value ? `${color}15` : 'transparent',
                                                color: difficulty === value ? color : '#94a3b8',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="input-label">Describe your doubt (optional)</label>
                                <textarea
                                    className="input"
                                    placeholder="What exactly are you stuck on?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    style={{ resize: 'vertical', minHeight: 80 }}
                                />
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                onClick={handleSubmit}
                                disabled={!subject || sending}
                            >
                                {sending ? 'Sending...' : (
                                    <>
                                        <Send style={{ width: 16, height: 16 }} /> Ask for Help
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
