import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Plus, Settings, LogOut, Smartphone, Monitor,
    Play, Trash2, Video, Grid3X3, LayoutGrid, Activity, Shield, Clock, Sun, Moon, Cloud, Search
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

    // Auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate('/auth');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Devices listener
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
        if (!user) return;
        if (!window.confirm('Are you sure you want to delete this device?')) return;

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


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6 animate-fade-in">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
                        <Camera className="absolute inset-0 m-auto text-brand-500" size={24} />
                    </div>
                    <p className="text-gray-500 font-medium tracking-wide">Securing your connection...</p>
                </div>
            </div>
        );
    }

    const greeting = getGreeting();

    return (
        <div className="min-h-screen bg-surface-secondary pb-24">
            {/* Top Navigation */}
            <header className="nav-header">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-brand transform group-hover:scale-110 transition-transform">
                            <Camera size={20} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-xl text-gray-900">
                            Live<span className="text-orange-600">Cam</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            <Activity size={16} />
                            <span className="text-sm font-medium">System Status: Good</span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 mx-2" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">{user?.displayName || 'Welcome'}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Premium Account</p>
                            </div>
                            <div className="relative group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-md">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-orange-600 font-bold">
                                        {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                                    </div>
                                </div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 invisible group-hover:visible transition-all duration-300 z-50">
                                    <button onClick={() => navigate('/settings')} className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3">
                                        <Settings size={16} /> Settings
                                    </button>
                                    <div className="h-px bg-gray-100 my-1 mx-4" />
                                    <button onClick={handleSignOut} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-medium">
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-32">
                {/* Hero Greeting Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="animate-slide-up">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            {greeting.icon}
                            <span className="text-sm font-semibold uppercase tracking-wider">{greeting.text}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-sm font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h1 className="font-display text-4xl font-extrabold text-gray-900">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">{user?.displayName?.split(' ')[0] || 'User'}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 animate-slide-up delay-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all w-full md:w-64 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary shadow-lg"
                        >
                            <Plus size={20} />
                            Add Device
                        </button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-slide-up delay-200">
                    <StatCard
                        icon={<Activity className="text-green-500" />}
                        label="Active Feed"
                        value={devices.filter(d => d.status === 'online').length.toString()}
                        trend="+1 recently"
                    />
                    <StatCard
                        icon={<Shield className="text-blue-500" />}
                        label="Security Level"
                        value="High"
                        trend="Protected"
                    />
                    <StatCard
                        icon={<Video className="text-orange-500" />}
                        label="Storage"
                        value="2.4 GB"
                        trend="15% used"
                    />
                    <StatCard
                        icon={<Clock className="text-purple-500" />}
                        label="Uptime"
                        value="99.9%"
                        trend="Excellent"
                    />
                </div>

                {/* Devices Section Container */}
                {/* Devices Section Container */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">My Monitoring Devices</h2>
                            <p className="text-sm text-gray-500">{filteredDevices.length} total units configured</p>
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                <Grid3X3 size={18} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>

                    {filteredDevices.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Smartphone size={40} className="text-orange-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Start your security hub</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2 mb-8">Add an old phone or tablet to start streaming your home in real-time.</p>
                            <button onClick={() => setShowAddModal(true)} className="btn btn-primary px-8">
                                <Plus size={20} />
                                Add Your First Device
                            </button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
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
                </div>
            </main>

            {/* Bottom Floating Nav for Mobile Experience */}
            <div className="nav-dock">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="nav-item active"
                >
                    <Activity size={20} />
                    <span className="text-[10px] font-bold mt-1 uppercase">Hub</span>
                </button>
                <button
                    onClick={() => navigate('/viewer')}
                    className="nav-item"
                >
                    <Monitor size={20} />
                    <span className="text-[10px] font-medium mt-1 uppercase">Watch</span>
                </button>
                <button
                    onClick={() => navigate('/camera')}
                    className="nav-item"
                >
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center -mt-8 shadow-brand-lg border-4 border-white">
                        <Camera size={22} className="text-white" />
                    </div>
                </button>
                <button
                    onClick={() => { }}
                    className="nav-item"
                >
                    <Video size={20} />
                    <span className="text-[10px] font-medium mt-1 uppercase">Clips</span>
                </button>
                <button
                    onClick={() => navigate('/settings')}
                    className="nav-item"
                >
                    <Settings size={20} />
                    <span className="text-[10px] font-medium mt-1 uppercase">Setup</span>
                </button>
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-400" />

                        <h2 className="font-display text-3xl font-extrabold text-gray-900 mb-2">New Device</h2>
                        <p className="text-gray-500 mb-8">Give your hardware a name and role.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Device Name</label>
                                <input
                                    type="text"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    placeholder="Kitchen Phone, Old iPad..."
                                    className="input focus:ring-orange-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Select Mission</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewDeviceType('camera')}
                                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newDeviceType === 'camera'
                                            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md'
                                            : 'border-gray-100 bg-gray-25 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <Camera size={32} />
                                        <span className="text-sm font-bold">Camera</span>
                                    </button>
                                    <button
                                        onClick={() => setNewDeviceType('viewer')}
                                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newDeviceType === 'viewer'
                                            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md'
                                            : 'border-gray-100 bg-gray-25 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <Monitor size={32} />
                                        <span className="text-sm font-bold">Viewer</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1 py-4 text-base">Cancel</button>
                            <button
                                onClick={handleAddDevice}
                                disabled={!newDeviceName.trim()}
                                className="btn btn-primary flex-1 py-4 text-base shadow-orange-500/20"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, trend }: any) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">{value}</span>
                    <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 rounded uppercase">{trend}</span>
                </div>
            </div>
        </div>
    );
}

function DeviceCard({ device, viewMode, onAction, onDelete }: any) {
    const statusConfig = {
        online: { color: 'bg-green-500', text: 'Active', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]' },
        offline: { color: 'bg-gray-400', text: 'Offline', glow: '' },
        connecting: { color: 'bg-amber-400', text: 'Connecting', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' }
    };

    const config = statusConfig[device.status as keyof typeof statusConfig] || statusConfig.offline;

    if (viewMode === 'list') {
        return (
            <div className="group flex items-center justify-between p-4 bg-white hover:bg-orange-50/30 border border-gray-100 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        {device.type === 'camera' ? <Camera size={20} /> : <Monitor size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{device.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${config.color} ${config.glow}`} />
                            <span className="text-xs font-bold text-gray-500 uppercase">{config.text}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onAction} className="btn btn-primary p-2.5 rounded-xl shadow-none hover:shadow-md">
                        {device.type === 'camera' ? <Play size={18} /> : <Activity size={18} />}
                    </button>
                    <button onClick={onDelete} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 flex flex-col">
            <div className="aspect-[4/3] bg-gray-50 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {device.type === 'camera' ? (
                    <Camera size={48} className="text-gray-200 group-hover:text-orange-200 transition-colors duration-500 group-hover:scale-110" />
                ) : (
                    <Monitor size={48} className="text-gray-200 group-hover:text-orange-200 transition-colors duration-500 group-hover:scale-110" />
                )}

                {/* Overlays */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${config.color} ${config.glow}`} />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{config.text}</span>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onDelete} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{device.name}</h3>
                        <p className="text-xs font-medium text-gray-400 mt-1 capitalize">{device.type} Node</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Smartphone size={16} />
                    </div>
                </div>

                <button
                    onClick={onAction}
                    className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm tracking-wide hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98] transform transition-transform"
                >
                    {device.type === 'camera' ? 'START STREAM' : 'VIEW FEED'}
                </button>
            </div>
        </div>
    );
}
