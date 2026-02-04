import { useNavigate } from 'react-router-dom';
import { Camera, Shield, Smartphone, Zap, ArrowRight, Check, Play, Monitor, Star } from 'lucide-react';
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
        <div style={{
            minHeight: '100vh',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)'
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div style={{
                            width: 44,
                            height: 44,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 14px rgba(245,158,11,0.35)'
                        }}>
                            <Camera size={22} />
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>
                            Live<span style={{ color: '#f59e0b' }}>Cam</span>
                        </span>
                    </div>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        <a href="#features" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Features</a>
                        <a href="#how-it-works" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>How it Works</a>
                    </nav>

                    <button
                        onClick={() => navigate(isLoggedIn ? '/dashboard' : '/auth')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(245,158,11,0.35)'
                        }}
                    >
                        {isLoggedIn ? 'Dashboard' : 'Get Started'}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                paddingTop: 140,
                paddingBottom: 100,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute',
                    width: 500,
                    height: 500,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    top: '-20%',
                    right: '-10%'
                }} />
                <div style={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    bottom: '-10%',
                    left: '-5%'
                }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                        {/* Left Content */}
                        <div style={{ color: 'white' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'rgba(255,255,255,0.2)',
                                padding: '8px 16px',
                                borderRadius: 100,
                                marginBottom: 24,
                                fontSize: 13,
                                fontWeight: 600
                            }}>
                                <Star size={14} />
                                Trusted by 10,000+ users
                            </div>
                            <h1 style={{
                                fontSize: 56,
                                fontWeight: 800,
                                lineHeight: 1.1,
                                marginBottom: 24
                            }}>
                                Simple Security<br />At Your Fingertips
                            </h1>
                            <p style={{
                                fontSize: 18,
                                opacity: 0.9,
                                lineHeight: 1.7,
                                marginBottom: 32,
                                maxWidth: 480
                            }}>
                                Turn your spare phones into powerful security cameras.
                                Monitor from anywhere, anytime with real-time streaming.
                            </p>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <button
                                    onClick={() => navigate('/auth')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '16px 32px',
                                        background: 'white',
                                        color: '#d97706',
                                        border: 'none',
                                        borderRadius: 14,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <Play size={18} />
                                    Start Monitoring
                                </button>
                                <button
                                    onClick={() => navigate('/viewer')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '16px 32px',
                                        background: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderRadius: 14,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <Monitor size={18} />
                                    Web Viewer
                                </button>
                            </div>
                        </div>

                        {/* Right - Phone Mockup */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                {/* Phone Frame */}
                                <div style={{
                                    width: 280,
                                    height: 580,
                                    background: '#1f2937',
                                    borderRadius: 48,
                                    padding: 12,
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
                                    transform: 'rotate(3deg)'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: '#111827',
                                        borderRadius: 40,
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {/* Notch */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 120,
                                            height: 28,
                                            background: '#1f2937',
                                            borderBottomLeftRadius: 16,
                                            borderBottomRightRadius: 16,
                                            zIndex: 10
                                        }} />

                                        {/* Screen Content */}
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                            padding: 16,
                                            paddingTop: 44
                                        }}>
                                            {/* Status Bar */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 16,
                                                fontSize: 11,
                                                color: '#6b7280',
                                                fontWeight: 600
                                            }}>
                                                <span>9:41</span>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <div style={{ width: 16, height: 8, background: '#374151', borderRadius: 2 }} />
                                                </div>
                                            </div>

                                            {/* Main Camera Card */}
                                            <div style={{
                                                background: 'white',
                                                borderRadius: 20,
                                                padding: 16,
                                                marginBottom: 16,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    marginBottom: 12
                                                }}>
                                                    <div style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        background: '#22c55e',
                                                        boxShadow: '0 0 8px #22c55e'
                                                    }} />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Living Room</span>
                                                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ef4444', fontWeight: 700 }}>● LIVE</span>
                                                </div>
                                                <div style={{
                                                    aspectRatio: '16/9',
                                                    background: 'linear-gradient(135deg, #fde68a 0%, #fed7aa 100%)',
                                                    borderRadius: 14,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Camera size={32} style={{ color: '#d97706', opacity: 0.5 }} />
                                                </div>
                                            </div>

                                            {/* Small Camera Cards */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                {['Front Door', 'Backyard'].map(name => (
                                                    <div key={name} style={{
                                                        background: 'white',
                                                        borderRadius: 14,
                                                        padding: 12,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                                                    }}>
                                                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>{name}</div>
                                                        <div style={{
                                                            aspectRatio: '16/9',
                                                            background: '#f3f4f6',
                                                            borderRadius: 8,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Camera size={14} style={{ color: '#9ca3af' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div style={{
                                    position: 'absolute',
                                    left: -60,
                                    top: '33%',
                                    background: 'white',
                                    borderRadius: 20,
                                    padding: 16,
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12
                                }}>
                                    <div style={{
                                        width: 44,
                                        height: 44,
                                        background: '#dcfce7',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#16a34a'
                                    }}>
                                        <Check size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Motion Detected</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>Front Door • 2s ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: '100px 24px', background: 'white' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
                            Everything You Need
                        </h2>
                        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
                            Powerful features to keep your home secure without the complexity
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                        {[
                            {
                                icon: <Smartphone size={28} />,
                                title: 'Any Device',
                                description: 'Turn old smartphones into security cameras instantly. Works on iOS, Android, and any modern browser.',
                                color: '#2563eb',
                                bg: '#dbeafe'
                            },
                            {
                                icon: <Shield size={28} />,
                                title: 'Secure & Private',
                                description: 'Peer-to-peer connection with end-to-end encryption. Your video never touches our servers.',
                                color: '#16a34a',
                                bg: '#dcfce7'
                            },
                            {
                                icon: <Zap size={28} />,
                                title: 'Real-time Streaming',
                                description: 'Ultra-low latency WebRTC streaming. See what\'s happening as it happens, no delays.',
                                color: '#f59e0b',
                                bg: '#fef3c7'
                            }
                        ].map((feature, i) => (
                            <div key={i} style={{
                                background: '#f8fafc',
                                borderRadius: 28,
                                padding: 40,
                                textAlign: 'center',
                                border: '1px solid rgba(0,0,0,0.04)',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    width: 72,
                                    height: 72,
                                    background: feature.bg,
                                    color: feature.color,
                                    borderRadius: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 12 }}>{feature.title}</h3>
                                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" style={{ padding: '100px 24px', background: '#f8fafc' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
                            Get Started in Minutes
                        </h2>
                        <p style={{ fontSize: 18, color: '#6b7280' }}>
                            Three simple steps to secure your home
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
                        {[
                            { num: '1', title: 'Sign Up', desc: 'Create a free account with Google or email in seconds.' },
                            { num: '2', title: 'Set Up Camera', desc: 'Open the camera page on your spare phone and start broadcasting.' },
                            { num: '3', title: 'Start Watching', desc: 'Connect from any device using the camera ID to see your live feed.' }
                        ].map((step, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 72,
                                    height: 72,
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    color: 'white',
                                    fontSize: 28,
                                    fontWeight: 800,
                                    boxShadow: '0 8px 24px rgba(245,158,11,0.35)'
                                }}>
                                    {step.num}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 12 }}>{step.title}</h3>
                                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '100px 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 16 }}>
                        Ready to secure your home?
                    </h2>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 32 }}>
                        Start monitoring in under 2 minutes. Free to use, no credit card required.
                    </p>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '18px 36px',
                            background: 'white',
                            color: '#d97706',
                            border: 'none',
                            borderRadius: 14,
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                        }}
                    >
                        Get Started Free
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '32px 24px',
                background: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)'
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Camera size={18} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#111827' }}>LiveCam</span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: 14 }}>
                        © 2026 LiveCam. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
