import { useNavigate } from 'react-router-dom';
import { Camera, Shield, Smartphone, Zap, ArrowRight, Check, Play, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-warm">
            {/* Header */}
            <header className="nav-header-warm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <Camera size={22} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-xl text-white">
                            LiveCam
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Features</a>
                        <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors text-sm font-medium">How it Works</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn bg-white text-brand-600 hover:bg-gray-50"
                                style={{ color: '#d97706' }}
                            >
                                Dashboard
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/auth')}
                                className="btn bg-white text-brand-600 hover:bg-gray-50"
                                style={{ color: '#d97706' }}
                            >
                                Get Started
                                <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative">
                {/* Hero with warm gradient */}
                <section className="bg-gradient-warm pt-32 pb-24 px-6 relative overflow-hidden">
                    {/* Decorative Shapes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div
                            className="absolute w-96 h-96 rounded-full opacity-20"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                                top: '-10%',
                                right: '10%',
                            }}
                        />
                        <div
                            className="absolute w-64 h-64 rounded-full opacity-15"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
                                bottom: '10%',
                                left: '5%',
                            }}
                        />
                    </div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left Content */}
                            <div className="text-white animate-slide-up">
                                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                                    Simple Security At Your Fingertips
                                </h1>
                                <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-lg">
                                    Turn your spare phones into powerful security cameras.
                                    Monitor from anywhere, anytime with real-time streaming.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => navigate('/auth')}
                                        className="btn btn-lg bg-white hover:bg-gray-50 shadow-lg"
                                        style={{ color: '#d97706' }}
                                    >
                                        <Play size={18} />
                                        Start Monitoring
                                    </button>
                                    <button
                                        onClick={() => navigate('/viewer')}
                                        className="btn btn-lg bg-white/20 backdrop-blur text-white border border-white/30 hover:bg-white/30"
                                    >
                                        <Monitor size={18} />
                                        Web Viewer
                                    </button>
                                </div>
                            </div>

                            {/* Right - Phone Mockup */}
                            <div className="hidden lg:flex justify-center animate-slide-up delay-200">
                                <div className="relative">
                                    {/* Phone Frame */}
                                    <div className="w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                        <div className="w-full h-full bg-gray-800 rounded-[2.5rem] overflow-hidden relative">
                                            {/* Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />

                                            {/* Screen Content */}
                                            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-50 flex flex-col">
                                                {/* Status Bar */}
                                                <div className="pt-10 px-6 pb-4">
                                                    <div className="flex items-center justify-between text-gray-600 text-xs">
                                                        <span className="font-medium">9:41</span>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-4 h-2 bg-gray-600 rounded-sm" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* App Content */}
                                                <div className="flex-1 px-4 pb-8">
                                                    <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-sm font-semibold text-gray-800">Living Room</span>
                                                            <span className="ml-auto text-xs text-gray-500">LIVE</span>
                                                        </div>
                                                        <div className="aspect-video bg-gradient-to-br from-amber-200/50 to-orange-100 rounded-xl flex items-center justify-center">
                                                            <Camera size={32} className="text-amber-600/50" />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-white rounded-xl p-3 shadow">
                                                            <div className="text-xs text-gray-500 mb-1">Front Door</div>
                                                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <Camera size={16} className="text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-3 shadow">
                                                            <div className="text-xs text-gray-500 mb-1">Backyard</div>
                                                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <Camera size={16} className="text-gray-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating Badge */}
                                    <div className="absolute -left-8 top-1/3 bg-white rounded-2xl p-4 shadow-xl animate-float">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <Check size={20} className="text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">Motion Detected</div>
                                                <div className="text-xs text-gray-500">Front Door • 2s ago</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 animate-slide-up">
                            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                Everything You Need
                            </h2>
                            <p className="text-gray-600 text-lg max-w-xl mx-auto">
                                Powerful features to keep your home secure without the complexity
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Smartphone size={24} />}
                                title="Any Device"
                                description="Turn old smartphones into security cameras instantly. Works on iOS, Android, and any modern browser."
                                delay="delay-100"
                            />
                            <FeatureCard
                                icon={<Shield size={24} />}
                                title="Secure & Private"
                                description="Peer-to-peer connection with end-to-end encryption. Your video data never touches our servers."
                                delay="delay-200"
                            />
                            <FeatureCard
                                icon={<Zap size={24} />}
                                title="Real-time Streaming"
                                description="Ultra-low latency WebRTC streaming. See what's happening as it happens, no delays."
                                delay="delay-300"
                            />
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="py-24 px-6 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                Get Started in Minutes
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Three simple steps to secure your home
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <StepCard
                                number="1"
                                title="Sign Up"
                                description="Create a free account with Google or email in seconds."
                            />
                            <StepCard
                                number="2"
                                title="Set Up Camera"
                                description="Open the camera page on your spare phone and start broadcasting."
                            />
                            <StepCard
                                number="3"
                                title="Start Watching"
                                description="Connect from any device using the camera ID to see your live feed."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-6 bg-gradient-warm">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                            Ready to secure your home?
                        </h2>
                        <p className="text-white/90 text-lg mb-8">
                            Start monitoring in under 2 minutes. Free to use, no credit card required.
                        </p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="btn btn-lg bg-white shadow-lg hover:bg-gray-50"
                            style={{ color: '#d97706' }}
                        >
                            Get Started Free
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8 px-6 bg-white border-t border-gray-200">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
                            <Camera size={16} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-gray-800">LiveCam</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2026 LiveCam. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay?: string;
}) {
    return (
        <div className={`card card-elevated p-8 text-center animate-slide-up ${delay || ''}`}>
            <div className="feature-icon mx-auto mb-6">
                {icon}
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="text-center">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
            >
                {number}
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
