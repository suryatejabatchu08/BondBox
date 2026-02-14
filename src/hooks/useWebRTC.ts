/**
 * useWebRTC - Custom hook for WebRTC video/audio/screen-sharing.
 *
 * Uses a SHARED WebSocket (from useCanvasSync) for signaling.
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
    wsRef: React.MutableRefObject<WebSocket | null>;
}

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'e7e5e3e1a5e3d3c1b1a1',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:global.relay.metered.ca:443',
        username: 'e7e5e3e1a5e3d3c1b1a1',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:global.relay.metered.ca:443?transport=tcp',
        username: 'e7e5e3e1a5e3d3c1b1a1',
        credential: 'openrelayproject',
    },
];

export function useWebRTC({ userId, wsRef }: UseWebRTCOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const isInCallRef = useRef(false);

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
        // Don't create connection to self
        if (peerId === userId) return undefined;

        // Reuse existing connection
        const existing = peerConnectionsRef.current.get(peerId);
        if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
            return existing;
        }

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
            if (!remoteStream) return;
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
    }, [userId, wsRef, cleanupPeer]);

    // Handle WebRTC-related WebSocket messages
    const handleWsMessage = useCallback(async (event: MessageEvent) => {
        if (!isInCallRef.current) return;

        let message: any;
        try {
            message = JSON.parse(event.data);
        } catch {
            return;
        }

        switch (message.type) {
            case 'peers-list': {
                // Response to get-peers: list of {userId, displayName}
                const peers: { userId: string; displayName: string }[] = message.peers || [];
                for (const peer of peers) {
                    if (peer.userId !== userId && !peerConnectionsRef.current.has(peer.userId)) {
                        const pc = createPeerConnection(peer.userId, peer.displayName);
                        if (pc) {
                            try {
                                const offer = await pc.createOffer();
                                await pc.setLocalDescription(offer);
                                wsRef.current?.send(
                                    JSON.stringify({
                                        type: 'webrtc-offer',
                                        targetUserId: peer.userId,
                                        sdp: offer,
                                    })
                                );
                            } catch (err) {
                                console.error('Error creating offer for', peer.userId, err);
                            }
                        }
                    }
                }
                break;
            }

            case 'peer-joined': {
                // A new peer joined the room — send them an offer
                const peerId = message.userId;
                if (peerId && peerId !== userId && !peerConnectionsRef.current.has(peerId)) {
                    const pc = createPeerConnection(peerId, message.displayName || 'Peer');
                    if (pc) {
                        try {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            wsRef.current?.send(
                                JSON.stringify({
                                    type: 'webrtc-offer',
                                    targetUserId: peerId,
                                    sdp: offer,
                                })
                            );
                        } catch (err) {
                            console.error('Error creating offer for new peer', peerId, err);
                        }
                    }
                }
                break;
            }

            case 'webrtc-offer': {
                const peerId = message.userId;
                if (!peerId || peerId === userId) break;
                let pc = peerConnectionsRef.current.get(peerId);
                if (!pc) {
                    pc = createPeerConnection(peerId, message.displayName || 'Peer');
                }
                if (!pc) break;
                try {
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
                } catch (err) {
                    console.error('Error handling offer from', peerId, err);
                }
                break;
            }

            case 'webrtc-answer': {
                const pc = peerConnectionsRef.current.get(message.userId);
                if (pc) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                    } catch (err) {
                        console.error('Error handling answer from', message.userId, err);
                    }
                }
                break;
            }

            case 'webrtc-ice': {
                const pc = peerConnectionsRef.current.get(message.userId);
                if (pc && message.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                    } catch (err) {
                        console.error('Error adding ICE candidate from', message.userId, err);
                    }
                }
                break;
            }

            case 'peer-left': {
                cleanupPeer(message.userId);
                break;
            }

            case 'screen-share-start': {
                // A remote peer started screen sharing
                setRemoteStreams(prev =>
                    prev.map(s =>
                        s.userId === message.userId
                            ? { ...s, isScreenShare: true }
                            : s
                    )
                );
                break;
            }

            case 'screen-share-stop': {
                // A remote peer stopped screen sharing
                setRemoteStreams(prev =>
                    prev.map(s =>
                        s.userId === message.userId
                            ? { ...s, isScreenShare: false }
                            : s
                    )
                );
                break;
            }
        }
    }, [userId, createPeerConnection, cleanupPeer, wsRef]);

    // Attach/detach the WebSocket message listener when in call
    useEffect(() => {
        const ws = wsRef.current;
        if (!ws || !isConnected) return;

        ws.addEventListener('message', handleWsMessage);
        return () => {
            ws.removeEventListener('message', handleWsMessage);
        };
    }, [wsRef.current, isConnected, handleWsMessage]);

    // Initialize media and join the call
    const joinCall = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            isInCallRef.current = true;
            setIsConnected(true);

            // Request peer list from server to initiate connections
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'get-peers' }));
            }
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
                isInCallRef.current = true;
                setIsConnected(true);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'get-peers' }));
                }
            } catch (audioErr) {
                console.error('Failed to get any media:', audioErr);
            }
        }
    }, [wsRef]);

    // Leave call
    const leaveCall = useCallback(() => {
        isInCallRef.current = false;

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
            setScreenStream(null);

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

            // Notify peers
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'screen-share-stop' }));
            }
        } else {
            try {
                const newScreenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false,
                });
                screenStreamRef.current = newScreenStream;
                setScreenStream(newScreenStream);

                const screenTrack = newScreenStream.getVideoTracks()[0];
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

                // Notify peers
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'screen-share-start' }));
                }
            } catch (err) {
                console.error('Screen share failed:', err);
            }
        }
    }, [isScreenSharing, wsRef]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, [leaveCall]);

    return {
        localStream,
        remoteStreams,
        screenStream,
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
