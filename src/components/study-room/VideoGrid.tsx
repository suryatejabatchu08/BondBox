/**
 * VideoGrid - Responsive grid of video tiles for the study room call.
 */

import { useEffect, useRef } from 'react';
import type { PeerStream } from '../../hooks/useWebRTC';
import { User, Monitor } from 'lucide-react';

interface VideoGridProps {
    localStream: MediaStream | null;
    remoteStreams: PeerStream[];
    displayName: string;
    isVideoEnabled: boolean;
}

function VideoTile({
    stream,
    name,
    isSelf,
    isVideoOff,
    isScreen,
}: {
    stream: MediaStream | null;
    name: string;
    isSelf?: boolean;
    isVideoOff?: boolean;
    isScreen?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const hasVideo = stream?.getVideoTracks().some(t => t.enabled) && !isVideoOff;

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#1a1333',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
            }}
        >
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isSelf}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: isSelf && !isScreen ? 'scaleX(-1)' : undefined,
                    }}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {isScreen ? (
                            <Monitor style={{ width: 24, height: 24, color: 'white' }} />
                        ) : (
                            <User style={{ width: 24, height: 24, color: 'white' }} />
                        )}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{isVideoOff ? 'Camera off' : 'No video'}</span>
                </div>
            )}

            {/* Hidden video element for audio when video is off */}
            {!hasVideo && stream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isSelf}
                    style={{ display: 'none' }}
                />
            )}

            {/* Name label */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    fontSize: 12,
                    color: 'white',
                    fontWeight: 500,
                }}
            >
                {name} {isSelf && '(You)'}
            </div>
        </div>
    );
}

export default function VideoGrid({ localStream, remoteStreams, displayName, isVideoEnabled }: VideoGridProps) {
    const totalParticipants = 1 + remoteStreams.length;

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gap: 8,
        width: '100%',
        gridTemplateColumns:
            totalParticipants === 1
                ? '1fr'
                : totalParticipants === 2
                    ? '1fr 1fr'
                    : totalParticipants <= 4
                        ? '1fr 1fr'
                        : 'repeat(3, 1fr)',
    };

    return (
        <div style={gridStyle}>
            {/* Local stream */}
            <VideoTile
                stream={localStream}
                name={displayName}
                isSelf
                isVideoOff={!isVideoEnabled}
            />

            {/* Remote streams */}
            {remoteStreams.map((peer) => (
                <VideoTile
                    key={peer.userId}
                    stream={peer.stream}
                    name={peer.displayName}
                    isScreen={peer.isScreenShare}
                />
            ))}
        </div>
    );
}
