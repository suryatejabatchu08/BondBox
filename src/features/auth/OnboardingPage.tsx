import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Sparkles, ArrowRight, Check } from 'lucide-react';

const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'English', 'History', 'Geography',
    'Economics', 'Psychology', 'Art', 'Music',
];

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { updateProfile, user } = useAuthStore();
    const [displayName, setDisplayName] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const toggleSubject = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
        );
    };

    const handleComplete = async () => {
        if (!user) return;
        setSaving(true);
        await updateProfile({
            display_name: displayName,
            subject_expertise: selectedSubjects,
            onboarding_completed: true,
        });
        setSaving(false);
        navigate('/');
    };

    return (
        <div className="bg-gradient-animated" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="glass-strong animate-slide-up" style={{ maxWidth: 520, width: '100%', padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #a855f7, #f97316)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <BookOpen style={{ width: 28, height: 28, color: 'white' }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                        Welcome to BondBox! 🎉
                    </h2>
                    <p style={{ fontSize: 14, color: '#94a3b8' }}>Let's set up your profile</p>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                    {[1, 2].map((s) => (
                        <div
                            key={s}
                            style={{
                                width: s === step ? 32 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: s <= step ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    ))}
                </div>

                {step === 1 && (
                    <div className="animate-fade-in">
                        <label className="input-label">What should we call you?</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Your display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            style={{ marginBottom: 24, fontSize: 16 }}
                            autoFocus
                        />
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            onClick={() => setStep(2)}
                            disabled={!displayName.trim()}
                        >
                            Continue <ArrowRight style={{ width: 18, height: 18 }} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Sparkles style={{ width: 18, height: 18, color: '#f97316' }} />
                            <label className="input-label" style={{ margin: 0 }}>
                                Select subjects you're interested in
                            </label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                            {SUBJECTS.map((subject) => {
                                const selected = selectedSubjects.includes(subject);
                                return (
                                    <button
                                        key={subject}
                                        onClick={() => toggleSubject(subject)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 20,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            border: '1px solid',
                                            borderColor: selected ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                            background: selected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                                            color: selected ? '#d8b4fe' : '#94a3b8',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        {selected && <Check style={{ width: 14, height: 14 }} />}
                                        {subject}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleComplete}
                                disabled={saving || selectedSubjects.length === 0}
                                style={{ flex: 2 }}
                            >
                                {saving ? 'Setting up...' : 'Start Learning! 🚀'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
