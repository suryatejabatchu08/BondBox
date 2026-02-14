import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Trophy, Clock, Zap } from 'lucide-react';

interface Props {
    onBack: () => void;
}

function generateProblem(level: number) {
    const ops = ['+', '-', '×'];
    if (level > 3) ops.push('÷');
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;

    const maxNum = Math.min(10 + level * 5, 50);

    switch (op) {
        case '+':
            a = Math.floor(Math.random() * maxNum) + 1;
            b = Math.floor(Math.random() * maxNum) + 1;
            answer = a + b;
            break;
        case '-':
            a = Math.floor(Math.random() * maxNum) + 1;
            b = Math.floor(Math.random() * a) + 1;
            answer = a - b;
            break;
        case '×':
            a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
            b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
            answer = a * b;
            break;
        case '÷':
            b = Math.floor(Math.random() * 10) + 2;
            answer = Math.floor(Math.random() * 10) + 1;
            a = b * answer;
            break;
        default:
            a = 1; b = 1; answer = 2;
    }

    return { question: `${a} ${op} ${b}`, answer };
}

export default function MathDuel({ onBack }: Props) {
    const { profile, updateProfile } = useAuthStore();
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [problem, setProblem] = useState(generateProblem(1));
    const [userAnswer, setUserAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [streak, setStreak] = useState(0);

    // Keep a ref so the timer callback always sees the latest score
    const scoreRef = useRef(score);
    scoreRef.current = score;

    useEffect(() => {
        if (gameOver) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Use ref to get the latest score (not the stale closure value)
                    const finalScore = scoreRef.current;
                    const coinsEarned = finalScore * 3;
                    const xpEarned = finalScore * 8;
                    if (profile) {
                        updateProfile({
                            room_coins: (profile.room_coins || 0) + coinsEarned,
                            xp: (profile.xp || 0) + xpEarned,
                        });
                    }
                    setGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameOver]);

    const checkAnswer = useCallback(() => {
        if (!userAnswer.trim()) return;
        const numAnswer = parseInt(userAnswer, 10);

        if (numAnswer === problem.answer) {
            setFeedback('correct');
            setScore((s) => s + 1);
            setStreak((s) => s + 1);

            // Level up every 3 correct
            if ((score + 1) % 3 === 0) {
                setLevel((l) => l + 1);
            }
        } else {
            setFeedback('wrong');
            setStreak(0);
        }

        setTimeout(() => {
            setProblem(generateProblem(level));
            setUserAnswer('');
            setFeedback(null);
        }, 500);
    }, [userAnswer, problem, score, level]);

    if (gameOver) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
                <div className="card" style={{ padding: 40 }}>
                    <Trophy
                        style={{
                            width: 64,
                            height: 64,
                            color: score >= 15 ? '#fbbf24' : score >= 8 ? '#a855f7' : '#64748b',
                            margin: '0 auto 20px',
                        }}
                    />
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                        {score >= 15 ? 'Math Genius! 🧠' : score >= 8 ? 'Great Job! 🎯' : 'Keep Practicing! 💪'}
                    </h2>
                    <p style={{ fontSize: 48, fontWeight: 800 }} className="text-gradient">
                        {score}
                    </p>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>problems solved</p>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
                        Level reached: <strong style={{ color: '#a855f7' }}>{level}</strong> | Earned{' '}
                        <strong style={{ color: '#fbbf24' }}>{score * 3} coins</strong> &{' '}
                        <strong style={{ color: '#a855f7' }}>{score * 8} XP</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={onBack}>Back to Games</button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setScore(0);
                                setLevel(1);
                                setStreak(0);
                                setProblem(generateProblem(1));
                                setTimeLeft(60);
                                setGameOver(false);
                                setUserAnswer('');
                            }}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Games
            </button>

            <div style={{ maxWidth: 480, margin: '0 auto' }}>
                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#fbbf24' }}>
                            <Zap style={{ width: 16, height: 16 }} /> Score: {score}
                        </span>
                        <span style={{ fontSize: 14, color: '#a855f7' }}>Level {level}</span>
                        {streak >= 3 && (
                            <span className="badge badge-orange" style={{ fontSize: 11 }}>
                                🔥 {streak} streak!
                            </span>
                        )}
                    </div>
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 16,
                            fontWeight: 700,
                            color: timeLeft <= 10 ? '#ef4444' : 'white',
                        }}
                    >
                        <Clock style={{ width: 18, height: 18 }} /> {timeLeft}s
                    </span>
                </div>

                {/* Timer bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 28 }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${(timeLeft / 60) * 100}%`,
                            background: timeLeft <= 10
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                : 'linear-gradient(90deg, #a855f7, #f97316)',
                            borderRadius: 2,
                            transition: 'width 1s linear',
                        }}
                    />
                </div>

                {/* Problem */}
                <div
                    className="card"
                    style={{
                        textAlign: 'center',
                        padding: '40px 24px',
                        marginBottom: 20,
                        background: feedback === 'correct'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : feedback === 'wrong'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : undefined,
                        borderColor: feedback === 'correct'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : feedback === 'wrong'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : undefined,
                        transition: 'all 0.3s ease',
                    }}
                >
                    <p style={{ fontSize: 48, fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                        {problem.question}
                    </p>
                    <p style={{ fontSize: 16, color: '#64748b', marginTop: 8 }}>= ?</p>
                </div>

                {/* Answer Input */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="number"
                        className="input"
                        placeholder="Your answer"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                        style={{ fontSize: 20, textAlign: 'center', fontWeight: 700 }}
                        autoFocus
                    />
                    <button className="btn btn-primary btn-lg" onClick={checkAnswer} disabled={!userAnswer.trim()}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
