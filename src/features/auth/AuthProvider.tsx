import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const initialized = useRef(false);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            const store = useAuthStore.getState();
            store.setSession(session);

            if (session?.user) {
                await store.fetchProfile(session.user.id);
            } else {
                store.setProfile(null);
            }

            if (!initialized.current) {
                initialized.current = true;
            }
            store.setLoading(false);
            store.setInitialized(true);
        });

        // Fallback: if no event fires in 8 seconds, unblock with no user
        const timeout = setTimeout(() => {
            if (!initialized.current) {
                initialized.current = true;
                const store = useAuthStore.getState();
                store.setLoading(false);
                store.setInitialized(true);
            }
        }, 8000);

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    return <>{children}</>;
}
