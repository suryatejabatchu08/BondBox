import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Heart, Users, Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import PixelSnow from '../../components/ui/PixelSnow';

export default function LoginPage() {
    const navigate = useNavigate();
    const { user, profile, initialized } = useAuthStore();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Redirect when user becomes available (reactive)
    useEffect(() => {
        if (initialized && user) {
            if (profile && !profile.onboarding_completed) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [initialized, user, profile, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { display_name: email.split('@')[0] },
                    },
                });
                if (error) {
                    setError(error.message);
                } else if (data.user && !data.user.email_confirmed_at && !data.session) {
                    setMessage('Check your email for a confirmation link, then sign in!');
                }
                // No manual navigate — the useEffect above handles redirect
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message.includes('Email not confirmed')) {
                        setError('Please check your email and confirm your account first.');
                    } else {
                        setError(error.message);
                    }
                }
                // No manual navigate — the useEffect above handles redirect
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) {
            if (error.message.includes('provider') || error.message.includes('not enabled')) {
                setError('Google sign-in is not configured yet. Please use email/password to sign in.');
            } else {
                setError(error.message);
            }
        }
    };

    return (
        <div className="bg-gradient-animated" style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
            <PixelSnow count={100} maxOpacity={0.12} speed={0.35} />
            {/* Left Side - Branding */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '48px',
                }}
                className="hidden lg:flex"
            >
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background: '#6366f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <BookOpen style={{ width: 28, height: 28, color: 'white' }} />
                        </div>
                        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>
                            Bond<span style={{ color: '#818cf8' }}>Box</span>
                        </h1>
                    </div>

                    <p
                        style={{
                            fontSize: 48,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: 20,
                        }}
                        className="text-gradient"
                    >
                        Study Together,
                        <br />
                        Grow Together.
                    </p>

                    <p style={{ fontSize: 17, color: '#71717a', maxWidth: 480, lineHeight: 1.6, marginBottom: 40 }}>
                        A virtual study room where friends help each other learn, share moments of fun, and build meaningful
                        connections through collaborative learning.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { icon: Users, text: 'Create study rooms with friends', color: '#6366f1' },
                            { icon: Heart, text: 'Build friendship through learning', color: '#a1a1aa' },
                            { icon: Sparkles, text: 'Fun mini-games during breaks', color: '#22c55e' },
                        ].map(({ icon: Icon, text, color }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: `${color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Icon style={{ width: 18, height: 18, color }} />
                                </div>
                                <span style={{ color: '#a1a1aa', fontSize: 14 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                }}
            >
                <div
                    className="glass-strong animate-slide-up"
                    style={{ width: '100%', maxWidth: 440, padding: 36 }}
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: '#6366f1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <BookOpen style={{ width: 24, height: 24, color: 'white' }} />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>
                            Bond<span style={{ color: '#818cf8' }}>Box</span>
                        </h1>
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
                        {isSignUp
                            ? 'Join BondBox and start studying with friends'
                            : 'Sign in to continue your study sessions'}
                    </p>

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleLogin}
                        className="btn btn-secondary"
                        style={{
                            width: '100%',
                            marginBottom: 20,
                            padding: '12px',
                            fontSize: 14,
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: 12, color: '#64748b' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleAuth}>
                        <div style={{ marginBottom: 16 }}>
                            <label className="input-label">Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail
                                    style={{
                                        position: 'absolute',
                                        left: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 16,
                                        height: 16,
                                        color: '#64748b',
                                    }}
                                />
                                <input
                                    type="email"
                                    className="input"
                                    style={{ paddingLeft: 40 }}
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock
                                    style={{
                                        position: 'absolute',
                                        left: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 16,
                                        height: 16,
                                        color: '#64748b',
                                    }}
                                />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    style={{ paddingLeft: 40, paddingRight: 40 }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    {showPassword ? (
                                        <EyeOff style={{ width: 16, height: 16, color: '#64748b' }} />
                                    ) : (
                                        <Eye style={{ width: 16, height: 16, color: '#64748b' }} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#fca5a5',
                                    fontSize: 13,
                                    marginBottom: 16,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {message && (
                            <div
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    color: '#6ee7b7',
                                    fontSize: 13,
                                    marginBottom: 16,
                                }}
                            >
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                            ) : isSignUp ? (
                                'Create Account'
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#71717a' }}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setMessage('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#818cf8',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
