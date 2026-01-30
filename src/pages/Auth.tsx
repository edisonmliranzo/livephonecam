import { useNavigate } from 'react-router-dom';
import { Github, Chrome, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Auth() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            navigate('/viewer');
        } catch (err: any) {
            console.error(err);
            setError("Failed to sign in with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, new GithubAuthProvider());
            navigate('/viewer');
        } catch (err: any) {
            console.error(err);
            setError("Failed to sign in with GitHub.");
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

        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/viewer');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("Email is already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Authentication failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-enter">
                <button
                    onClick={() => navigate('/')}
                    className="absolute -top-12 left-0 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isSignUp ? 'Create an Account' : 'Welcome Back'}
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            {isSignUp ? 'Join the secure live streaming platform' : 'Sign in to access your secure feed'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-start gap-3 text-red-400 text-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <AuthButton
                            icon={<Chrome size={18} />}
                            label="Continue with Google"
                            onClick={handleGoogleLogin}
                        />
                        <AuthButton
                            icon={<Github size={18} />}
                            label="Continue with GitHub"
                            onClick={handleGithubLogin}
                        />
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0c0c0e] px-2 text-zinc-500">Or continue with</span>
                            </div>
                        </div>
                        <form className="space-y-4" onSubmit={handleEmailAuth}>
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/20 transition-colors"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/20 transition-colors"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In with Email')}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 space-y-4">
                        <p className="text-center text-sm text-zinc-500">
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                }}
                                className="underline hover:text-zinc-300 font-medium text-white"
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </p>

                        <p className="text-center text-xs text-zinc-500">
                            By continuing, you agree to our <a href="#" className="underline hover:text-zinc-300">Terms of Service</a> and <a href="#" className="underline hover:text-zinc-300">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AuthButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-all text-sm group"
        >
            <span className="text-zinc-400 group-hover:text-white transition-colors">{icon}</span>
            {label}
        </button>
    )
}
