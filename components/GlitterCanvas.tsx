'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  phase: number;
  phaseSpeed: number;
}

const COLORS = [
  '255,255,255',   // white
  '212,120,156',   // brand pink
  '240,180,210',   // light pink
  '255,215,120',   // gold
  '220,180,255',   // lilac
];

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: Math.random() * 0.4 + 0.1,
    size: Math.random() * 1.8 + 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: Math.random(),
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: Math.random() * 0.03 + 0.01,
  };
}

export default function GlitterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function init() {
      resize();
      const count = Math.floor((canvas!.width * canvas!.height) / 12000);
      particles = Array.from({ length: count }, () =>
        createParticle(canvas!.width, canvas!.height)
      );
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.phase += p.phaseSpeed;
        p.opacity = (Math.sin(p.phase) + 1) / 2;
        p.x += p.vx;
        p.y += p.vy;

        if (p.y > canvas!.height + 4) {
          p.y = -4;
          p.x = Math.random() * canvas!.width;
        }
        if (p.x < -4) p.x = canvas!.width + 4;
        if (p.x > canvas!.width + 4) p.x = -4;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color},${p.opacity * 0.7})`;
        ctx!.fill();

        // crisp glint on bright phase
        if (p.opacity > 0.85) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255,255,255,${p.opacity * 0.9})`;
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    init();
    draw();

    window.addEventListener('resize', init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
