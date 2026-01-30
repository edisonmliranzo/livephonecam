import { useState, useRef, useEffect } from 'react';
import {
    Camera, Video, Wifi,
    Maximize2, AlertCircle, LayoutGrid,
    LogOut, ChevronRight, Activity,
    Smartphone, Plus, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export default function ViewerPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'single'>('single');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

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

            // Handle Incoming Stream
            peerConnection.ontrack = (event) => {
                console.log("Stream received");
                setStream(event.streams[0]);
            };

            // Queue ICE Candidates for the Callee (Answerer) to send
            const answerCandidates = collection(callDoc, 'answerCandidates');
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    addDoc(answerCandidates, event.candidate.toJSON());
                }
            };

            // Set Remote Description (Offer from Camera)
            const offer = snapshot.data().offer;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Create Answer
            const answerDescription = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answerDescription);

            const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
            };

            await updateDoc(callDoc, { answer });

            // Listen for Remote ICE Candidates (from Camera)
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

    if (!isConnected) {
        return (
            <div className="min-h-screen pt-32 px-4 flex justify-center items-start bg-gradient-to-b from-indigo-950/20 to-black">
                <div className="glass-card max-w-md w-full p-10 animate-fade-in relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <div className="text-center mb-10 relative z-10">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-xl">
                            <Smartphone size={40} className="text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold mb-3">Connect Device</h2>
                        <p className="text-gray-400">Enter the Camera ID to start monitoring in real-time.</p>
                    </div>
                    <form onSubmit={handleConnect} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-[0.15em]">Enter Device ID</label>
                            <input
                                type="text"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                placeholder="CAM-XXXX"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-700 font-mono tracking-[0.2em] text-xl text-center"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !deviceId}
                            className="btn-primary w-full py-5 rounded-2xl justify-center shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-3">
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    Syncing...
                                </span>
                            ) : 'Connect Web Viewer'}
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <Link to="/" className="text-sm font-medium text-gray-500 hover:text-indigo-400 transition-colors">Start a Broadcast instead?</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen h-screen pt-20 flex bg-black">
            {/* Sidebar Dash */}
            <aside className="w-72 bg-zinc-950 border-r border-white/5 flex flex-col hidden lg:flex">
                <div className="p-6">
                    <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold transition-all shadow-lg active:scale-95">
                        <Plus size={18} /> Add Camera
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <p className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cameras</p>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 font-medium transition-all">
                        <div className={`w-2 h-2 rounded-full ${stream ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                        {deviceId} <span className="ml-auto text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold">Main</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all group">
                        <div className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-zinc-500"></div>
                        Living Room <span className="ml-auto text-[10px] text-zinc-600">Offline</span>
                    </button>
                </nav>

                <div className="mt-auto p-4 border-t border-white/5 space-y-1">
                    <button onClick={handleDisconnect} className="w-full flex items-center gap-3 px-4 py-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all mt-4">
                        <LogOut size={18} /> Disconnect
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col bg-zinc-900/20">
                {/* Header Sub */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg">{deviceId}</h1>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${stream ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {stream ? 'Live Encrypted' : 'Negotiating'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setViewMode('single')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'single' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Maximize2 size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>

                {/* Dashboard View */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className={viewMode === 'grid' ? 'dashboard-grid animate-fade-in' : 'w-full max-w-5xl mx-auto animate-fade-in'}>
                            {/* Main Display Card */}
                            <div className="glass-card overflow-hidden relative shadow-2xl flex flex-col group aspect-video lg:aspect-auto h-[65vh] bg-black">
                                {/* Top Overlay */}
                                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between z-10 pointer-events-none">
                                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">LIVE STREAM</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-xs shadow-xl min-w-[100px] justify-center">
                                            {stream ? (
                                                <><Wifi size={14} className="text-green-400" /> <span className="font-bold">Peer-to-Peer</span></>
                                            ) : (
                                                <><RefreshCw size={14} className="animate-spin text-yellow-500" /> <span className="font-bold">Connecting</span></>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Feed Content */}
                                <div className="flex-1 bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                                    {stream ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-zinc-700 flex flex-col items-center gap-6 animate-pulse">
                                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                                                <Camera size={40} className="opacity-20" />
                                            </div>
                                            <p className="text-zinc-600 font-mono text-sm tracking-widest uppercase italic">Waiting for connection...</p>
                                        </div>
                                    )}

                                    {/* Mock scanlines/noise for "CCTV" feel */}
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
                                </div>

                                {/* Dash Controls Footer */}
                                <div className="h-20 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between px-8">
                                    <div className="flex gap-4">
                                        <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-indigo-400 transition-all border border-white/5" title="Take Screenshot (Mock)">
                                            <Camera size={20} />
                                        </button>
                                        <button className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20" title="Manual Record (Mock)">
                                            <Video size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <button onClick={() => setViewMode('single')} className="p-3 text-zinc-400 hover:text-white transition-all">
                                            <Maximize2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {viewMode === 'grid' && (
                                <>
                                    <CameraCard title="Kitchen" status="Offline" />
                                    <CameraCard title="Front Door" status="Offline" />
                                    <CameraCard title="Nursery" status="Offline" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar Log */}
                    <div className="w-96 border-l border-white/5 flex flex-col bg-black/20 overflow-hidden hidden xl:flex">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <Activity size={18} className="text-indigo-400" />
                                Live Feed Stats
                            </h3>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Clear</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <ActivityItem key={i} index={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function CameraCard({ title, status }: { title: string, status: string }) {
    return (
        <div className="glass-card aspect-video flex flex-col group cursor-pointer border-white/5 hover:border-indigo-500/30">
            <div className="flex-1 bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 rounded-full text-[10px] font-bold uppercase border border-white/5">{title}</div>
                <div className="text-zinc-800"><Camera size={32} /></div>
            </div>
            <div className="p-4 flex items-center justify-between bg-black/20">
                <span className="text-xs font-medium text-zinc-500">{status}</span>
                <ChevronRight size={14} className="text-zinc-700" />
            </div>
        </div>
    )
}

function ActivityItem({ index }: { index: number }) {
    return (
        <div className="flex gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group cursor-pointer">
            <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all">
                <AlertCircle size={20} className="text-zinc-600 group-hover:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold uppercase tracking-wide">System Info</p>
                    <span className="text-[10px] text-zinc-500 font-mono">1{index}:00 PM</span>
                </div>
                <p className="text-xs text-zinc-500 mb-2 truncate">Connection latency healthy</p>
            </div>
        </div>
    )
}
