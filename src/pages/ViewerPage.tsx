import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Video, Wifi, Smartphone, RefreshCw,
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

    // Live View Screen - Mobile-first fullscreen video
    return (
        <div style={{
            minHeight: '100vh',
            height: '100vh',
            background: '#111827',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Top Header Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                padding: '16px 16px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                {/* Left - Back + Camera Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={handleDisconnect}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '8px 12px',
                            borderRadius: 20,
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        padding: '10px 16px',
                        borderRadius: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <p style={{
                            fontSize: 10,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 2
                        }}>
                            Watching
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                            {selectedCamera?.deviceName}
                        </p>
                    </div>
                </div>

                {/* Right - Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {/* Live Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: '#ef4444',
                        borderRadius: 20,
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700
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

                    {/* Connection Status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: stream ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                        border: `1px solid ${stream ? 'rgba(34,197,94,0.5)' : 'rgba(251,191,36,0.5)'}`,
                        borderRadius: 20,
                        color: stream ? '#86efac' : '#fcd34d',
                        fontSize: 11,
                        fontWeight: 600
                    }}>
                        {stream ? <Wifi size={12} /> : <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                        {stream ? 'Connected' : 'Connecting...'}
                    </div>
                </div>
            </div>

            {/* Full Screen Video */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000'
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
                            objectFit: 'contain'
                        }}
                    />
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 24,
                        color: 'white'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            border: '3px solid rgba(251,191,36,0.3)',
                            borderTopColor: '#fbbf24',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ fontWeight: 600 }}>Connecting to camera...</p>
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>{selectedCamera?.id}</p>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                padding: '24px 16px',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16
                }}>
                    {/* Mute Button */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)',
                            border: `2px solid ${isMuted ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.3)'}`,
                            color: isMuted ? '#f87171' : 'white',
                            cursor: 'pointer'
                        }}
                    >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>

                    {/* Disconnect Button */}
                    <button
                        onClick={handleDisconnect}
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ef4444',
                            border: '2px solid #f87171',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(239,68,68,0.5)'
                        }}
                    >
                        <WifiOff size={28} />
                    </button>

                    {/* Screenshot Button */}
                    <button
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.15)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <Camera size={24} />
                    </button>
                </div>

                {/* Camera Name */}
                <p style={{
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'monospace'
                }}>
                    {selectedCamera?.id}
                </p>
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

