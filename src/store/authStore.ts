import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    initialized: boolean;
    setSession: (session: Session | null) => void;
    setProfile: (profile: Profile | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    fetchProfile: (userId: string) => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    setSession: (session) =>
        set({ session, user: session?.user ?? null }),

    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    setInitialized: (initialized) => set({ initialized }),

    fetchProfile: async (userId: string) => {
        // Skip if we already have a profile for this user
        const existing = get().profile;
        if (existing && existing.id === userId) {
            return;
        }

        try {
            const result = await Promise.race([
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timed out')), 5000)
                ),
            ]);

            const { data, error } = result as { data: Profile | null; error: { message: string } | null };

            if (!error && data) {
                set({ profile: data as Profile });
            }
            // On error, keep existing profile (don't set to null)
        } catch {
            // On timeout/error, keep existing profile
        }
    },

    updateProfile: async (updates: Partial<Profile>) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (!error && data) {
            set({ profile: data as Profile });
        }
    },

    signOut: async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Sign out error:', err);
        }
        set({ session: null, user: null, profile: null, loading: false });
    },
}));
