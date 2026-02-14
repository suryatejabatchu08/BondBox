/**
 * VideoGrid - Google Meet-inspired video layout.
 *
 * Normal mode: equal grid of participant tiles.
 * Spotlight mode: when someone is screen sharing, the screen takes
 *   the main area and participant cameras go into a side strip.
 */

import { useCallback } from 'react';
import type { PeerStream } from '../../hooks/useWebRTC';
import { User, Monitor } from 'lucide-react';

interface VideoGridProps {
    localStream: MediaStream | null;
    remoteStreams: PeerStream[];
    displayName: string;
    isVideoEnabled: boolean;
    screenStream: MediaStream | null;   // local screen share
    isScreenSharing: boolean;
}

/* ─── Individual video tile ─── */

function VideoTile({
    stream,
    name,
    isSelf,
    isVideoOff,
    isScreen,
    compact,
}: {
    stream: MediaStream | null;
    name: string;
    isSelf?: boolean;
    isVideoOff?: boolean;
    isScreen?: boolean;
    compact?: boolean;          // small tile for side strip
}) {
    // Callback ref guarantees srcObject is set every time the <video>
    // element mounts (fixes the toggle-video-off-then-on bug).
    const videoCallbackRef = useCallback(
        (el: HTMLVideoElement | null) => {
            if (el && stream) {
                el.srcObject = stream;
            }
        },
        [stream],
    );

    const hasVideo = stream?.getVideoTracks().some(t => t.enabled) && !isVideoOff;

    const tileStyle: React.CSSProperties = {
        position: 'relative',
        borderRadius: compact ? 10 : 14,
        overflow: 'hidden',
        background: '#1a1333',
        border: isScreen
            ? '2px solid rgba(34, 197, 94, 0.5)'
            : '1px solid rgba(168, 85, 247, 0.2)',
        aspectRatio: isScreen ? '16/9' : compact ? '4/3' : '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: compact ? 80 : 120,
    };

    return (
        <div style={tileStyle}>
            {hasVideo || isScreen ? (
                <video
                    ref={videoCallbackRef}
                    autoPlay
                    playsInline
                    muted={isSelf}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: isScreen ? 'contain' : 'cover',
                        transform: isSelf && !isScreen ? 'scaleX(-1)' : undefined,
                        background: '#0f0a1e',
                    }}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                        style={{
                            width: compact ? 36 : 56,
                            height: compact ? 36 : 56,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <User style={{ width: compact ? 16 : 24, height: compact ? 16 : 24, color: 'white' }} />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: compact ? 10 : 12 }}>
                        {isVideoOff ? 'Camera off' : 'No video'}
                    </span>
                </div>
            )}

            {/* Hidden audio element when video is off */}
            {!hasVideo && !isScreen && stream && (
                <video
                    ref={videoCallbackRef}
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
                    bottom: compact ? 4 : 8,
                    left: compact ? 4 : 8,
                    padding: compact ? '2px 6px' : '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    fontSize: compact ? 10 : 12,
                    color: 'white',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                {isScreen && <Monitor style={{ width: 12, height: 12, color: '#22c55e' }} />}
                {name} {isSelf && !isScreen && '(You)'}
                {isScreen && isSelf && '— Your screen'}
            </div>
        </div>
    );
}

/* ─── Main grid ─── */

export default function VideoGrid({
    localStream,
    remoteStreams,
    displayName,
    isVideoEnabled,
    screenStream,
    isScreenSharing,
}: VideoGridProps) {
    // Determine if anyone is screen sharing (local user or a remote peer)
    const remoteScreenShare = remoteStreams.find(s => s.isScreenShare);
    const hasAnyScreenShare = isScreenSharing || !!remoteScreenShare;

    /* ── Spotlight layout (someone is presenting) ── */
    if (hasAnyScreenShare) {
        const nonScreenRemotes = remoteStreams.filter(s => !s.isScreenShare);

        return (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                {/* Main spotlight area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Local screen share */}
                    {isScreenSharing && screenStream && (
                        <VideoTile
                            stream={screenStream}
                            name={displayName}
                            isSelf
                            isScreen
                        />
                    )}

                    {/* Remote screen share */}
                    {remoteScreenShare && !isScreenSharing && (
                        <VideoTile
                            stream={remoteScreenShare.stream}
                            name={remoteScreenShare.displayName}
                            isScreen
                        />
                    )}
                </div>

                {/* Side strip of camera feeds */}
                <div
                    style={{
                        width: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        overflowY: 'auto',
                        maxHeight: 500,
                    }}
                >
                    {/* Local camera */}
                    <VideoTile
                        stream={localStream}
                        name={displayName}
                        isSelf
                        isVideoOff={!isVideoEnabled}
                        compact
                    />

                    {/* Other participants (non-screen-share) */}
                    {nonScreenRemotes.map((peer) => (
                        <VideoTile
                            key={peer.userId}
                            stream={peer.stream}
                            name={peer.displayName}
                            compact
                        />
                    ))}

                    {/* Remote screen sharer's camera (if remote) */}
                    {remoteScreenShare && !isScreenSharing && (
                        <div style={{
                            fontSize: 10,
                            color: '#22c55e',
                            textAlign: 'center',
                            padding: '4px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                        }}>
                            <Monitor style={{ width: 12, height: 12 }} />
                            {remoteScreenShare.displayName} is presenting
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ── Normal grid layout (no screen share) ── */
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
