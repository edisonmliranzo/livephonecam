import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Smartphone, Play } from 'lucide-react';
import React, { useState } from 'react';

export default function Home() {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);

    return (
        <div className="min-h-screen relative overflow-hidden selection:bg-indigo-500/30">
            {/* Aurora Background */}
            <div className="aurora-bg">
                <div className="aurora-blob w-[500px] h-[500px] bg-indigo-600/20 top-[-10%] right-[-10%] rounded-full mix-blend-screen"></div>
                <div className="aurora-blob w-[400px] h-[400px] bg-purple-600/20 bottom-[-10%] left-[-10%] rounded-full mix-blend-screen" style={{ animationDelay: '2s' }}></div>
            </div>

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">

                {/* Visual Orb Interaction */}
                <div
                    className="relative mb-16 group cursor-pointer animate-enter-up"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onClick={() => navigate('/auth')}
                >
                    <div className={`
                        w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-900 
                        opacity-20 blur-[80px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        transition-all duration-700
                        ${hovered ? 'opacity-40 scale-125' : 'animate-pulse'}
                    `}></div>

                    <div className="relative w-40 h-40 glass-panel rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 hover:scale-105 transition-all duration-500 shadow-2xl">
                        <div className="absolute inset-0 rounded-full border border-white/5 animate-spin-slow"></div>
                        <div className={`transition-all duration-300 ${hovered ? 'scale-110' : ''}`}>
                            <Play fill="white" className="text-white ml-1" size={40} />
                        </div>
                    </div>

                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-60 text-xs font-mono tracking-[0.3em] uppercase">
                        Initialize System
                    </div>
                </div>

                {/* Typography */}
                <div className="text-center max-w-2xl animate-enter-up delay-100">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 text-gradient-modern drop-shadow-2xl">
                        LiveCam<span className="text-white/20">.ai</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-400 font-light tracking-wide leading-relaxed">
                        Next-generation distributed surveillance network.<br />
                        <span className="text-white/80 font-normal">Turn any device into an eye.</span>
                    </p>
                </div>

                {/* Floating Metrics */}
                <div className="mt-20 flex flex-wrap justify-center gap-4 animate-enter-up delay-200">
                    <MetricIcon icon={<Shield size={16} />} label="AES-256" />
                    <MetricIcon icon={<Zap size={16} />} label="<50ms" />
                    <MetricIcon icon={<Smartphone size={16} />} label="Native" />
                </div>
            </main>
        </div>
    );
}

function MetricIcon({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="glass-pill px-4 py-2 rounded-full flex items-center gap-3 text-sm text-zinc-300 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors cursor-default">
            <span className="text-indigo-400">{icon}</span>
            <span className="font-medium tracking-wide">{label}</span>
        </div>
    )
}
