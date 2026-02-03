import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Plus, Settings, Smartphone, Monitor,
    Play, Trash2, Video, Activity, Shield, Sun, Moon, Cloud,
    Bell, Home, Eye
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState<'camera' | 'viewer'>('camera');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
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
            snapshot.forEach((docSnap) => {
                deviceList.push({ id: docSnap.id, ...docSnap.data() } as Device);
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

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return { text: 'Good Morning', icon: <Sun size={16} /> };
        if (hour < 18) return { text: 'Good Afternoon', icon: <Cloud size={16} /> };
        return { text: 'Good Evening', icon: <Moon size={16} /> };
    };

    const greeting = getGreeting();
    const onlineCount = devices.filter(d => d.status === 'online').length;

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your devices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="logo-mark">
                        <Camera size={20} />
                    </div>
                    <div className="header-title">
                        <h1>LiveCam</h1>
                        <span className="header-subtitle">Dashboard</span>
                    </div>
                </div>
                <div className="header-right">
                    <button className="header-btn">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </button>
                    <div className="header-avatar" onClick={handleSignOut}>
                        {user?.displayName?.[0] || 'U'}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Welcome Section */}
                <section className="welcome-section">
                    <div className="greeting">
                        {greeting.icon}
                        <span>{greeting.text}</span>
                    </div>
                    <h2 className="welcome-title">
                        Welcome back, <span>{user?.displayName?.split(' ')[0] || 'User'}</span>
                    </h2>
                    <p className="welcome-subtitle">
                        You have {devices.length} device{devices.length !== 1 ? 's' : ''} registered
                        {onlineCount > 0 && <span className="online-badge">{onlineCount} online</span>}
                    </p>
                </section>

                {/* Stats Cards */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <Activity size={20} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{onlineCount}</span>
                            <span className="stat-label">Active</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <Video size={20} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">0h</span>
                            <span className="stat-label">Today</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Shield size={20} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Alerts</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <Smartphone size={20} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{devices.length}</span>
                            <span className="stat-label">Devices</span>
                        </div>
                    </div>
                </section>

                {/* Devices Section */}
                <section className="devices-section">
                    <div className="section-header">
                        <h3>My Devices</h3>
                        <button className="add-device-btn" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} />
                            Add Device
                        </button>
                    </div>

                    {devices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Camera size={48} />
                            </div>
                            <h4>No devices yet</h4>
                            <p>Add your first camera or viewer to get started</p>
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                                <Plus size={20} />
                                Add First Device
                            </button>
                        </div>
                    ) : (
                        <div className="devices-grid">
                            {devices.map(device => (
                                <div key={device.id} className="device-card">
                                    <div className="device-preview">
                                        {device.type === 'camera' ? (
                                            <Camera size={32} className="device-icon" />
                                        ) : (
                                            <Monitor size={32} className="device-icon" />
                                        )}
                                        <div className={`device-status ${device.status}`}>
                                            <span className="status-dot"></span>
                                            {device.status}
                                        </div>
                                    </div>
                                    <div className="device-info">
                                        <h4>{device.name}</h4>
                                        <span className="device-type">{device.type}</span>
                                    </div>
                                    <div className="device-actions">
                                        <button
                                            className="action-btn primary"
                                            onClick={() => navigate(device.type === 'camera' ? '/camera' : '/viewer')}
                                        >
                                            <Play size={16} />
                                            Connect
                                        </button>
                                        <button
                                            className="action-btn danger"
                                            onClick={() => handleDeleteDevice(device.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button className="nav-btn active">
                    <Home size={22} />
                    <span>Home</span>
                </button>
                <button className="nav-btn" onClick={() => navigate('/viewer')}>
                    <Eye size={22} />
                    <span>Watch</span>
                </button>
                <button className="nav-btn add" onClick={() => setShowAddModal(true)}>
                    <Plus size={28} />
                </button>
                <button className="nav-btn" onClick={() => navigate('/camera')}>
                    <Camera size={22} />
                    <span>Stream</span>
                </button>
                <button className="nav-btn" onClick={() => navigate('/settings')}>
                    <Settings size={22} />
                    <span>Settings</span>
                </button>
            </nav>

            {/* Add Device Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Add New Device</h2>
                        <p className="modal-subtitle">Configure your new camera or viewer</p>

                        <div className="form-group">
                            <label>Device Name</label>
                            <input
                                type="text"
                                value={newDeviceName}
                                onChange={(e) => setNewDeviceName(e.target.value)}
                                placeholder="e.g. Living Room Camera"
                            />
                        </div>

                        <div className="form-group">
                            <label>Device Type</label>
                            <div className="type-selector">
                                <button
                                    className={`type-btn ${newDeviceType === 'camera' ? 'active' : ''}`}
                                    onClick={() => setNewDeviceType('camera')}
                                >
                                    <Camera size={24} />
                                    <span>Camera</span>
                                    <small>Stream video</small>
                                </button>
                                <button
                                    className={`type-btn ${newDeviceType === 'viewer' ? 'active' : ''}`}
                                    onClick={() => setNewDeviceType('viewer')}
                                >
                                    <Monitor size={24} />
                                    <span>Viewer</span>
                                    <small>Watch streams</small>
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleAddDevice}
                                disabled={!newDeviceName.trim()}
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
