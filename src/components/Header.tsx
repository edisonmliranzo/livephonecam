import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Home, User, Radio } from 'lucide-react';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            {/* Top Logo (Minimal) */}
            <div className="fixed top-0 left-0 p-6 z-50">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="font-bold tracking-tight text-white/90">LiveCam</span>
                </div>
            </div>

            {/* Bottom Floating Dock */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-enter-up delay-300">
                <nav className="glass-pill px-2 py-2 rounded-full flex items-center gap-1">
                    <DockItem
                        icon={<Home size={20} />}
                        active={isActive('/')}
                        onClick={() => navigate('/')}
                        label="Home"
                    />
                    <DockItem
                        icon={<Radio size={20} />}
                        active={isActive('/camera')}
                        onClick={() => navigate('/camera')}
                        label="Stream"
                    />
                    <DockItem
                        icon={<Camera size={20} />}
                        active={isActive('/viewer')}
                        onClick={() => navigate('/viewer')}
                        label="Watch"
                    />
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <DockItem
                        icon={<User size={20} />}
                        active={isActive('/auth')}
                        onClick={() => navigate('/auth')}
                        label="Account"
                    />
                </nav>
            </div>
        </>
    );
}

function DockItem({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group
                ${active ? 'bg-white text-black scale-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-white/10'}
            `}
        >
            {icon}
            {/* Tooltip */}
            <span className="absolute -top-10 bg-black/80 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 backdrop-blur-md pointer-events-none whitespace-nowrap">
                {label}
            </span>
        </button>
    )
}
