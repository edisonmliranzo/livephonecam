import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Plus, Settings, LogOut, Smartphone, Monitor,
    Play, Trash2, Video, Grid3X3, LayoutGrid, Activity, Shield, Sun, Moon, Cloud, Search,
    Bell, Home, Users, Info, ChevronRight, MoreHorizontal, History, Wifi
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Device {
    id: string;
    name: string;
    type: 'camera' | 'viewer';
    status: 'online' | 'offline' | 'connecting';
    createdAt: any;
    lastSeen?: any;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState<'camera' | 'viewer'>('camera');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser);
            else navigate('/auth');
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        const devicesRef = collection(db, 'users', user.uid, 'devices');
        const unsubscribe = onSnapshot(devicesRef, (snapshot) => {
            const deviceList: Device[] = [];
            snapshot.forEach((doc) => {
                deviceList.push({ id: doc.id, ...doc.data() } as Device);
            });
            setDevices(deviceList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleAddDevice = async () => {
        if (!user || !newDeviceName.trim()) return;
        try {
            const devicesRef = collection(db, 'users', user.uid, 'devices');
            await addDoc(devicesRef, {
                name: newDeviceName.trim(),
                type: newDeviceType,
                status: 'offline',
                createdAt: serverTimestamp(),
            });
            setNewDeviceName('');
            setShowAddModal(false);
        } catch (error) {
            console.error('Error adding device:', error);
        }
    };

    const handleDeleteDevice = async (deviceId: string) => {
        if (!user || !window.confirm('Delete this device permanently?')) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'devices', deviceId));
        } catch (error) {
            console.error('Error deleting device:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const filteredDevices = devices.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return { text: 'Good Morning', icon: <Sun className="text-amber-500" /> };
        if (hour < 18) return { text: 'Good Afternoon', icon: <Cloud className="text-blue-400" /> };
        return { text: 'Good Evening', icon: <Moon className="text-indigo-400" /> };
    };

    const greeting = getGreeting();

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-surface-secondary flex">
            {/* Nav Rail - Desktop only */}
            <aside className="nav-rail hidden lg:flex">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-brand">
                        <Camera size={22} className="text-white" />
                    </div>
                    <span className="font-display font-bold text-2xl text-gray-900">
                        Live<span className="text-orange-600">Cam</span>
                    </span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem icon={<Home size={20} />} label="Overview" active onClick={() => { }} />
                    <NavItem icon={<Activity size={20} />} label="Activity" onClick={() => { }} />
                    <NavItem icon={<History size={20} />} label="Recordings" onClick={() => { }} />
                    <NavItem icon={<Users size={20} />} label="Members" onClick={() => { }} />
                    <div className="pt-8 pb-4">
                        <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Account</span>
                    </div>
                    <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => navigate('/settings')} />
                    <NavItem icon={<Info size={20} />} label="Support" onClick={() => { }} />
                </nav>

                <div className="mt-auto px-2 pt-10">
                    <div className="p-4 rounded-[2rem] bg-orange-50 border border-orange-100 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center mb-3">
                            <Shield size={18} className="text-orange-700" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Upgrade Pro</h4>
                        <p className="text-[11px] text-gray-500 mb-3">Get unlimited cloud storage and AI detection.</p>
                        <button className="w-full py-2 rounded-xl bg-orange-600 text-white text-[11px] font-bold hover:bg-orange-700 transition-colors">
                            View Plans
                        </button>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-[280px]">
                {/* Mobile/Tablet Header */}
                <header className="fixed top-0 left-0 right-0 lg:left-[280px] z-[80] bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Camera size={18} className="text-white" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end max-w-7xl mx-auto">
                        <div className="relative hidden md:block w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Global search..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
                            />
                        </div>
                        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 relative hover:bg-gray-100 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white shadow-sm" />
                        </button>
                        <div className="h-6 w-px bg-gray-100 mx-1" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-gray-900 leading-none">{user?.displayName?.split(' ')[0] || 'User'}</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-1">Free Tier</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-orange-600 font-bold text-sm">
                                {user?.displayName?.[0] || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 pt-28 pb-32">
                    {/* Heroes Secton */}
                    <div className="mb-10 animate-slide-up">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            {greeting.icon}
                            <span className="text-[10px] font-bold uppercase tracking-widest">{greeting.text}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Command <span className="text-orange-600">Center</span>
                        </h1>
                    </div>

                    {/* Quick Access Stories Row */}
                    <div className="mb-10 stories-row -mx-6 px-6">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="shrink-0 flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 rounded-[1.6rem] border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-orange-500 group-hover:bg-orange-50 transition-all">
                                    <Plus size={24} className="text-gray-400 group-hover:text-orange-600" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">New Device</span>
                            </button>

                            {devices.filter(d => d.status === 'online').map(device => (
                                <button key={device.id} className="shrink-0 flex flex-col items-center gap-2 group">
                                    <div className="w-16 h-16 rounded-[1.6rem] p-0.5 border-2 border-orange-500 bg-white ring-4 ring-orange-500/10 group-hover:scale-105 transition-transform duration-300">
                                        <div className="w-full h-full rounded-[1.4rem] bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {device.type === 'camera' ? <Camera size={20} className="text-orange-500" /> : <Monitor size={20} className="text-orange-500" />}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-900 truncate w-16 text-center">{device.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <SummaryCard icon={<Activity size={18} />} label="Active" value={devices.filter(d => d.status === 'online').length} color="text-green-500" bg="bg-green-50" />
                        <SummaryCard icon={<Video size={18} />} label="Usage" value="4.2h" color="text-blue-500" bg="bg-blue-50" />
                        <SummaryCard icon={<Shield size={18} />} label="Threats" value="0" color="text-orange-500" bg="bg-orange-50" />
                        <SummaryCard icon={<Smartphone size={18} />} label="Nodes" value={devices.length} color="text-purple-500" bg="bg-purple-50" />
                    </div>

                    {/* Device Explorer Section */}
                    <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900">Registered Devices</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage and monitor all your hardware components.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        <Grid3X3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>
                                <div className="relative hidden sm:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-xs w-32 focus:w-48 focus:ring-2 focus:ring-orange-500/10 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {filteredDevices.length === 0 ? (
                            <div className="py-20 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6">
                                    <Smartphone size={40} className="text-gray-200" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 mb-2">Build your network</h3>
                                <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">Register an old phone as a camera and use this device to watch in real-time.</p>
                                <button onClick={() => setShowAddModal(true)} className="btn btn-primary px-8 py-3.5 shadow-xl">
                                    <Plus size={20} />
                                    Register First Device
                                </button>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-4'}>
                                {filteredDevices.map(device => (
                                    <DeviceCard
                                        key={device.id}
                                        device={device}
                                        viewMode={viewMode}
                                        onAction={() => device.type === 'camera' ? navigate('/camera') : navigate('/viewer')}
                                        onDelete={() => handleDeleteDevice(device.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Mobile Bottom Navigation Dock */}
            <div className="nav-dock lg:hidden">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="nav-item-circle active"
                >
                    <Activity size={20} />
                    <span className="label">Hub</span>
                </button>
                <button
                    onClick={() => navigate('/viewer')}
                    className="nav-item-circle"
                >
                    <Monitor size={20} />
                    <span className="label">Watch</span>
                </button>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="nav-item-circle bg-orange-500 border-white text-white shadow-lg active:scale-95"
                >
                    <Plus size={24} />
                    <span className="label">Add</span>
                </button>
                <button
                    onClick={() => navigate('/camera')}
                    className="nav-item-circle"
                >
                    <Wifi size={20} />
                    <span className="label">Live</span>
                </button>
                <button
                    onClick={() => navigate('/settings')}
                    className="nav-item-circle"
                >
                    <Users size={20} />
                    <span className="label">Profile</span>
                </button>
            </div>

            {/* Smooth Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-md bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />

                        <h2 className="font-display text-3xl font-extrabold text-gray-900 mb-2">New Node</h2>
                        <p className="text-sm text-gray-500 mb-10 leading-relaxed italic">"Turn your old hardware into security magic."</p>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Identification</label>
                                <input
                                    type="text"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    placeholder="e.g. Backyard Cam"
                                    className="input focus:ring-orange-500/20 px-6 py-4 text-base bg-gray-50 border-transparent rounded-[1.5rem]"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Functionality</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewDeviceType('camera')}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${newDeviceType === 'camera'
                                            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg shadow-orange-500/10'
                                            : 'border-gray-100 bg-gray-25 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <Camera size={32} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Streamer</span>
                                    </button>
                                    <button
                                        onClick={() => setNewDeviceType('viewer')}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${newDeviceType === 'viewer'
                                            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg shadow-orange-500/10'
                                            : 'border-gray-100 bg-gray-25 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <Monitor size={32} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Viewer</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-12">
                            <button onClick={() => setShowAddModal(false)} className="px-6 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Dismiss</button>
                            <button
                                onClick={handleAddDevice}
                                disabled={!newDeviceName.trim()}
                                className="btn btn-primary flex-1 py-4 text-base shadow-xl"
                            >
                                Integrate Node
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavItem({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
        >
            <div className="flex items-center gap-3">
                <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`}>{icon}</span>
                <span className="text-sm font-bold">{label}</span>
            </div>
            {active && <ChevronRight size={14} />}
        </button>
    );
}

function SummaryCard({ icon, label, value, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 hover:inner-shadow transition-all group cursor-default">
            <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-xl font-extrabold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function DeviceCard({ device, viewMode, onAction, onDelete }: any) {
    const statusConfig = {
        online: { color: 'bg-green-500', text: 'Live Now', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]' },
        offline: { color: 'bg-gray-400', text: 'Disconnected', glow: '' },
        connecting: { color: 'bg-amber-400', text: 'Reconnecting', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]' }
    };
    const c = statusConfig[device.status as keyof typeof statusConfig] || statusConfig.offline;

    if (viewMode === 'list') {
        return (
            <div className="group flex items-center justify-between p-5 bg-white hover:bg-orange-50/20 border border-gray-100 rounded-2xl transition-all">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                        {device.type === 'camera' ? <Camera size={24} /> : <Monitor size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{device.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${c.color} ${c.glow}`} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.text}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onAction} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors">Connect</button>
                    <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col group bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
            <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <div className="w-full h-full flex items-center justify-center bg-[#fdfdfd]">
                    {device.type === 'camera' ? (
                        <Camera size={64} className="text-gray-200 animate-pulse" />
                    ) : (
                        <Monitor size={64} className="text-gray-200 animate-pulse" />
                    )}
                </div>

                <div className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/50">
                    <span className={`w-2 h-2 rounded-full ${c.color} ${c.glow}`} />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{device.status === 'online' ? 'Real-time' : c.text}</span>
                </div>

                <div className="absolute top-5 right-5 z-20 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button onClick={onDelete} className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur text-gray-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>

                <button
                    onClick={onAction}
                    className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
                >
                    <div className="w-16 h-16 rounded-full bg-orange-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm">
                        <Play size={28} className="ml-1" />
                    </div>
                </button>
            </div>

            <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md mb-2 inline-block">{device.type} Node</span>
                        <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-orange-600 transition-colors">{device.name}</h3>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <button
                    onClick={onAction}
                    className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-sm tracking-widest uppercase hover:bg-orange-600 transition-all shadow-xl active:scale-95"
                >
                    Connect Node
                </button>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-surface-secondary flex">
            <aside className="nav-rail hidden lg:flex opacity-50">
                <div className="h-10 w-40 skeleton mb-10" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 w-full skeleton" />)}
                </div>
            </aside>
            <div className="flex-1 lg:pl-[280px] p-10 h-screen overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="h-8 w-48 skeleton mb-2" />
                    <div className="h-12 w-96 skeleton mb-10" />

                    <div className="flex gap-6 mb-12">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-20 h-20 rounded-[2rem] skeleton shrink-0" />)}
                    </div>

                    <div className="grid grid-cols-4 gap-6 mb-12">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-[2rem] skeleton" />)}
                    </div>

                    <div className="h-[500px] rounded-[3rem] skeleton" />
                </div>
            </div>
        </div>
    );
}
