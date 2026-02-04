import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Video, Wifi, Maximize2, LayoutGrid,
    Smartphone, RefreshCw,
    Volume2, VolumeX, ArrowLeft, WifiOff, Radio
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDoc, updateDoc, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

interface OnlineCamera {
    id: string;
    deviceName: string;
    userName: string;
    online: boolean;
    updatedAt: any;
}

export default function ViewerPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [onlineCameras, setOnlineCameras] = useState<OnlineCamera[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState<OnlineCamera | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingCameras, setLoadingCameras] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

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

    // Listen for online cameras from the same account
    useEffect(() => {
        if (!user) return;

        const camerasRef = collection(db, 'cameras');
        const q = query(
            camerasRef,
            where('userId', '==', user.uid),
            where('online', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cameras: OnlineCamera[] = [];
            snapshot.forEach((doc) => {
                cameras.push({
                    id: doc.id,
                    ...doc.data()
                } as OnlineCamera);
            });
            setOnlineCameras(cameras);
            setLoadingCameras(false);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isConnected]);

    const handleConnect = async (camera: OnlineCamera) => {
        setLoading(true);
        setSelectedCamera(camera);
        setStream(null);

        try {
            const callDoc = doc(db, 'cameras', camera.id);
            const snapshot = await getDoc(callDoc);

            if (!snapshot.exists()) {
                alert("Camera is no longer available.");
                setLoading(false);
                setSelectedCamera(null);
                return;
            }

            const peerConnection = new RTCPeerConnection(servers);

            peerConnection.ontrack = (event) => {
                console.log("Stream received");
                setStream(event.streams[0]);
            };

            const answerCandidates = collection(callDoc, 'answerCandidates');
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    addDoc(answerCandidates, event.candidate.toJSON());
                }
            };

            const offer = snapshot.data().offer;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answerDescription = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answerDescription);

            const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
            };

            await updateDoc(callDoc, { answer });

            const offerCandidates = collection(callDoc, 'offerCandidates');
            onSnapshot(offerCandidates, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        peerConnection.addIceCandidate(candidate);
                    }
                });
            });

            setPc(peerConnection);
            setIsConnected(true);

        } catch (error) {
            console.error("Connection failed:", error);
            alert("Failed to connect to camera.");
            setSelectedCamera(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = () => {
        if (pc) {
            pc.close();
        }
        setPc(null);
        setStream(null);
        setIsConnected(false);
        setSelectedCamera(null);
    };

    // Camera Selection Screen
    if (!isConnected) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
                padding: 24
            }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'none',
                                border: 'none',
                                color: '#92400e',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: 24
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>

                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                            Live Cameras
                        </h1>
                        <p style={{ color: '#6b7280' }}>
                            Select a camera from your account to start viewing
                        </p>
                    </div>

                    {/* Camera List */}
                    <div style={{
                        background: 'white',
                        borderRadius: 24,
                        padding: 24,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
                    }}>
                        {loadingCameras ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: 48,
                                color: '#6b7280'
                            }}>
                                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                                <p style={{ marginTop: 16 }}>Looking for cameras...</p>
                            </div>
                        ) : onlineCameras.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: 48,
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16
                                }}>
                                    <Camera size={36} style={{ color: '#9ca3af' }} />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                                    No cameras online
                                </h3>
                                <p style={{ color: '#6b7280', marginBottom: 24 }}>
                                    Start broadcasting from another device to see it here
                                </p>
                                <button
                                    onClick={() => navigate('/camera')}
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Radio size={18} />
                                    Start Broadcasting
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <p style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    marginBottom: 8
                                }}>
                                    {onlineCameras.length} Camera{onlineCameras.length !== 1 ? 's' : ''} Online
                                </p>

                                {onlineCameras.map((camera) => (
                                    <button
                                        key={camera.id}
                                        onClick={() => handleConnect(camera)}
                                        disabled={loading}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: 20,
                                            background: '#f8fafc',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: 16,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s',
                                            opacity: loading ? 0.5 : 1
                                        }}
                                    >
                                        <div style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 12,
                                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Video size={24} style={{ color: 'white' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                                                {camera.deviceName}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                                                {camera.id}
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 12px',
                                            background: '#dcfce7',
                                            borderRadius: 20,
                                            color: '#16a34a',
                                            fontSize: 12,
                                            fontWeight: 700
                                        }}>
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: '#22c55e',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                            LIVE
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Card */}
                    <div style={{
                        marginTop: 24,
                        padding: 20,
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <Smartphone size={24} style={{ color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                                Multi-device streaming
                            </div>
                            <div style={{ fontSize: 14, color: '#6b7280' }}>
                                Use multiple phones as cameras and view them all from any device
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Live View Screen
    return (
        <div style={{ minHeight: '100vh', height: '100vh', display: 'flex', background: '#f3f4f6' }}>
            {/* Sidebar - Desktop */}
            <aside style={{
                width: 280,
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
            }} className="hidden lg:flex">
                <div style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                        LivePhoneCam
                    </h2>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>Viewing live feed</p>
                </div>

                <nav style={{ flex: 1, padding: '0 16px' }}>
                    <p style={{
                        padding: '12px 16px',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 1
                    }}>
                        Active Connection
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 16,
                        background: 'rgba(245,158,11,0.1)',
                        border: '2px solid #fbbf24',
                        borderRadius: 12
                    }}>
                        <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: stream ? '#22c55e' : '#fbbf24',
                            animation: stream ? 'none' : 'pulse 1s infinite'
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#92400e' }}>
                                {selectedCamera?.deviceName}
                            </div>
                            <div style={{ fontSize: 11, color: '#b45309', fontFamily: 'monospace' }}>
                                {selectedCamera?.id}
                            </div>
                        </div>
                    </div>

                    {/* Other online cameras */}
                    {onlineCameras.filter(c => c.id !== selectedCamera?.id).length > 0 && (
                        <>
                            <p style={{
                                padding: '24px 16px 12px',
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: 1
                            }}>
                                Other Cameras
                            </p>
                            {onlineCameras.filter(c => c.id !== selectedCamera?.id).map(camera => (
                                <button
                                    key={camera.id}
                                    onClick={() => {
                                        handleDisconnect();
                                        setTimeout(() => handleConnect(camera), 100);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: 12,
                                        background: 'none',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 12,
                                        cursor: 'pointer',
                                        marginBottom: 8
                                    }}
                                >
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#22c55e'
                                    }} />
                                    <span style={{ fontSize: 14, color: '#374151' }}>{camera.deviceName}</span>
                                </button>
                            ))}
                        </>
                    )}
                </nav>

                <div style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
                    <button
                        onClick={handleDisconnect}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: 12,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 12,
                            color: '#dc2626',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <WifiOff size={18} />
                        Disconnect
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header Bar */}
                <div style={{
                    height: 64,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    background: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                            onClick={handleDisconnect}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer'
                            }}
                            className="lg:hidden"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <h1 style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
                            {selectedCamera?.deviceName}
                        </h1>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: stream ? '#dcfce7' : '#fef3c7',
                            color: stream ? '#16a34a' : '#92400e',
                            border: `1px solid ${stream ? '#bbf7d0' : '#fde68a'}`
                        }}>
                            {stream ? 'Live' : 'Connecting...'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: 4,
                            background: '#f3f4f6',
                            borderRadius: 12
                        }}>
                            <button style={{
                                padding: 8,
                                borderRadius: 8,
                                background: 'white',
                                border: 'none',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                cursor: 'pointer'
                            }}>
                                <Maximize2 size={16} />
                            </button>
                            <button style={{
                                padding: 8,
                                borderRadius: 8,
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer'
                            }}>
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Area */}
                <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: 1200,
                        margin: '0 auto',
                        background: 'white',
                        borderRadius: 24,
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Video Top Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            padding: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                            zIndex: 10,
                            pointerEvents: 'none'
                        }}>
                            <div style={{
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <div style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: 'white',
                                    animation: 'pulse 1s infinite'
                                }} />
                                LIVE
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                background: 'white',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                color: stream ? '#16a34a' : '#f59e0b'
                            }}>
                                {stream ? <Wifi size={14} /> : <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                {stream ? 'Connected' : 'Connecting'}
                            </div>
                        </div>

                        {/* Video Feed */}
                        <div style={{
                            flex: 1,
                            background: '#111827',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {stream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted={isMuted}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    color: '#6b7280',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 24
                                }}>
                                    <div style={{
                                        width: 96,
                                        height: 96,
                                        borderRadius: '50%',
                                        border: '2px dashed #374151',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Camera size={40} style={{ opacity: 0.5 }} />
                                    </div>
                                    <p style={{ fontSize: 14, fontWeight: 500 }}>Waiting for stream...</p>
                                </div>
                            )}
                        </div>

                        {/* Controls Footer */}
                        <div style={{
                            height: 64,
                            background: 'white',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 24px'
                        }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${isMuted ? '#fecaca' : '#e5e7eb'}`,
                                        background: isMuted ? '#fef2f2' : '#f3f4f6',
                                        color: isMuted ? '#dc2626' : '#374151',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <button style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e5e7eb',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    cursor: 'pointer'
                                }}>
                                    <Camera size={18} />
                                </button>
                            </div>

                            <button
                                onClick={handleDisconnect}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 20px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: 12,
                                    color: '#dc2626',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <WifiOff size={16} />
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
