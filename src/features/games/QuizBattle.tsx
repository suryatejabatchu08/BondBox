import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Trophy, Clock, Star, CheckCircle, XCircle } from 'lucide-react';

interface Props {
    onBack: () => void;
}

interface Question {
    question: string;
    options: string[];
    correct: number;
    subject: string;
}

const QUIZ_QUESTIONS: Question[] = [
    { question: 'What is the derivative of x²?', options: ['x', '2x', '2', 'x²'], correct: 1, subject: 'Math' },
    { question: 'Who developed the theory of relativity?', options: ['Newton', 'Einstein', 'Bohr', 'Heisenberg'], correct: 1, subject: 'Physics' },
    { question: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correct: 2, subject: 'Chemistry' },
    { question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Body'], correct: 2, subject: 'Biology' },
    { question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2, subject: 'Geography' },
    { question: 'What is the value of π to 2 decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correct: 1, subject: 'Math' },
    { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1, subject: 'Science' },
    { question: 'What is the largest organ in the human body?', options: ['Heart', 'Liver', 'Skin', 'Brain'], correct: 2, subject: 'Biology' },
    { question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2, subject: 'History' },
    { question: 'What is the SI unit of electric current?', options: ['Volt', 'Watt', 'Ohm', 'Ampere'], correct: 3, subject: 'Physics' },
    { question: 'What is the integral of cos(x)?', options: ['sin(x) + C', '-sin(x) + C', 'cos(x) + C', 'tan(x) + C'], correct: 0, subject: 'Math' },
    { question: 'Which gas is most abundant in Earth\'s atmosphere?', options: ['Oxygen', 'Nitrogen', 'CO₂', 'Argon'], correct: 1, subject: 'Science' },
];

export default function QuizBattle({ onBack }: Props) {
    const { profile, updateProfile } = useAuthStore();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);

    useEffect(() => {
        // Shuffle and pick 5 questions
        const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
        setQuestions(shuffled);
    }, []);

    useEffect(() => {
        if (gameOver || showResult || questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAnswer(-1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [current, showResult, gameOver, questions.length]);

    const handleAnswer = useCallback((index: number) => {
        if (showResult) return;
        setSelected(index);
        setShowResult(true);

        const isCorrect = index === questions[current]?.correct;
        if (isCorrect) setScore((s) => s + 1);

        setTimeout(() => {
            if (current + 1 >= questions.length) {
                const coinsEarned = (isCorrect ? score + 1 : score) * 5;
                const xpEarned = (isCorrect ? score + 1 : score) * 10;
                if (profile) {
                    updateProfile({
                        room_coins: (profile.room_coins || 0) + coinsEarned,
                        xp: (profile.xp || 0) + xpEarned,
                    });
                }
                setGameOver(true);
            } else {
                setCurrent((c) => c + 1);
                setSelected(null);
                setShowResult(false);
                setTimeLeft(15);
            }
        }, 1500);
    }, [showResult, current, questions, score, profile, updateProfile]);

    if (questions.length === 0) return null;

    if (gameOver) {
        const percentage = (score / questions.length) * 100;
        return (
            <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
                <div className="card" style={{ padding: 40 }}>
                    <Trophy
                        style={{
                            width: 64,
                            height: 64,
                            color: percentage >= 80 ? '#fbbf24' : percentage >= 50 ? '#a855f7' : '#64748b',
                            margin: '0 auto 20px',
                        }}
                    />
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                        {percentage >= 80 ? 'Amazing! 🎉' : percentage >= 50 ? 'Good Job! 👏' : 'Keep Practicing! 💪'}
                    </h2>
                    <p style={{ fontSize: 48, fontWeight: 800 }} className="text-gradient">
                        {score}/{questions.length}
                    </p>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8, marginBottom: 24 }}>
                        You earned <strong style={{ color: '#fbbf24' }}>{score * 5} coins</strong> and{' '}
                        <strong style={{ color: '#a855f7' }}>{score * 10} XP</strong>!
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={onBack}>Back to Games</button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
                                setQuestions(shuffled);
                                setCurrent(0);
                                setScore(0);
                                setSelected(null);
                                setShowResult(false);
                                setGameOver(false);
                                setTimeLeft(15);
                            }}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const q = questions[current];

    return (
        <div className="animate-fade-in">
            <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Games
            </button>

            <div style={{ maxWidth: 560, margin: '0 auto' }}>
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>
                        Question {current + 1}/{questions.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#fbbf24' }}>
                            <Star style={{ width: 16, height: 16 }} /> {score}
                        </span>
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 14,
                                color: timeLeft <= 5 ? '#ef4444' : '#94a3b8',
                                fontWeight: timeLeft <= 5 ? 700 : 400,
                            }}
                        >
                            <Clock style={{ width: 16, height: 16 }} /> {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24 }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${((current + 1) / questions.length) * 100}%`,
                            background: 'linear-gradient(90deg, #a855f7, #f97316)',
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>

                {/* Question */}
                <div className="card" style={{ marginBottom: 16, padding: 24 }}>
                    <span className="badge badge-purple" style={{ marginBottom: 10 }}>
                        {q.subject}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', lineHeight: 1.5 }}>
                        {q.question}
                    </h3>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {q.options.map((option, index) => {
                        let bg = 'rgba(255,255,255,0.04)';
                        let borderColor = 'rgba(255,255,255,0.08)';
                        let icon = null;

                        if (showResult) {
                            if (index === q.correct) {
                                bg = 'rgba(16, 185, 129, 0.15)';
                                borderColor = '#10b981';
                                icon = <CheckCircle style={{ width: 18, height: 18, color: '#10b981' }} />;
                            } else if (index === selected && index !== q.correct) {
                                bg = 'rgba(239, 68, 68, 0.15)';
                                borderColor = '#ef4444';
                                icon = <XCircle style={{ width: 18, height: 18, color: '#ef4444' }} />;
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={showResult}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 18px',
                                    borderRadius: 12,
                                    border: `1px solid ${borderColor}`,
                                    background: bg,
                                    color: 'white',
                                    fontSize: 15,
                                    cursor: showResult ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left',
                                    width: '100%',
                                }}
                            >
                                <span
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}
                                >
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span style={{ flex: 1 }}>{option}</span>
                                {icon}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
