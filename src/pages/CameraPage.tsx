import { Mic, MicOff, Video, VideoOff, Activity, StopCircle, Wifi, Users, ArrowLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

// WebRTC Configuration
const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export default function CameraPage() {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [user, setUser] = useState<User | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isMotionDetectionActive, setIsMotionDetectionActive] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [deviceName, setDeviceName] = useState('');

    // WebRTC State
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'offline' | 'waiting' | 'connected'>('offline');
    const [viewerCount, setViewerCount] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [lastMotionTime, setLastMotionTime] = useState<Date | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Generate unique device ID for this broadcast session
                const newDeviceId = `CAM-${Date.now().toString(36).toUpperCase()}`;
                setDeviceId(newDeviceId);
                setDeviceName(`${currentUser.displayName?.split(' ')[0] || 'My'}'s Camera`);
            } else {
                navigate('/auth');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (user && deviceId) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [user, deviceId]);

    // Motion Detection Simulation
    useEffect(() => {
        let interval: any;
        if (isMotionDetectionActive) {
            interval = setInterval(() => {
                if (Math.random() > 0.8 && !isRecording) {
                    triggerMotionRecording();
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isMotionDetectionActive, isRecording]);

    const cleanupSignal = async () => {
        if (user && deviceId) {
            try {
                // Delete from global cameras collection
                await deleteDoc(doc(db, 'cameras', deviceId));
                // Update user's device status
                await deleteDoc(doc(db, 'users', user.uid, 'broadcasts', deviceId));
            } catch (e) {
                console.error("Cleanup error", e);
            }
        }
        if (pc) {
            pc.close();
        }
    };

    const triggerMotionRecording = () => {
        setLastMotionTime(new Date());
        startRecording();
        setTimeout(() => {
            stopRecording();
        }, 5000);
    };

    const startCamera = async () => {
        if (!user || !deviceId) return;

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            await initializeSignaling(mediaStream);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const initializeSignaling = async (mediaStream: MediaStream) => {
        if (!user) return;

        setConnectionStatus('waiting');
        const peerConnection = new RTCPeerConnection(servers);

        mediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, mediaStream);
        });

        // Create call document in global cameras collection
        const callDoc = doc(db, 'cameras', deviceId);
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(offerCandidates, event.candidate.toJSON());
            }
        };

        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        // Save to global cameras collection with user info
        await setDoc(callDoc, {
            offer,
            online: true,
            userId: user.uid,
            userName: user.displayName || 'Unknown',
            deviceName: deviceName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Also save to user's broadcasts collection for easy querying
        await setDoc(doc(db, 'users', user.uid, 'broadcasts', deviceId), {
            deviceId,
            deviceName,
            online: true,
            createdAt: serverTimestamp()
        });

        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!peerConnection.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                peerConnection.setRemoteDescription(answerDescription);
                setConnectionStatus('connected');
                setViewerCount(prev => prev + 1);
            }
        });

        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    peerConnection.addIceCandidate(candidate);
                }
            });
        });

        peerConnection.onconnectionstatechange = () => {
            if (peerConnection.connectionState === 'disconnected') {
                setConnectionStatus('waiting');
                setViewerCount(prev => Math.max(0, prev - 1));
            }
        };

        // Heartbeat to keep broadcast alive
        const heartbeat = setInterval(async () => {
            try {
                await updateDoc(callDoc, { updatedAt: serverTimestamp() });
            } catch (e) {
                console.log("Heartbeat stopped");
            }
        }, 30000);

        setPc(peerConnection);

        return () => clearInterval(heartbeat);
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        cleanupSignal();
        setConnectionStatus('offline');
    };

    const startRecording = () => {
        if (stream && !isRecording) {
            try {
                const recorder = new MediaRecorder(stream);
                const chunks: Blob[] = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    console.log("Recording saved:", blob.size, "bytes");
                };
                recorder.start();
                mediaRecorderRef.current = recorder;
                setIsRecording(true);
            } catch (e) {
                console.error("Failed to start recorder", e);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !isAudioEnabled);
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const handleStopAndExit = () => {
        stopCamera();
        navigate('/dashboard');
    };

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            background: '#111827',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Top Status Bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                padding: '24px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left Side - Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'auto' }}>
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>

                        {/* Live/Recording Status */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 16px',
                            background: isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
                            border: `1px solid ${isRecording ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`,
                            borderRadius: 24
                        }}>
                            <div style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: isRecording ? '#ef4444' : '#22c55e',
                                animation: isRecording ? 'pulse 1s infinite' : 'none',
                                boxShadow: isRecording ? 'none' : '0 0 10px rgba(34,197,94,0.5)'
                            }} />
                            <span style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
                                {isRecording ? 'RECORDING' : 'BROADCASTING'}
                            </span>
                        </div>

                        {/* Connection Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                background: connectionStatus === 'connected' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)',
                                border: `1px solid ${connectionStatus === 'connected' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.2)'}`,
                                borderRadius: 24,
                                color: connectionStatus === 'connected' ? '#fcd34d' : 'rgba(255,255,255,0.7)'
                            }}>
                                <Wifi size={12} />
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{connectionStatus}</span>
                            </div>

                            {viewerCount > 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 24,
                                    color: 'white'
                                }}>
                                    <Users size={12} />
                                    <span style={{ fontSize: 10, fontWeight: 700 }}>{viewerCount} Watching</span>
                                </div>
                            )}
                        </div>

                        {/* Motion Detection Indicator */}
                        {lastMotionTime && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 24
                            }}>
                                <Activity size={12} style={{ color: '#fbbf24' }} />
                                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: 'monospace' }}>
                                    Motion {Math.floor((new Date().getTime() - lastMotionTime.getTime()) / 1000)}s ago
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Device Info */}
                    <div style={{
                        background: 'white',
                        padding: '12px 20px',
                        borderRadius: 16,
                        textAlign: 'right',
                        pointerEvents: 'auto'
                    }}>
                        <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                            Broadcasting as
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#b45309' }}>
                            {deviceName}
                        </p>
                        <p style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
                            {deviceId}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Video Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#030712',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        inset: 0
                    }}
                />

                {/* Video Disabled Overlay */}
                {!isVideoEnabled && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(17,24,39,0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 24
                    }}>
                        <div style={{
                            width: 96,
                            height: 96,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <VideoOff size={40} style={{ color: '#6b7280' }} />
                        </div>
                        <p style={{ color: '#9ca3af', fontWeight: 500 }}>Video Paused</p>
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
                padding: '96px 24px 32px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 24,
                    maxWidth: 400,
                    margin: '0 auto'
                }}>
                    {/* Motion Detection */}
                    <button
                        onClick={() => setIsMotionDetectionActive(!isMotionDetectionActive)}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: isMotionDetectionActive
                                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                : 'rgba(255,255,255,0.1)',
                            border: isMotionDetectionActive ? 'none' : '1px solid rgba(255,255,255,0.2)',
                            color: isMotionDetectionActive ? 'white' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isMotionDetectionActive ? '0 0 20px rgba(251,191,36,0.4)' : 'none'
                        }}
                    >
                        <Activity size={24} />
                    </button>

                    {/* Main Controls */}
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button
                            onClick={toggleVideo}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: isVideoEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)',
                                border: `1px solid ${isVideoEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.5)'}`,
                                color: isVideoEnabled ? 'white' : '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {isVideoEnabled ? <Video size={28} /> : <VideoOff size={28} />}
                        </button>

                        <button
                            onClick={toggleAudio}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: isAudioEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)',
                                border: `1px solid ${isAudioEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.5)'}`,
                                color: isAudioEnabled ? 'white' : '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {isAudioEnabled ? <Mic size={28} /> : <MicOff size={28} />}
                        </button>
                    </div>

                    {/* Stop Button */}
                    <button
                        onClick={handleStopAndExit}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: '#ef4444',
                            border: '1px solid #f87171',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(239,68,68,0.4)'
                        }}
                    >
                        <StopCircle size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
