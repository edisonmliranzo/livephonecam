import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Plus, Smartphone, Monitor,
    Play, Trash2, Video, Activity, Shield, Sun, Moon, Cloud,
    Bell, Home, LogOut, Wifi, User as UserIcon, Edit2, Check, X
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Device {
    id: string;
    name: string;
    type: 'camera' | 'viewer';
    status: 'online' | 'offline' | 'connecting';
    createdAt: any;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'devices' | 'activity' | 'settings'>('devices');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState<'camera' | 'viewer'>('camera');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

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
        if (!user || !window.confirm('Delete this device?')) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'devices', deviceId));
        } catch (error) {
            console.error('Error deleting device:', error);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/');
    };

    const handleUpdateName = async () => {
        if (!user || !editNameValue.trim()) return;
        try {
            await updateProfile(user, {
                displayName: editNameValue.trim()
            });
            setUser({ ...user, displayName: editNameValue.trim() });
            setIsEditingName(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile name.");
        }
    };

    const startEditingName = () => {
        setEditNameValue(user?.displayName || '');
        setIsEditingName(true);
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return { text: 'Good Morning', icon: <Sun size={18} /> };
        if (hour < 18) return { text: 'Good Afternoon', icon: <Cloud size={18} /> };
        return { text: 'Good Evening', icon: <Moon size={18} /> };
    };

    const greeting = getGreeting();
    const onlineCount = devices.filter(d => d.status === 'online').length;

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        border: '4px solid #e5e7eb',
                        borderTopColor: '#f59e0b',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#6b7280' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>LiveCam</h1>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <Bell size={20} />
                        <span style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            width: 8,
                            height: 8,
                            background: '#ef4444',
                            borderRadius: '50%',
                            border: '2px solid white'
                        }} />
                    </button>
                    <div
                        onClick={handleSignOut}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 16
                        }}
                    >
                        {user?.displayName?.[0] || 'U'}
                    </div>
                </div>
            </header>


            {/* Main Content */}
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
                {/* Welcome */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 8 }}>
                        {greeting.icon}
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{greeting.text}</span>
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>
                        Welcome back, <span style={{ color: '#f59e0b' }}>{user?.displayName?.split(' ')[0] || 'User'}</span>
                    </h2>
                    <p style={{ color: '#6b7280', margin: '8px 0 0', fontSize: 15 }}>
                        {devices.length} device{devices.length !== 1 ? 's' : ''} registered
                        {onlineCount > 0 && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: '#dcfce7',
                                color: '#16a34a',
                                fontSize: 12,
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: 100,
                                marginLeft: 12
                            }}>
                                {onlineCount} online
                            </span>
                        )}
                    </p>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 16,
                    marginBottom: 32
                }}>
                    {[
                        { label: 'Active', value: onlineCount, color: '#16a34a', bg: '#dcfce7', icon: <Activity size={20} /> },
                        { label: 'Today', value: '0h', color: '#2563eb', bg: '#dbeafe', icon: <Video size={20} /> },
                        { label: 'Alerts', value: 0, color: '#ea580c', bg: '#ffedd5', icon: <Shield size={20} /> },
                        { label: 'Devices', value: devices.length, color: '#9333ea', bg: '#f3e8ff', icon: <Smartphone size={20} /> }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'white',
                            borderRadius: 20,
                            padding: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: stat.bg,
                                color: stat.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{stat.value}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Devices Section */}
                {activeTab === 'devices' && (
                    <div style={{
                        background: 'white',
                        borderRadius: 28,
                        padding: 24,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>My Devices</h3>
                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '12px 20px',
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
                                <Plus size={18} />
                                Add Device
                            </button>
                        </div>

                        {devices.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                                <div style={{
                                    width: 100,
                                    height: 100,
                                    background: '#f3f4f6',
                                    borderRadius: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    color: '#d1d5db'
                                }}>
                                    <Camera size={48} />
                                </div>
                                <h4 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>No devices yet</h4>
                                <p style={{ color: '#6b7280', margin: '0 0 24px' }}>Add your first camera or viewer to get started</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '14px 28px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 14,
                                        fontWeight: 700,
                                        fontSize: 15,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(245,158,11,0.35)'
                                    }}
                                >
                                    <Plus size={20} />
                                    Add First Device
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 20
                            }}>
                                {devices.map(device => (
                                    <div key={device.id} style={{
                                        background: '#f8fafc',
                                        borderRadius: 20,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,0,0,0.04)',
                                        transition: 'all 0.3s'
                                    }}>
                                        {/* Preview */}
                                        <div style={{
                                            height: 140,
                                            background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative'
                                        }}>
                                            {device.type === 'camera' ? (
                                                <Camera size={40} style={{ color: '#9ca3af' }} />
                                            ) : (
                                                <Monitor size={40} style={{ color: '#9ca3af' }} />
                                            )}
                                            <div style={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                background: 'rgba(255,255,255,0.95)',
                                                padding: '6px 12px',
                                                borderRadius: 100,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                <span style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: device.status === 'online' ? '#22c55e' : '#9ca3af',
                                                    boxShadow: device.status === 'online' ? '0 0 8px #22c55e' : 'none'
                                                }} />
                                                {device.status}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{device.name}</h4>
                                            <span style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{device.type}</span>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={() => navigate(device.type === 'camera' ? '/camera' : '/viewer')}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                    padding: '12px 16px',
                                                    background: '#111827',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 10,
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Play size={16} />
                                                Connect
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDevice(device.id)}
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: 10,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div style={{
                        background: 'white',
                        borderRadius: 28,
                        padding: 48,
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
                    }}>
                        <Activity size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>No activity yet</h3>
                        <p style={{ color: '#6b7280' }}>Your device activity will appear here</p>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div style={{
                        background: 'white',
                        borderRadius: 28,
                        padding: 24,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
                    }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>Account Settings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 20,
                                background: '#f8fafc',
                                borderRadius: 16
                            }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>Email</div>
                                    <div style={{ color: '#6b7280', fontSize: 14 }}>{user?.email}</div>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 20,
                                background: '#f8fafc',
                                borderRadius: 16
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>Display Name</div>
                                    {isEditingName ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                autoFocus
                                                value={editNameValue}
                                                onChange={(e) => setEditNameValue(e.target.value)}
                                                style={{
                                                    fontSize: 14,
                                                    padding: '4px 8px',
                                                    borderRadius: 6,
                                                    border: '1px solid #d1d5db',
                                                    outline: 'none',
                                                    width: '100%',
                                                    maxWidth: 200
                                                }}
                                            />
                                            <button
                                                onClick={handleUpdateName}
                                                style={{ border: 'none', background: '#dcfce7', color: '#16a34a', borderRadius: 4, padding: 4, cursor: 'pointer' }}
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => setIsEditingName(false)}
                                                style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 4, padding: 4, cursor: 'pointer' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#6b7280', fontSize: 14 }}>{user?.displayName || 'Not set'}</div>
                                    )}
                                </div>
                                {!isEditingName && (
                                    <button
                                        onClick={startEditingName}
                                        style={{
                                            border: 'none',
                                            background: 'white',
                                            padding: 8,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            color: '#6b7280',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSignOut}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: '16px 24px',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    border: 'none',
                                    borderRadius: 14,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    cursor: 'pointer',
                                    marginTop: 12
                                }}
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Beautiful Bottom Navbar */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 12px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 100%)',
                borderTop: '1px solid rgba(0,0,0,0.08)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#f8fafc',
                    padding: 4,
                    borderRadius: 16,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    width: '100%',
                    maxWidth: 400,
                    justifyContent: 'space-between'
                }}>
                    {/* Home */}
                    <button
                        onClick={() => setActiveTab('devices')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            padding: '10px 16px',
                            background: activeTab === 'devices' ? 'white' : 'transparent',
                            border: activeTab === 'devices' ? '2px solid #111827' : '2px solid transparent',
                            borderRadius: 12,
                            color: activeTab === 'devices' ? '#111827' : '#6b7280',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'devices' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            flex: 1,
                            minWidth: 0
                        }}
                    >
                        <Home size={20} />
                        <span>Home</span>
                    </button>

                    {/* Broadcast */}
                    <button
                        onClick={() => navigate('/camera')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            padding: '10px 16px',
                            background: 'transparent',
                            border: '2px solid transparent',
                            borderRadius: 12,
                            color: '#6b7280',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flex: 1,
                            minWidth: 0
                        }}
                    >
                        <Wifi size={20} />
                        <span>Broadcast</span>
                    </button>

                    {/* View */}
                    <button
                        onClick={() => navigate('/viewer')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            padding: '10px 16px',
                            background: 'transparent',
                            border: '2px solid transparent',
                            borderRadius: 12,
                            color: '#6b7280',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flex: 1,
                            minWidth: 0
                        }}
                    >
                        <Monitor size={20} />
                        <span>View</span>
                    </button>

                    {/* Account */}
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            padding: '10px 16px',
                            background: activeTab === 'settings' ? 'white' : 'transparent',
                            border: activeTab === 'settings' ? '2px solid #111827' : '2px solid transparent',
                            borderRadius: 12,
                            color: activeTab === 'settings' ? '#111827' : '#6b7280',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'settings' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            flex: 1,
                            minWidth: 0
                        }}
                    >
                        <UserIcon size={20} />
                        <span>Account</span>
                    </button>
                </div>
            </nav>

            {/* Add Device Modal */}
            {showAddModal && (
                <div
                    onClick={() => setShowAddModal(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            background: 'white',
                            borderRadius: 28,
                            padding: 32
                        }}
                    >
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Add New Device</h2>
                        <p style={{ color: '#6b7280', margin: '0 0 24px' }}>Configure your new camera or viewer</p>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 8
                            }}>Device Name</label>
                            <input
                                type="text"
                                value={newDeviceName}
                                onChange={(e) => setNewDeviceName(e.target.value)}
                                placeholder="e.g. Living Room Camera"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 14,
                                    fontSize: 16,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 8
                            }}>Device Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <button
                                    onClick={() => setNewDeviceType('camera')}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: 20,
                                        border: `2px solid ${newDeviceType === 'camera' ? '#f59e0b' : '#e5e7eb'}`,
                                        borderRadius: 16,
                                        background: newDeviceType === 'camera' ? '#fffbeb' : 'white',
                                        color: newDeviceType === 'camera' ? '#f59e0b' : '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Camera size={28} />
                                    <span style={{ fontWeight: 700, color: newDeviceType === 'camera' ? '#d97706' : '#374151' }}>Camera</span>
                                    <small style={{ fontSize: 11, color: '#9ca3af' }}>Stream video</small>
                                </button>
                                <button
                                    onClick={() => setNewDeviceType('viewer')}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: 20,
                                        border: `2px solid ${newDeviceType === 'viewer' ? '#f59e0b' : '#e5e7eb'}`,
                                        borderRadius: 16,
                                        background: newDeviceType === 'viewer' ? '#fffbeb' : 'white',
                                        color: newDeviceType === 'viewer' ? '#f59e0b' : '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Monitor size={28} />
                                    <span style={{ fontWeight: 700, color: newDeviceType === 'viewer' ? '#d97706' : '#374151' }}>Viewer</span>
                                    <small style={{ fontSize: 11, color: '#9ca3af' }}>Watch streams</small>
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: 14,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDevice}
                                disabled={!newDeviceName.trim()}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    background: newDeviceName.trim() ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#e5e7eb',
                                    color: newDeviceName.trim() ? 'white' : '#9ca3af',
                                    border: 'none',
                                    borderRadius: 14,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    cursor: newDeviceName.trim() ? 'pointer' : 'not-allowed',
                                    boxShadow: newDeviceName.trim() ? '0 4px 14px rgba(245,158,11,0.35)' : 'none'
                                }}
                            >
                                Add Device
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
