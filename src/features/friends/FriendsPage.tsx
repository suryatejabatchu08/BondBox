import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Profile, Friendship } from '../../types/database';
import {
    Users,
    UserPlus,
    Check,
    X,
    Search,
    Heart,
    Star,
    Clock,
    Send,
} from 'lucide-react';

type FriendWithProfile = Friendship & { friendProfile: Profile };

export default function FriendsPage() {
    const { profile } = useAuthStore();
    const [friends, setFriends] = useState<FriendWithProfile[]>([]);
    const [pendingReceived, setPendingReceived] = useState<FriendWithProfile[]>([]);
    const [pendingSent, setPendingSent] = useState<FriendWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);
    const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends');

    useEffect(() => {
        if (profile) loadFriends();
    }, [profile]);

    const loadFriends = async () => {
        if (!profile) return;
        setLoading(true);

        const { data: friendships } = await supabase
            .from('friendships')
            .select('*')
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

        if (!friendships) { setLoading(false); return; }

        const userIds = friendships.map((f) =>
            f.user_id === profile.id ? f.friend_id : f.user_id
        );

        const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        const withProfiles = friendships.map((f) => ({
            ...f,
            friendProfile: profilesData?.find((p) =>
                p.id === (f.user_id === profile.id ? f.friend_id : f.user_id)
            ) as Profile,
        }));

        setFriends(withProfiles.filter((f) => f.status === 'accepted'));
        setPendingReceived(withProfiles.filter((f) => f.status === 'pending' && f.friend_id === profile.id));
        setPendingSent(withProfiles.filter((f) => f.status === 'pending' && f.user_id === profile.id));
        setLoading(false);
    };

    const searchUsers = async () => {
        if (!search.trim() || !profile) return;
        setSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('display_name', `%${search}%`)
            .neq('id', profile.id)
            .limit(10);
        setSearchResults((data as Profile[]) || []);
        setSearching(false);
    };

    const sendRequest = async (friendId: string) => {
        if (!profile) return;
        await supabase.from('friendships').insert({
            user_id: profile.id,
            friend_id: friendId,
        });
        loadFriends();
        setSearchResults(searchResults.filter((r) => r.id !== friendId));
    };

    const acceptRequest = async (friendshipId: string) => {
        await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
        loadFriends();
    };

    const rejectRequest = async (friendshipId: string) => {
        await supabase.from('friendships').delete().eq('id', friendshipId);
        loadFriends();
    };

    const existingIds = new Set([
        ...friends.map((f) => f.friendProfile?.id),
        ...pendingSent.map((f) => f.friendProfile?.id),
        ...pendingReceived.map((f) => f.friendProfile?.id),
    ]);

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Users style={{ width: 24, height: 24, color: '#a855f7' }} />
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Friends</h1>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>Connect with study buddies and grow together! 🤝</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {[
                    { id: 'friends' as const, label: 'My Friends', count: friends.length },
                    { id: 'requests' as const, label: 'Requests', count: pendingReceived.length },
                    { id: 'find' as const, label: 'Find Friends', count: 0 },
                ].map(({ id, label, count }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: tab === id ? '#a855f7' : 'rgba(255,255,255,0.1)',
                            background: tab === id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                            color: tab === id ? '#d8b4fe' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {label}
                        {count > 0 && (
                            <span
                                style={{
                                    minWidth: 18,
                                    height: 18,
                                    borderRadius: 9,
                                    background: id === 'requests' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Friends List */}
            {tab === 'friends' && (
                <div>
                    {loading ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading...</p>
                    ) : friends.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <UserPlus style={{ width: 40, height: 40, color: '#64748b', margin: '0 auto 12px' }} />
                            <p style={{ color: '#94a3b8', marginBottom: 12 }}>No friends yet</p>
                            <button className="btn btn-primary btn-sm" onClick={() => setTab('find')}>Find Friends</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {friends.map((f) => (
                                <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar avatar-md avatar-placeholder">
                                        {f.friendProfile?.avatar_url ? (
                                            <img src={f.friendProfile.avatar_url} alt="" />
                                        ) : (
                                            f.friendProfile?.display_name?.charAt(0).toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                            {f.friendProfile?.display_name}
                                        </p>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: '#64748b' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <Star style={{ width: 12, height: 12, color: '#fbbf24' }} />
                                                {f.friendProfile?.xp || 0} XP
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <Heart style={{ width: 12, height: 12, color: '#ef4444' }} />
                                                {f.friendship_score || 0}
                                            </span>
                                        </div>
                                        {/* Friendship Meter */}
                                        <div style={{ marginTop: 6 }}>
                                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${Math.min((f.friendship_score || 0) / 100 * 100, 100)}%`,
                                                        background: 'linear-gradient(90deg, #a855f7, #f97316)',
                                                        borderRadius: 2,
                                                        transition: 'width 0.3s ease',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Pending Requests */}
            {tab === 'requests' && (
                <div>
                    {pendingReceived.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 12 }}>
                                Received ({pendingReceived.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {pendingReceived.map((f) => (
                                    <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="avatar avatar-md avatar-placeholder">
                                            {f.friendProfile?.display_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{f.friendProfile?.display_name}</p>
                                            <p style={{ fontSize: 12, color: '#64748b' }}>wants to be your study buddy</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => acceptRequest(f.id)}>
                                                <Check style={{ width: 14, height: 14 }} /> Accept
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => rejectRequest(f.id)}>
                                                <X style={{ width: 14, height: 14 }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {pendingSent.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 12 }}>
                                Sent ({pendingSent.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {pendingSent.map((f) => (
                                    <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="avatar avatar-md avatar-placeholder">
                                            {f.friendProfile?.display_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{f.friendProfile?.display_name}</p>
                                            <p style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock style={{ width: 12, height: 12 }} /> Pending
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {pendingReceived.length === 0 && pendingSent.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <p style={{ color: '#94a3b8' }}>No pending requests</p>
                        </div>
                    )}
                </div>
            )}

            {/* Find Friends */}
            {tab === 'find' && (
                <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search
                                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#64748b' }}
                            />
                            <input
                                className="input"
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={searchUsers} disabled={!search.trim() || searching}>
                            <Search style={{ width: 16, height: 16 }} /> Search
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {searchResults.map((user) => (
                                <div key={user.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar avatar-md avatar-placeholder">
                                        {user.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{user.display_name}</p>
                                        <p style={{ fontSize: 12, color: '#64748b' }}>
                                            {user.expertise?.join(', ') || 'No subjects listed'}
                                        </p>
                                    </div>
                                    {existingIds.has(user.id) ? (
                                        <span style={{ fontSize: 12, color: '#64748b' }}>Already connected</span>
                                    ) : (
                                        <button className="btn btn-primary btn-sm" onClick={() => sendRequest(user.id)}>
                                            <Send style={{ width: 14, height: 14 }} /> Add
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
