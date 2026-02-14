import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Doubt, Profile } from '../../types/database';
import { HelpCircle, CheckCircle, Hand } from 'lucide-react';

interface Props {
    roomId: string;
}

export default function DoubtsList({ roomId }: Props) {
    const { profile } = useAuthStore();
    const [doubts, setDoubts] = useState<(Doubt & { requester?: Profile; helper?: Profile })[]>([]);

    useEffect(() => {
        loadDoubts();
    }, [roomId]);

    const loadDoubts = async () => {
        const { data } = await supabase
            .from('doubts')
            .select('*')
            .eq('room_id', roomId)
            .in('status', ['open', 'in_progress'])
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            const userIds = [...new Set(data.map((d) => d.requester_id).filter(Boolean))];
            const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);

            const enriched = data.map((d) => ({
                ...d,
                requester: profiles?.find((p) => p.id === d.requester_id) as Profile | undefined,
            }));
            setDoubts(enriched as (Doubt & { requester?: Profile })[]);
        } else {
            setDoubts([]);
        }
    };

    const helpWithDoubt = async (doubtId: string) => {
        if (!profile) return;
        await supabase
            .from('doubts')
            .update({ helper_id: profile.id, status: 'in_progress' })
            .eq('id', doubtId);
        loadDoubts();
    };

    const resolveDoubt = async (doubtId: string) => {
        await supabase
            .from('doubts')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', doubtId);
        loadDoubts();
    };

    const DIFFICULTY_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

    if (doubts.length === 0) return null;

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <HelpCircle style={{ width: 18, height: 18, color: '#ef4444' }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>
                    Active Doubts ({doubts.length})
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {doubts.map((doubt) => (
                    <div
                        key={doubt.id}
                        style={{
                            padding: '12px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="avatar avatar-sm avatar-placeholder">
                                    {doubt.requester?.display_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>
                                        {doubt.requester?.display_name || 'Unknown'}
                                        {doubt.requester_id === profile?.id && <span style={{ color: '#64748b' }}> (you)</span>}
                                    </p>
                                    <p style={{ fontSize: 12, color: '#64748b' }}>needs help</p>
                                </div>
                            </div>
                            <span
                                className="badge"
                                style={{
                                    background: `${DIFFICULTY_COLORS[doubt.difficulty]}15`,
                                    color: DIFFICULTY_COLORS[doubt.difficulty],
                                    border: `1px solid ${DIFFICULTY_COLORS[doubt.difficulty]}30`,
                                    fontSize: 11,
                                }}
                            >
                                {doubt.difficulty}
                            </span>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                                📚 {doubt.subject} • {doubt.topic}
                            </p>
                            {doubt.description && (
                                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{doubt.description}</p>
                            )}
                        </div>

                        {doubt.status === 'open' && doubt.requester_id !== profile?.id && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => helpWithDoubt(doubt.id)}
                            >
                                <Hand style={{ width: 14, height: 14 }} /> I can help!
                            </button>
                        )}

                        {doubt.status === 'in_progress' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: '#f59e0b' }}>🤝 Being helped...</span>
                                {(doubt.requester_id === profile?.id || doubt.helper_id === profile?.id) && (
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}
                                        onClick={() => resolveDoubt(doubt.id)}
                                    >
                                        <CheckCircle style={{ width: 14, height: 14 }} /> Resolved!
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
