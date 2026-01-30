import { Mic, MicOff, Video, VideoOff, Activity, StopCircle, Wifi, Users } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isMotionDetectionActive, setIsMotionDetectionActive] = useState(false);
    const [deviceId] = useState('CAM-' + Math.floor(1000 + Math.random() * 9000));

    // WebRTC State
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'offline' | 'waiting' | 'connected'>('offline');
    const [viewerCount, setViewerCount] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [lastMotionTime, setLastMotionTime] = useState<Date | null>(null);

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
                // Ideally, we'd delete the subcollections too, but Firestore client generic delete doesn't handle recursive.
                // For a prototype, just marking offline is okay or deleting the main doc.
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
            // Initialize WebRTC Signaling
            initializeSignaling(mediaStream);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const initializeSignaling = async (mediaStream: MediaStream) => {
        setConnectionStatus('waiting');
        const peerConnection = new RTCPeerConnection(servers);

        // Add local stream tracks to PeerConnection
        mediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, mediaStream);
        });

        // Setup Signaling in Firestore
        const callDoc = doc(db, 'cameras', deviceId);
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(offerCandidates, event.candidate.toJSON());
            }
        };

        // Create Offer
        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await setDoc(callDoc, { offer, online: true, updatedAt: serverTimestamp() });

        // Listen for Answer
        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!peerConnection.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                peerConnection.setRemoteDescription(answerDescription);
                setConnectionStatus('connected');
                setViewerCount(1); // Assumption for 1-1
            }
        });

        // Listen for Remote ICE Candidates
        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    peerConnection.addIceCandidate(candidate);
                }
            });
        });

        // Monitor connection state
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

    return (
        <div className="h-screen bg-black relative flex flex-col overflow-hidden">
            {/* Top Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 pt-12 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-3">
                    <div className={`backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2.5 transition-colors ${isRecording ? 'bg-red-500/20 border-red-500/50' : 'bg-black/40'
                        }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
                        <span className="text-white text-xs font-bold tracking-widest">{isRecording ? 'RECORDING' : 'LIVE'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`backdrop-blur-md px-3 py-1.5 rounded-full border flex items-center gap-2 ${connectionStatus === 'connected' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-zinc-400'
                            }`}>
                            <Wifi size={12} />
                            <span className="text-[10px] font-bold tracking-wider uppercase">{connectionStatus}</span>
                        </div>
                        {connectionStatus === 'connected' && (
                            <div className="backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-white flex items-center gap-2">
                                <Users size={12} />
                                <span className="text-[10px] font-bold">{viewerCount} Watching</span>
                            </div>
                        )}
                    </div>

                    {lastMotionTime && (
                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 animate-fade-in">
                            <Activity size={12} className="text-indigo-400" />
                            <span className="text-gray-300 text-[10px] font-mono tracking-wide">
                                Motion {Math.floor((new Date().getTime() - lastMotionTime.getTime()) / 1000)}s ago
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-right shadow-lg pointer-events-auto cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => navigator.clipboard.writeText(deviceId)}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-semibold">Device ID</p>
                    <p className="text-xl font-mono font-bold text-white tracking-widest">{deviceId}</p>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted // Muted locally
                    className="w-full h-full object-cover absolute inset-0"
                />
                {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center flex-col gap-6 animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <VideoOff size={40} className="text-gray-500" />
                        </div>
                        <p className="text-gray-400 font-medium tracking-wide">Video Transmission Paused</p>
                    </div>
                )}

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '33.3% 33.3%'
                    }}>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-12 pt-24 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                <div className="flex items-center justify-center gap-8 max-w-lg mx-auto">
                    <button
                        onClick={() => setIsMotionDetectionActive(!isMotionDetectionActive)}
                        className={`w-14 h-14 rounded-full backdrop-blur-xl border transition-all flex items-center justify-center group ${isMotionDetectionActive
                            ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                            : 'bg-white/10 border-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                        title="Motion Detection"
                    >
                        <Activity size={24} className={isMotionDetectionActive ? 'animate-pulse' : ''} />
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={toggleVideo}
                            className={`w-16 h-16 rounded-full backdrop-blur-xl border transition-all flex items-center justify-center ${isVideoEnabled
                                ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                : 'bg-red-500/20 border-red-500/50 text-red-400'
                                }`}
                        >
                            {isVideoEnabled ? <Video size={28} /> : <VideoOff size={28} />}
                        </button>

                        <button
                            onClick={toggleAudio}
                            className={`w-16 h-16 rounded-full backdrop-blur-xl border transition-all flex items-center justify-center ${isAudioEnabled
                                ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                : 'bg-red-500/20 border-red-500/50 text-red-400'
                                }`}
                        >
                            {isAudioEnabled ? <Mic size={28} /> : <MicOff size={28} />}
                        </button>
                    </div>

                    <button
                        className="w-14 h-14 rounded-full bg-red-500/20 backdrop-blur-xl border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg hover:shadow-red-500/30"
                        onClick={stopCamera}
                        title="Stop Camera"
                    >
                        <StopCircle size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
