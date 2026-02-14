import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, profile, loading, initialized } = useAuthStore();
    const location = useLocation();

    if (!initialized || loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0a1e' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: '#a855f7' }} />
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading BondBox...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to onboarding if profile exists but onboarding isn't complete
    if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}
