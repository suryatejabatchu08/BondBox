import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';

interface Props {
    workDuration: number;
    breakDuration: number;
}

export default function PomodoroTimer({ workDuration, breakDuration }: Props) {
    const [timeLeft, setTimeLeft] = useState(workDuration * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessions, setSessions] = useState(0);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        setIsRunning(false);

                        if (!isBreak) {
                            // Switch to break
                            setIsBreak(true);
                            setSessions((s) => s + 1);
                            return breakDuration * 60;
                        } else {
                            // Switch to work
                            setIsBreak(false);
                            return workDuration * 60;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isBreak, workDuration, breakDuration]);

    const reset = () => {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(workDuration * 60);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const total = isBreak ? breakDuration * 60 : workDuration * 60;
    const progress = ((total - timeLeft) / total) * 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div
            className="card"
            style={{
                textAlign: 'center',
                padding: '28px 20px',
                background: isBreak
                    ? 'rgba(16, 185, 129, 0.05)'
                    : 'rgba(168, 85, 247, 0.05)',
                borderColor: isBreak
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(168, 85, 247, 0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {isBreak ? (
                    <Coffee style={{ width: 20, height: 20, color: '#10b981' }} />
                ) : (
                    <BookOpen style={{ width: 20, height: 20, color: '#a855f7' }} />
                )}
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>
                    {isBreak ? 'Break Time! ☕' : 'Focus Time 📚'}
                </h3>
                {sessions > 0 && (
                    <span className="badge badge-purple" style={{ fontSize: 11 }}>
                        {sessions} session{sessions !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Circular Timer */}
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
                <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="6"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke={isBreak ? '#10b981' : '#a855f7'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                {/* Time Display */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}
                >
                    <p
                        style={{
                            fontSize: 44,
                            fontWeight: 700,
                            color: 'white',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: 2,
                        }}
                    >
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        {isBreak ? 'Take a breather' : 'Stay focused!'}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-icon" onClick={reset} title="Reset">
                    <RotateCcw style={{ width: 18, height: 18 }} />
                </button>
                <button
                    className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
                    style={{ minWidth: 120 }}
                    onClick={() => setIsRunning(!isRunning)}
                >
                    {isRunning ? (
                        <>
                            <Pause style={{ width: 18, height: 18 }} /> Pause
                        </>
                    ) : (
                        <>
                            <Play style={{ width: 18, height: 18 }} /> Start
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
