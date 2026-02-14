import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Appreciation, Profile } from '../../types/database';
import { Heart, Send, Sparkles, X } from 'lucide-react';

const APPRECIATION_EMOJIS = ['🌟', '💪', '🧠', '🎯', '🤝', '💖', '🔥', '🏆', '📚', '✨'];
const APPRECIATION_MSGS = [
    'You explained that concept so well!',
    'Thanks for helping me when I was stuck!',
    'You make study sessions so much fun!',
    'Your dedication inspires me!',
    'You\'re an amazing study partner!',
];

export default function AppreciationPage() {
    const { profile } = useAuthStore();
    const [appreciations, setAppreciations] = useState<(Appreciation & { from?: Profile; to?: Profile })[]>([]);
    const [showSend, setShowSend] = useState(false);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<string>('');
    const [message, setMessage] = useState('');
    const [emoji, setEmoji] = useState('🌟');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            loadAppreciations();
            loadFriends();
        }
    }, [profile]);

    const loadAppreciations = async () => {
        if (!profile) return;
        setLoading(true);

        const { data } = await supabase
            .from('appreciations')
            .select('*')
            .or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data && data.length > 0) {
            const userIds = [...new Set([...data.map((a) => a.from_user_id), ...data.map((a) => a.to_user_id)])];
            const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);

            const enriched = data.map((a) => ({
                ...a,
                from: profiles?.find((p) => p.id === a.from_user_id) as Profile | undefined,
                to: profiles?.find((p) => p.id === a.to_user_id) as Profile | undefined,
            }));
            setAppreciations(enriched);
        }
        setLoading(false);
    };

    const loadFriends = async () => {
        if (!profile) return;
        const { data: friendships } = await supabase
            .from('friendships')
            .select('user_id, friend_id')
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
            .eq('status', 'accepted');

        if (friendships && friendships.length > 0) {
            const friendIds = friendships.map((f) => (f.user_id === profile.id ? f.friend_id : f.user_id));
            const { data: profilesData } = await supabase.from('profiles').select('*').in('id', friendIds);
            if (profilesData) setFriends(profilesData as Profile[]);
        }
    };

    const sendAppreciation = async () => {
        if (!profile || !selectedFriend || !message.trim()) return;
        setSending(true);

        await supabase.from('appreciations').insert({
            from_user_id: profile.id,
            to_user_id: selectedFriend,
            message: `${emoji} ${message.trim()}`,
        });

        setSending(false);
        setShowSend(false);
        setMessage('');
        setSelectedFriend('');
        loadAppreciations();
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Sparkles style={{ width: 24, height: 24, color: '#fbbf24' }} />
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Appreciation Wall</h1>
                    </div>
                    <p style={{ fontSize: 14, color: '#94a3b8' }}>Celebrate your study buddies! 💛</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowSend(true)}>
                    <Heart style={{ width: 16, height: 16 }} /> Send Love
                </button>
            </div>

            {/* Appreciation Cards */}
            {loading ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading...</p>
            ) : appreciations.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <Heart style={{ width: 40, height: 40, color: '#64748b', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94a3b8', marginBottom: 12 }}>The wall is empty! Be the first to appreciate someone.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowSend(true)}>
                        <Heart style={{ width: 14, height: 14 }} /> Send Appreciation
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {appreciations.map((a) => {
                        const isFromMe = a.from_user_id === profile?.id;
                        return (
                            <div
                                key={a.id}
                                className="card"
                                style={{
                                    background: isFromMe
                                        ? 'rgba(168, 85, 247, 0.06)'
                                        : 'rgba(251, 191, 36, 0.06)',
                                    borderColor: isFromMe
                                        ? 'rgba(168, 85, 247, 0.15)'
                                        : 'rgba(251, 191, 36, 0.15)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <div className="avatar avatar-sm avatar-placeholder">
                                        {a.from?.display_name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 13, color: '#e2e8f0' }}>
                                            <strong>{isFromMe ? 'You' : a.from?.display_name}</strong>
                                            <span style={{ color: '#64748b' }}> → </span>
                                            <strong>{a.to_user_id === profile?.id ? 'You' : a.to?.display_name}</strong>
                                        </p>
                                        <p style={{ fontSize: 11, color: '#64748b' }}>{timeAgo(a.created_at)}</p>
                                    </div>
                                </div>
                                <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{a.message}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Send Appreciation Modal */}
            {showSend && (
                <div className="modal-overlay" onClick={() => setShowSend(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>💛 Send Appreciation</h2>
                            <button onClick={() => setShowSend(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X style={{ width: 20, height: 20, color: '#64748b' }} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Select Friend */}
                            <div>
                                <label className="input-label">Send to</label>
                                {friends.length === 0 ? (
                                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Add friends first to appreciate them!</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {friends.map((f) => (
                                            <button
                                                key={f.id}
                                                onClick={() => setSelectedFriend(f.id)}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: 20,
                                                    fontSize: 13,
                                                    border: '1px solid',
                                                    borderColor: selectedFriend === f.id ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                                    background: selectedFriend === f.id ? 'rgba(168,85,247,0.15)' : 'transparent',
                                                    color: selectedFriend === f.id ? '#d8b4fe' : '#94a3b8',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {f.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Emoji */}
                            <div>
                                <label className="input-label">Pick an emoji</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {APPRECIATION_EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => setEmoji(e)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                fontSize: 18,
                                                border: '1px solid',
                                                borderColor: emoji === e ? '#a855f7' : 'rgba(255,255,255,0.06)',
                                                background: emoji === e ? 'rgba(168,85,247,0.15)' : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="input-label">Your message</label>
                                <textarea
                                    className="input"
                                    placeholder="Say something nice..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                    style={{ resize: 'vertical', minHeight: 80 }}
                                />
                                {/* Quick messages */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                    {APPRECIATION_MSGS.map((msg) => (
                                        <button
                                            key={msg}
                                            onClick={() => setMessage(msg)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 12,
                                                fontSize: 11,
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                background: 'transparent',
                                                color: '#94a3b8',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {msg}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                onClick={sendAppreciation}
                                disabled={!selectedFriend || !message.trim() || sending}
                            >
                                {sending ? 'Sending...' : (
                                    <>
                                        <Send style={{ width: 16, height: 16 }} /> Send Appreciation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
