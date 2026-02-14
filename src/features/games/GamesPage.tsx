import { useState } from 'react';
import { Gamepad2, Swords, Calculator, Trophy, Star, Coins, ArrowRight } from 'lucide-react';
import QuizBattle from './QuizBattle';
import MathDuel from './MathDuel';

const GAMES = [
    {
        id: 'quiz_battle',
        name: 'Quiz Battle',
        desc: 'Test your knowledge in a head-to-head quiz!',
        icon: Swords,
        color: '#a855f7',
        gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)',
        emoji: '⚔️',
    },
    {
        id: 'math_duel',
        name: 'Rapid Math Duel',
        desc: 'Race against time to solve math problems!',
        icon: Calculator,
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
        emoji: '🧮',
    },
];

export default function GamesPage() {
    const [activeGame, setActiveGame] = useState<string | null>(null);

    if (activeGame === 'quiz_battle') {
        return <QuizBattle onBack={() => setActiveGame(null)} />;
    }

    if (activeGame === 'math_duel') {
        return <MathDuel onBack={() => setActiveGame(null)} />;
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Gamepad2 style={{ width: 24, height: 24, color: '#a855f7' }} />
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Mini Games</h1>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>
                    Take a study break with fun educational games! Earn coins and badges 🎮
                </p>
            </div>

            {/* Game Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {GAMES.map((game) => {
                    const Icon = game.icon;
                    return (
                        <div
                            key={game.id}
                            className="card card-glow"
                            onClick={() => setActiveGame(game.id)}
                            style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                        >
                            {/* Header Gradient */}
                            <div
                                style={{
                                    background: game.gradient,
                                    padding: '28px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div
                                        style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 16,
                                            background: 'rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon style={{ width: 26, height: 26, color: 'white' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{game.name}</h3>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{game.emoji}</p>
                                    </div>
                                </div>
                                <ArrowRight style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.7)' }} />
                            </div>

                            {/* Body */}
                            <div style={{ padding: '18px 24px' }}>
                                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 14 }}>{game.desc}</p>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                                        <Coins style={{ width: 14, height: 14, color: '#fbbf24' }} /> Earn Coins
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                                        <Star style={{ width: 14, height: 14, color: '#f97316' }} /> Get XP
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                                        <Trophy style={{ width: 14, height: 14, color: '#a855f7' }} /> Win Badges
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
