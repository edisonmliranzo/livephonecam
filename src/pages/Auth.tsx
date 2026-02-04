import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Mail, Lock, User, Camera } from 'lucide-react';
import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// Google Icon Component
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function Auth() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign in cancelled. Please try again.");
            } else {
                setError("Failed to sign in with Google. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        if (isSignUp && !name) {
            setError("Please enter your name.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("Email is already in use. Try signing in instead.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Please enter a valid email address.");
            } else {
                setError("Authentication failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px 16px 16px 52px',
        border: '2px solid #e5e7eb',
        borderRadius: 14,
        fontSize: 16,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.2s'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fed7aa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'absolute',
                width: 600,
                height: 600,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
                top: '-20%',
                right: '-15%',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: 500,
                height: 500,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)',
                bottom: '-20%',
                left: '-15%',
                pointerEvents: 'none'
            }} />

            <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#6b7280',
                        background: 'none',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: 32,
                        padding: 0
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </button>

                {/* Auth Card */}
                <div style={{
                    background: 'white',
                    borderRadius: 32,
                    padding: 40,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 72,
                            height: 72,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 24px rgba(245,158,11,0.35)'
                        }}>
                            <Camera size={32} style={{ color: 'white' }} />
                        </div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: 15 }}>
                            {isSignUp
                                ? 'Sign up to start monitoring your home'
                                : 'Sign in to access your cameras'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: 16,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 14,
                            color: '#dc2626',
                            fontSize: 14,
                            marginBottom: 24
                        }}>
                            <AlertCircle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                            <p style={{ margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            padding: '16px 24px',
                            background: 'white',
                            border: '2px solid #e5e7eb',
                            borderRadius: 14,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#374151',
                            cursor: 'pointer',
                            marginBottom: 16,
                            transition: 'all 0.2s'
                        }}
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        margin: '24px 0'
                    }}>
                        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Or continue with email
                        </span>
                        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth}>
                        {isSignUp && (
                            <div style={{ position: 'relative', marginBottom: 16 }}>
                                <User size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full name"
                                    style={inputStyle}
                                    required={isSignUp}
                                />
                            </div>
                        )}

                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <Mail size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div style={{ position: 'relative', marginBottom: 24 }}>
                            <Lock size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                style={{ ...inputStyle, paddingRight: 52 }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 16,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '16px 24px',
                                background: isLoading ? '#e5e7eb' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: isLoading ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: 14,
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                boxShadow: isLoading ? 'none' : '0 6px 20px rgba(245,158,11,0.35)'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span style={{
                                        width: 18,
                                        height: 18,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    {isSignUp ? 'Create Account' : 'Sign In with Email'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Sign Up/Sign In */}
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <p style={{ color: '#6b7280', fontSize: 14 }}>
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#f59e0b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </p>

                        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
                            By continuing, you agree to our{' '}
                            <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
