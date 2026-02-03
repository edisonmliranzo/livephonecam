import { Mic, MicOff, Video, VideoOff, Activity, StopCircle, Wifi, Users, Copy, Check, ArrowLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isMotionDetectionActive, setIsMotionDetectionActive] = useState(false);
    const [deviceId] = useState('CAM-' + Math.floor(1000 + Math.random() * 9000));
    const [copied, setCopied] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // WebRTC State
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'offline' | 'waiting' | 'connected'>('offline');
    const [viewerCount, setViewerCount] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [lastMotionTime, setLastMotionTime] = useState<Date | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (recordedChunks.length > 0) {
            console.log(`Saved ${recordedChunks.length} clips internally.`);
        }
    }, [recordedChunks]);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            cleanupSignal();
        };
    }, []);

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
        if (deviceId) {
            try {
                await deleteDoc(doc(db, 'cameras', deviceId));
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
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            initializeSignaling(mediaStream);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const initializeSignaling = async (mediaStream: MediaStream) => {
        setConnectionStatus('waiting');
        const peerConnection = new RTCPeerConnection(servers);

        mediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, mediaStream);
        });

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

        await setDoc(callDoc, { offer, online: true, updatedAt: serverTimestamp() });

        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!peerConnection.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                peerConnection.setRemoteDescription(answerDescription);
                setConnectionStatus('connected');
                setViewerCount(1);
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
                setViewerCount(0);
            }
        };

        setPc(peerConnection);
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
                    setRecordedChunks(prev => [...prev, blob]);
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

    const copyDeviceId = () => {
        navigator.clipboard.writeText(deviceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStopAndExit = () => {
        stopCamera();
        navigate(isLoggedIn ? '/dashboard' : '/');
    };

    return (
        <div className="h-screen bg-gray-900 relative flex flex-col overflow-hidden">
            {/* Top Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 safe-top px-6 py-4 bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none">
                <div className="flex justify-between items-start">
                    {/* Left Side - Status */}
                    <div className="flex flex-col gap-3 pointer-events-auto">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium w-fit"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>

                        {/* Live/Recording Status */}
                        <div className={`w-fit backdrop-blur-xl px-4 py-2 rounded-full border flex items-center gap-2.5 transition-colors ${isRecording
                            ? 'bg-red-500/30 border-red-400/50'
                            : 'bg-white/10 border-white/20'
                            }`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${isRecording
                                ? 'bg-red-500 animate-pulse'
                                : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                }`} />
                            <span className="text-white text-xs font-bold tracking-widest">
                                {isRecording ? 'RECORDING' : 'BROADCASTING'}
                            </span>
                        </div>

                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`backdrop-blur-xl px-3 py-1.5 rounded-full border flex items-center gap-2 ${connectionStatus === 'connected'
                                ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                                : 'bg-white/10 border-white/20 text-white/70'
                                }`}>
                                <Wifi size={12} />
                                <span className="text-[10px] font-bold tracking-wider uppercase">{connectionStatus}</span>
                            </div>

                            {connectionStatus === 'connected' && (
                                <div className="backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white flex items-center gap-2">
                                    <Users size={12} />
                                    <span className="text-[10px] font-bold">{viewerCount} Watching</span>
                                </div>
                            )}
                        </div>

                        {/* Motion Detection Indicator */}
                        {lastMotionTime && (
                            <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 animate-fade-in">
                                <Activity size={12} className="text-amber-400" />
                                <span className="text-white/80 text-[10px] font-mono tracking-wide">
                                    Motion {Math.floor((new Date().getTime() - lastMotionTime.getTime()) / 1000)}s ago
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Device ID */}
                    <div
                        className="bg-white backdrop-blur-xl px-5 py-3 rounded-2xl text-right shadow-xl pointer-events-auto cursor-pointer hover:shadow-2xl transition-all group"
                        onClick={copyDeviceId}
                    >
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold">Device ID</p>
                        <p className="text-xl font-mono font-bold tracking-widest flex items-center gap-2" style={{ color: '#b45309' }}>
                            {deviceId}
                            {copied ? (
                                <Check size={16} className="text-green-500" />
                            ) : (
                                <Copy size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            )}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1">Tap to copy</p>
                    </div>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-950">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover absolute inset-0"
                />

                {/* Video Disabled Overlay */}
                {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center flex-col gap-6 animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <VideoOff size={40} className="text-gray-500" />
                        </div>
                        <p className="text-gray-400 font-medium tracking-wide">Video Paused</p>
                    </div>
                )}

                {/* Rule of Thirds Grid */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.08]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '33.3% 33.3%'
                    }}
                />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 safe-bottom px-6 pb-8 pt-24 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                <div className="flex items-center justify-center gap-6 max-w-lg mx-auto">
                    {/* Motion Detection */}
                    <button
                        onClick={() => setIsMotionDetectionActive(!isMotionDetectionActive)}
                        className={`w-14 h-14 rounded-full backdrop-blur-xl border transition-all flex items-center justify-center ${isMotionDetectionActive
                            ? 'text-white shadow-lg'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                            }`}
                        style={isMotionDetectionActive ? {
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            borderColor: 'transparent',
                            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
                        } : {}}
                        title="Motion Detection"
                    >
                        <Activity size={24} className={isMotionDetectionActive ? 'animate-pulse' : ''} />
                    </button>

                    {/* Main Controls */}
                    <div className="flex gap-4">
                        <button
                            onClick={toggleVideo}
                            className={`w-16 h-16 rounded-full backdrop-blur-xl border transition-all flex items-center justify-center ${isVideoEnabled
                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                : 'bg-red-500/30 border-red-400/50 text-red-400'
                                }`}
                        >
                            {isVideoEnabled ? <Video size={28} /> : <VideoOff size={28} />}
                        </button>

                        <button
                            onClick={toggleAudio}
                            className={`w-16 h-16 rounded-full backdrop-blur-xl border transition-all flex items-center justify-center ${isAudioEnabled
                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                : 'bg-red-500/30 border-red-400/50 text-red-400'
                                }`}
                        >
                            {isAudioEnabled ? <Mic size={28} /> : <MicOff size={28} />}
                        </button>
                    </div>

                    {/* Stop Button */}
                    <button
                        className="w-14 h-14 rounded-full bg-red-500 backdrop-blur-xl border border-red-400 text-white hover:bg-red-600 transition-all flex items-center justify-center shadow-lg"
                        style={{ boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' }}
                        onClick={handleStopAndExit}
                        title="Stop Broadcasting"
                    >
                        <StopCircle size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
