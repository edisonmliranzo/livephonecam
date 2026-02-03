import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Monitor, Radio, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    const isActive = (path: string) => location.pathname === path;

    // Don't show dock on landing page
    if (location.pathname === '/') {
        return null;
    }

    return (
        <>
            {/* Bottom Floating Dock */}
            <div className="nav-dock animate-slide-up">
                <DockItem
                    icon={<Home size={20} />}
                    active={isActive('/dashboard')}
                    onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
                    label="Home"
                />
                <DockItem
                    icon={<Radio size={20} />}
                    active={isActive('/camera')}
                    onClick={() => navigate('/camera')}
                    label="Broadcast"
                />
                <DockItem
                    icon={<Monitor size={20} />}
                    active={isActive('/viewer')}
                    onClick={() => navigate('/viewer')}
                    label="View"
                />
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <DockItem
                    icon={<User size={20} />}
                    active={isActive('/auth') || isActive('/settings')}
                    onClick={() => navigate(isLoggedIn ? '/dashboard' : '/auth')}
                    label={isLoggedIn ? 'Account' : 'Sign In'}
                />
            </div>
        </>
    );
}

function DockItem({ icon, active, onClick, label }: {
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`nav-item group ${active ? 'active' : ''}`}
            title={label}
        >
            {icon}
            {/* Tooltip */}
            <span className="absolute -top-10 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {label}
            </span>
        </button>
    );
}
