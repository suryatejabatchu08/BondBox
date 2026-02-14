import { useEffect, useRef } from 'react';

interface PixelSnowProps {
    /** Number of snowflake pixels */
    count?: number;
    /** Base color in hex (without #) */
    color?: string;
    /** Max opacity of particles (0-1) */
    maxOpacity?: number;
    /** Min/max pixel size */
    minSize?: number;
    maxSize?: number;
    /** Speed multiplier */
    speed?: number;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    drift: number;
    twinkleSpeed: number;
    twinklePhase: number;
}

export default function PixelSnow({
    count = 80,
    color = 'ffffff',
    maxOpacity = 0.15,
    minSize = 1,
    maxSize = 3,
    speed = 0.4,
}: PixelSnowProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Parse color
        const r = parseInt(color.slice(0, 2), 16);
        const g = parseInt(color.slice(2, 4), 16);
        const b = parseInt(color.slice(4, 6), 16);

        // Initialize particles
        const particles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize,
                speed: (Math.random() * 0.3 + 0.1) * speed,
                opacity: Math.random() * maxOpacity * 0.6 + maxOpacity * 0.2,
                drift: (Math.random() - 0.5) * 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinklePhase: Math.random() * Math.PI * 2,
            });
        }
        particlesRef.current = particles;

        let time = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 1;

            for (const p of particles) {
                // Twinkle effect
                const twinkle = Math.sin(time * p.twinkleSpeed + p.twinklePhase);
                const currentOpacity = p.opacity * (0.5 + twinkle * 0.5);

                // Draw pixel (sharp square for pixel feel)
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentOpacity})`;
                ctx.fillRect(
                    Math.floor(p.x),
                    Math.floor(p.y),
                    p.size,
                    p.size
                );

                // Move
                p.y += p.speed;
                p.x += p.drift + Math.sin(time * 0.01 + p.twinklePhase) * 0.15;

                // Wrap around
                if (p.y > canvas.height + p.size) {
                    p.y = -p.size;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x > canvas.width + p.size) {
                    p.x = -p.size;
                }
                if (p.x < -p.size) {
                    p.x = canvas.width + p.size;
                }
            }

            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [count, color, maxOpacity, minSize, maxSize, speed]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}
