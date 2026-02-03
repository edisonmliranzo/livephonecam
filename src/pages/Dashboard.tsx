import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Plus, Settings, LogOut, Smartphone, Monitor,
    MoreVertical, Play, Trash2, Edit2,
    Video, Grid3X3, LayoutGrid, Eye, Bell
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

    const handleDeviceAction = (device: Device) => {
        if (device.type === 'camera') {
            navigate('/camera');
        } else {
            navigate('/viewer');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
                        style={{ borderTopColor: '#f59e0b' }}
                    />
                    <p className="text-gray-500">Loading your devices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
                            >
                                <Camera size={20} className="text-white" />
                            </div>
                            <span className="font-display font-bold text-xl text-gray-900 hidden sm:block">
                                Live<span style={{ color: '#d97706' }}>Cam</span>
                            </span>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Add Device</span>
                            </button>

                            <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                            {/* Notification Button */}
                            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors relative">
                                <Bell size={20} />
                                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-semibold text-gray-900">{user?.displayName || 'User'}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <div className="relative group">
                                    <button
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                        style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
                                    >
                                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </button>

                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <button
                                            onClick={() => navigate('/settings')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">My Devices</h1>
                        <p className="text-gray-500">
                            {devices.length === 0
                                ? 'Add your first device to get started'
                                : `${devices.length} device${devices.length !== 1 ? 's' : ''} registered`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <QuickActionCard
                        icon={<Camera size={24} />}
                        title="Start Camera"
                        description="Use this device as a camera"
                        onClick={() => navigate('/camera')}
                    />
                    <QuickActionCard
                        icon={<Monitor size={24} />}
                        title="Open Viewer"
                        description="Watch your camera feeds"
                        onClick={() => navigate('/viewer')}
                    />
                    <QuickActionCard
                        icon={<Video size={24} />}
                        title="Recordings"
                        description="View saved clips"
                        onClick={() => { }}
                        disabled
                    />
                    <QuickActionCard
                        icon={<Settings size={24} />}
                        title="Settings"
                        description="Configure your account"
                        onClick={() => { }}
                        disabled
                    />
                </div>

                {/* Devices Grid/List */}
                {devices.length === 0 ? (
                    <EmptyState onAddDevice={() => setShowAddModal(true)} />
                ) : (
                    <div className={viewMode === 'grid' ? 'dashboard-grid' : 'space-y-4'}>
                        {devices.map((device) => (
                            <DeviceCard
                                key={device.id}
                                device={device}
                                viewMode={viewMode}
                                onAction={() => handleDeviceAction(device)}
                                onDelete={() => handleDeleteDevice(device.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Add Device Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-scale-in">
                        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Add New Device</h2>
                        <p className="text-gray-500 mb-6">Register a new camera or viewer device</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
                                <input
                                    type="text"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    placeholder="e.g., Living Room Camera"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setNewDeviceType('camera')}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${newDeviceType === 'camera'
                                            ? 'border-amber-400 bg-amber-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        style={{ color: newDeviceType === 'camera' ? '#d97706' : '#6b7280' }}
                                    >
                                        <Camera size={24} />
                                        <span className="text-sm font-medium">Camera</span>
                                    </button>
                                    <button
                                        onClick={() => setNewDeviceType('viewer')}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${newDeviceType === 'viewer'
                                            ? 'border-amber-400 bg-amber-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        style={{ color: newDeviceType === 'viewer' ? '#d97706' : '#6b7280' }}
                                    >
                                        <Monitor size={24} />
                                        <span className="text-sm font-medium">Viewer</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDevice}
                                disabled={!newDeviceName.trim()}
                                className="btn btn-primary flex-1"
                            >
                                Add Device
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuickActionCard({
    icon,
    title,
    description,
    onClick,
    disabled
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`card card-elevated p-5 text-left group transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
        >
            <div className="feature-icon mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
        </button>
    );
}

function DeviceCard({
    device,
    viewMode,
    onAction,
    onDelete
}: {
    device: Device;
    viewMode: 'grid' | 'list';
    onAction: () => void;
    onDelete: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    const statusColors = {
        online: 'status-online',
        offline: 'status-offline',
        connecting: 'status-connecting',
    };

    if (viewMode === 'list') {
        return (
            <div className="device-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
                    >
                        {device.type === 'camera' ? (
                            <Camera size={20} style={{ color: '#d97706' }} />
                        ) : (
                            <Monitor size={20} style={{ color: '#d97706' }} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className={`status-dot ${statusColors[device.status]}`} />
                            <span className="capitalize">{device.status}</span>
                            <span>•</span>
                            <span className="capitalize">{device.type}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAction}
                        className="btn btn-secondary p-2"
                    >
                        {device.type === 'camera' ? <Play size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="btn btn-ghost p-2"
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-40 py-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <Edit2 size={14} /> Rename
                                </button>
                                <button
                                    onClick={() => { onDelete(); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="device-card overflow-hidden">
            {/* Preview Area */}
            <div className="aspect-video bg-gradient-to-br from-amber-50 to-orange-50 relative flex items-center justify-center">
                {device.type === 'camera' ? (
                    <Camera size={40} className="text-amber-300" />
                ) : (
                    <Monitor size={40} className="text-amber-300" />
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100">
                    <div className={`status-dot ${statusColors[device.status]}`} />
                    <span className="text-xs font-medium text-gray-700 capitalize">{device.status}</span>
                </div>

                {/* Type Badge */}
                <div
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium capitalize"
                    style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#b45309' }}
                >
                    {device.type}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex items-center justify-between bg-white">
                <div>
                    <h3 className="font-semibold text-gray-900">{device.name}</h3>
                    <p className="text-xs text-gray-500">
                        {device.status === 'online' ? 'Live now' : 'Last seen recently'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAction}
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
                    >
                        {device.type === 'camera' ? <Play size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ onAddDevice }: { onAddDevice: () => void }) {
    return (
        <div className="card card-elevated p-12 text-center">
            <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
            >
                <Smartphone size={32} style={{ color: '#d97706' }} />
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">No devices yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Add your first device to start monitoring. You can use any smartphone as a camera or viewer.
            </p>
            <button onClick={onAddDevice} className="btn btn-primary">
                <Plus size={18} />
                Add Your First Device
            </button>
        </div>
    );
}
