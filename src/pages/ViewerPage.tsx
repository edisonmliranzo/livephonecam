import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Video, Wifi, Maximize2, LayoutGrid,
    LogOut, ChevronRight, Smartphone, Plus, RefreshCw,
    Volume2, VolumeX, ArrowLeft, WifiOff
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDoc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export default function ViewerPage() {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'single'>('single');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isConnected]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceId) return;

        setLoading(true);
        setStream(null);

        try {
            const callDoc = doc(db, 'cameras', deviceId);
            const snapshot = await getDoc(callDoc);

            if (!snapshot.exists()) {
                alert("Device not found or offline. Check the ID.");
                setLoading(false);
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
            alert("Failed to connect to device.");
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
    };

    // Connection Screen
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-warm bg-hero-pattern flex items-center justify-center p-4">
                <div className="w-full max-w-md relative z-10 animate-scale-in">
                    <button
                        onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 text-sm font-medium group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    <div className="card card-elevated p-8 md:p-10">
                        <div className="text-center mb-8">
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
                            >
                                <Smartphone size={36} style={{ color: '#d97706' }} />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Connect to Camera</h2>
                            <p className="text-gray-500">Enter the Camera ID to start monitoring</p>
                        </div>

                        <form onSubmit={handleConnect} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                    Device ID
                                </label>
                                <input
                                    type="text"
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                                    placeholder="CAM-XXXX"
                                    className="input input-lg text-center font-mono tracking-[0.3em] text-xl"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !deviceId}
                                className="btn btn-primary btn-lg w-full justify-center"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <span
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                        />
                                        Connecting...
                                    </span>
                                ) : (
                                    <>
                                        <Wifi size={20} />
                                        Connect to Feed
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => navigate('/camera')}
                                className="text-sm hover:underline transition-colors"
                                style={{ color: '#d97706' }}
                            >
                                Want to broadcast instead? →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Live View Screen
    return (
        <div className="min-h-screen h-screen flex bg-gray-100">
            {/* Sidebar */}
            <aside className="w-72 border-r border-gray-200 flex flex-col hidden lg:flex bg-white shadow-sm">
                <div className="p-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full btn btn-primary justify-center"
                    >
                        <Plus size={18} />
                        Add Camera
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Active Cameras
                    </p>
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium transition-all"
                        style={{
                            background: 'rgba(251, 191, 36, 0.1)',
                            borderColor: '#fbbf24',
                            color: '#b45309'
                        }}
                    >
                        <div className={`status-dot ${stream ? 'status-online' : 'status-connecting'}`} />
                        {deviceId}
                        <span
                            className="ml-auto text-[10px] px-2 py-0.5 rounded uppercase font-bold"
                            style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#92400e' }}
                        >
                            Live
                        </span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={18} />
                        Disconnect
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col bg-gray-50">
                {/* Header Bar */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="font-display font-bold text-lg text-gray-900">{deviceId}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${stream
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                            {stream ? 'Live Encrypted' : 'Negotiating'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => setViewMode('single')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'single'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Maximize2 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Area */}
                <div className="flex-1 p-6 overflow-hidden">
                    <div className={viewMode === 'grid' ? 'dashboard-grid h-full' : 'w-full h-full max-w-5xl mx-auto'}>
                        {/* Main Video Card */}
                        <div className="device-card h-full flex flex-col overflow-hidden shadow-xl relative">
                            {/* Video Top Overlay */}
                            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 pointer-events-none">
                                <div className="live-badge">
                                    LIVE STREAM
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium bg-white shadow-sm ${stream
                                        ? 'border-green-200 text-green-700'
                                        : 'border-amber-200 text-amber-700'
                                        }`}>
                                        {stream ? <Wifi size={14} /> : <RefreshCw size={14} className="animate-spin" />}
                                        {stream ? 'P2P Connected' : 'Connecting'}
                                    </div>
                                </div>
                            </div>

                            {/* Video Feed */}
                            <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                {stream ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted={isMuted}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-gray-600 flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center animate-pulse">
                                            <Camera size={40} className="opacity-50" />
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium">Waiting for stream...</p>
                                    </div>
                                )}
                            </div>

                            {/* Controls Footer */}
                            <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isMuted
                                            ? 'bg-red-50 text-red-500 border-red-200'
                                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all">
                                        <Camera size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all">
                                        <Video size={18} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleDisconnect}
                                    className="btn btn-ghost text-red-500 hover:bg-red-50 lg:hidden"
                                >
                                    <WifiOff size={18} />
                                    Disconnect
                                </button>
                            </div>
                        </div>

                        {viewMode === 'grid' && (
                            <>
                                <OfflineCameraCard title="Kitchen" />
                                <OfflineCameraCard title="Front Door" />
                                <OfflineCameraCard title="Backyard" />
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function OfflineCameraCard({ title }: { title: string }) {
    return (
        <div className="device-card flex flex-col">
            <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative min-h-[200px]">
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white shadow-sm border border-gray-200 text-xs font-medium text-gray-700">
                    {title}
                </div>
                <Camera size={32} className="text-gray-300" />
            </div>
            <div className="p-4 flex items-center justify-between bg-white border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="status-dot status-offline" />
                    <span className="text-xs font-medium text-gray-500">Offline</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
            </div>
        </div>
    );
}
