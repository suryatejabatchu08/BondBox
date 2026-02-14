/**
 * VideoControls - Bottom toolbar for call controls.
 * Mic, Camera, Screen share, Canvas toggle, Leave call.
 */

import { Mic, MicOff, Video, VideoOff, Monitor, Pencil, PhoneOff } from 'lucide-react';

interface VideoControlsProps {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    isCanvasOpen: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onToggleCanvas: () => void;
    onLeaveCall: () => void;
}

export default function VideoControls({
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isCanvasOpen,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onToggleCanvas,
    onLeaveCall,
}: VideoControlsProps) {
    const btnBase: React.CSSProperties = {
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        outline: 'none',
    };

    const btnDefault: React.CSSProperties = {
        ...btnBase,
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#e2e8f0',
    };

    const btnActive: React.CSSProperties = {
        ...btnBase,
        background: 'rgba(168, 85, 247, 0.3)',
        color: '#d8b4fe',
        border: '1px solid rgba(168, 85, 247, 0.4)',
    };

    const btnOff: React.CSSProperties = {
        ...btnBase,
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#fca5a5',
    };

    const btnLeave: React.CSSProperties = {
        ...btnBase,
        background: '#ef4444',
        color: 'white',
        width: 56,
        height: 48,
        borderRadius: 24,
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '12px 20px',
                borderRadius: 28,
                background: 'rgba(15, 10, 30, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
        >
            {/* Mic */}
            <button
                onClick={onToggleAudio}
                style={isAudioEnabled ? btnDefault : btnOff}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
                {isAudioEnabled ? (
                    <Mic style={{ width: 20, height: 20 }} />
                ) : (
                    <MicOff style={{ width: 20, height: 20 }} />
                )}
            </button>

            {/* Camera */}
            <button
                onClick={onToggleVideo}
                style={isVideoEnabled ? btnDefault : btnOff}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
                {isVideoEnabled ? (
                    <Video style={{ width: 20, height: 20 }} />
                ) : (
                    <VideoOff style={{ width: 20, height: 20 }} />
                )}
            </button>

            {/* Screen share */}
            <button
                onClick={onToggleScreenShare}
                style={isScreenSharing ? btnActive : btnDefault}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
                <Monitor style={{ width: 20, height: 20 }} />
            </button>

            {/* Canvas toggle */}
            <button
                onClick={onToggleCanvas}
                style={isCanvasOpen ? btnActive : btnDefault}
                title={isCanvasOpen ? 'Close whiteboard' : 'Open whiteboard'}
            >
                <Pencil style={{ width: 20, height: 20 }} />
            </button>

            {/* Leave */}
            <button
                onClick={onLeaveCall}
                style={btnLeave}
                title="Leave call"
            >
                <PhoneOff style={{ width: 20, height: 20 }} />
            </button>
        </div>
    );
}
