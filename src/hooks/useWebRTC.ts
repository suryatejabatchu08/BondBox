/**
 * useWebRTC - Custom hook for WebRTC video/audio/screen-sharing.
 * 
 * Uses the FastAPI WebSocket for signaling (offer/answer/ICE).
 * Manages peer connections, local/remote streams, and media controls.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PeerStream {
    userId: string;
    displayName: string;
    stream: MediaStream;
    isScreenShare?: boolean;
}

interface UseWebRTCOptions {
    roomId: string;
    userId: string;
    displayName: string;
    enabled: boolean; // reserved for future auto-connect feature
}

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useWebRTC({ roomId, userId, displayName, enabled }: UseWebRTCOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    // Clean up a specific peer connection
    const cleanupPeer = useCallback((peerId: string) => {
        const pc = peerConnectionsRef.current.get(peerId);
        if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(peerId);
        }
        setRemoteStreams(prev => prev.filter(s => s.userId !== peerId));
    }, []);

    // Create a new peer connection for a remote peer
    const createPeerConnection = useCallback((peerId: string, peerName: string) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add local tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle incoming remote tracks
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setRemoteStreams(prev => {
                const exists = prev.find(s => s.userId === peerId);
                if (exists) {
                    return prev.map(s =>
                        s.userId === peerId ? { ...s, stream: remoteStream } : s
                    );
                }
                return [...prev, { userId: peerId, displayName: peerName, stream: remoteStream }];
            });
        };

        // Send ICE candidates to the remote peer
        pc.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'webrtc-ice',
                        targetUserId: peerId,
                        candidate: event.candidate.toJSON(),
                    })
                );
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                cleanupPeer(peerId);
            }
        };

        peerConnectionsRef.current.set(peerId, pc);
        return pc;
    }, [cleanupPeer]);

    // Handle incoming WebSocket messages
    const handleMessage = useCallback(async (event: MessageEvent) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'peer-joined': {
                // New peer joined, create offers to all new peers
                const peers: string[] = message.peers || [];
                for (const peerId of peers) {
                    if (peerId !== userId && !peerConnectionsRef.current.has(peerId)) {
                        const pc = createPeerConnection(peerId, message.displayName || 'Peer');
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        wsRef.current?.send(
                            JSON.stringify({
                                type: 'webrtc-offer',
                                targetUserId: peerId,
                                sdp: offer,
                            })
                        );
                    }
                }
                break;
            }

            case 'webrtc-offer': {
                const peerId = message.userId;
                let pc = peerConnectionsRef.current.get(peerId);
                if (!pc) {
                    pc = createPeerConnection(peerId, message.displayName || 'Peer');
                }
                await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                wsRef.current?.send(
                    JSON.stringify({
                        type: 'webrtc-answer',
                        targetUserId: peerId,
                        sdp: answer,
                    })
                );
                break;
            }

            case 'webrtc-answer': {
                const pc = peerConnectionsRef.current.get(message.userId);
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                }
                break;
            }

            case 'webrtc-ice': {
                const pc = peerConnectionsRef.current.get(message.userId);
                if (pc && message.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
                break;
            }

            case 'peer-left': {
                cleanupPeer(message.userId);
                break;
            }
        }
    }, [userId, createPeerConnection, cleanupPeer]);

    // Initialize media and connect
    const joinCall = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Connect WebSocket
            const ws = new WebSocket(
                `${WS_BASE}/ws/room/${roomId}?user_id=${userId}&display_name=${encodeURIComponent(displayName)}`
            );
            ws.onmessage = handleMessage;
            ws.onopen = () => {
                setIsConnected(true);
                // Request current peers
                ws.send(JSON.stringify({ type: 'get-peers' }));
            };
            ws.onclose = () => setIsConnected(false);
            wsRef.current = ws;
        } catch (err) {
            console.error('Failed to get media devices:', err);
            // Try audio only if video fails
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true,
                });
                localStreamRef.current = stream;
                setLocalStream(stream);
                setIsVideoEnabled(false);

                const ws = new WebSocket(
                    `${WS_BASE}/ws/room/${roomId}?user_id=${userId}&display_name=${encodeURIComponent(displayName)}`
                );
                ws.onmessage = handleMessage;
                ws.onopen = () => setIsConnected(true);
                ws.onclose = () => setIsConnected(false);
                wsRef.current = ws;
            } catch (audioErr) {
                console.error('Failed to get any media:', audioErr);
            }
        }
    }, [roomId, userId, displayName, handleMessage]);

    // Leave call
    const leaveCall = useCallback(() => {
        // Close all peer connections
        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();
        setRemoteStreams([]);

        // Stop local streams
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        screenStreamRef.current = null;
        setLocalStream(null);
        setIsScreenSharing(false);

        // Close WebSocket
        wsRef.current?.close();
        wsRef.current = null;
        setIsConnected(false);
    }, []);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(prev => !prev);
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(prev => !prev);
        }
    }, []);

    // Toggle screen share
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Stop screen share, revert to camera
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;

            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    peerConnectionsRef.current.forEach((pc) => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(videoTrack);
                    });
                }
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false,
                });
                screenStreamRef.current = screenStream;

                const screenTrack = screenStream.getVideoTracks()[0];
                // Replace video track in all peer connections
                peerConnectionsRef.current.forEach((pc) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });

                // Handle user stopping share via browser UI
                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error('Screen share failed:', err);
            }
        }
    }, [isScreenSharing]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, [leaveCall]);

    return {
        localStream,
        remoteStreams,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        isConnected,
        joinCall,
        leaveCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
    };
}
