import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Video, Smartphone, RefreshCw,
    Volume2, VolumeX, ArrowLeft, Radio
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
                minHeight: '100dvh',
                background: '#f3f4f6',
                padding: '16px 16px 80px 16px' // Added bottom padding for navbar
            }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                            Live Cameras
                        </h1>
                        <p style={{ fontSize: 14, color: '#6b7280' }}>
                            Select a camera to view
                        </p>
                    </div>

                    {/* Camera List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {loadingCameras ? (
                            <div style={{
                                background: 'white',
                                borderRadius: 16,
                                padding: 32,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                color: '#6b7280'
                            }}>
                                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                <p style={{ marginTop: 12, fontSize: 14 }}>Searching...</p>
                            </div>
                        ) : onlineCameras.length === 0 ? (
                            <div style={{
                                background: 'white',
                                borderRadius: 16,
                                padding: 32,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 16
                            }}>
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Camera size={24} style={{ color: '#9ca3af' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                                        No cameras found
                                    </h3>
                                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                                        Start broadcasting on another device first
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/camera')}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        padding: '12px',
                                        background: '#111827',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 12,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Radio size={16} />
                                    Broadcast Now
                                </button>
                            </div>
                        ) : (
                            onlineCameras.map((camera) => (
                                <button
                                    key={camera.id}
                                    onClick={() => handleConnect(camera)}
                                    disabled={loading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: 12,
                                        background: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 16,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        opacity: loading ? 0.7 : 1,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Thumbnail Placeholder */}
                                    <div style={{
                                        width: 80,
                                        height: 60,
                                        borderRadius: 8,
                                        background: '#111827',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Video size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: '#111827',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {camera.deviceName}
                                        </div>
                                        <div style={{
                                            fontSize: 11,
                                            color: '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                                            Online Now
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#111827'
                                    }}>
                                        <Video size={14} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Live View Screen - Mobile-first fullscreen video
    return (
        <div style={{
            minHeight: '100dvh', // Use dynamic viewport height
            height: '100dvh',
            background: '#000', // True black background
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
                paddingTop: 'max(16px, env(safe-area-inset-top))',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                pointerEvents: 'none' // Let clicks pass through to video/controls
            }}>
                {/* Left - Back + Camera Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'auto' }}>
                    <button
                        onClick={handleDisconnect}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.1)',
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
                </div>

                {/* Right - Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {/* Live Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        background: '#ef4444',
                        borderRadius: 6,
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
                    }}>
                        LIVE
                    </div>
                </div>
            </div>

            {/* Scale/Video Mode Button */}
            <button
                style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                <Smartphone size={20} />
            </button>

            {/* Full Screen Video */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                position: 'relative'
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
                            objectFit: 'cover', // Enable immersive full screen
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
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            border: '3px solid rgba(251,191,36,0.3)',
                            borderTopColor: '#fbbf24',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ fontWeight: 600, fontSize: 14 }}>Connecting...</p>
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
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 32,
                    pointerEvents: 'auto'
                }}>
                    {/* Mute Button */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(4px)',
                            border: 'none',
                            color: isMuted ? '#f87171' : 'white',
                            cursor: 'pointer'
                        }}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* Disconnect Button (Main) */}
                    <button
                        onClick={handleDisconnect}
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ef4444',
                            border: '4px solid rgba(239,68,68,0.3)',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(239,68,68,0.4)'
                        }}
                    >
                        <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
                    </button>

                    {/* Placeholder for symmetry */}
                    <div style={{ width: 50 }} />
                </div>

                {/* Camera Name Label */}
                <div style={{
                    textAlign: 'center',
                    marginTop: 20,
                    opacity: 0.7
                }}>
                    <span style={{
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        color: 'white',
                        fontWeight: 600
                    }}>
                        {selectedCamera?.deviceName}
                    </span>
                </div>
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

