"use client";

import React, { useEffect, useRef } from "react";

export default function Background3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // --- Object 1: Top-Left Floating 3D Cube ---
    const cubeVertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
    ];
    const cubeEdges = [
      [0,1], [1,2], [2,3], [3,0],
      [4,5], [5,6], [6,7], [7,4],
      [0,4], [1,5], [2,6], [3,7]
    ];

    // --- Object 2: Bottom-Right Floating 3D Octahedron ---
    const octaVertices = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
    ];
    const octaEdges = [
      [0,2], [2,1], [1,3], [3,0],
      [0,4], [1,4], [2,4], [3,4],
      [0,5], [1,5], [2,5], [3,5]
    ];

    // --- Object 3: Top-Right & Floating Ambient 3D Particles ---
    const particlesCount = 70;
    const particles = Array.from({ length: particlesCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.2,
      y: (Math.random() - 0.5) * height * 1.2,
      z: Math.random() * 500 - 250,
      radius: Math.random() * 3 + 1.5,
      color: ["#2563eb", "#3b82f6", "#f97316", "#8b5cf6", "#0284c7"][Math.floor(Math.random() * 5)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angleX += 0.008;
      angleY += 0.01;

      // 1. Draw Top-Left Floating 3D Cube
      const cubeCx = width * 0.18;
      const cubeCy = height * 0.25;
      const cubeSize = Math.min(width, height) * 0.08;

      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);

      const projCube = cubeVertices.map(([x, y, z]) => {
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        const scale = 300 / (300 + z2 * cubeSize + 100);
        return {
          x: cubeCx + x1 * cubeSize * scale,
          y: cubeCy + y2 * cubeSize * scale,
          z: z2,
        };
      });

      cubeEdges.forEach(([i, j]) => {
        const v1 = projCube[i];
        const v2 = projCube[j];
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = "rgba(37, 99, 235, 0.6)";
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#3b82f6";
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      projCube.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f97316";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. Draw Bottom-Right Floating 3D Octahedron
      const octaCx = width * 0.82;
      const octaCy = height * 0.75;
      const octaSize = Math.min(width, height) * 0.09;

      const cosX2 = Math.cos(-angleX * 1.2), sinX2 = Math.sin(-angleX * 1.2);
      const cosY2 = Math.cos(angleY * 0.8), sinY2 = Math.sin(angleY * 0.8);

      const projOcta = octaVertices.map(([x, y, z]) => {
        let x1 = x * cosY2 - z * sinY2;
        let z1 = x * sinY2 + z * cosY2;
        let y2 = y * cosX2 - z1 * sinX2;
        let z2 = y * sinX2 + z1 * cosX2;
        const scale = 300 / (300 + z2 * octaSize + 100);
        return {
          x: octaCx + x1 * octaSize * scale,
          y: octaCy + y2 * octaSize * scale,
          z: z2,
        };
      });

      octaEdges.forEach(([i, j]) => {
        const v1 = projOcta[i];
        const v2 = projOcta[j];
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.65)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#8b5cf6";
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      projOcta.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#38bdf8";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Draw Ambient Floating 3D Particle Constellation in viewable margins
      const cx = width / 2;
      const cy = height / 2;
      const fov = 400;

      const projParticles: { x: number; y: number; scale: number; color: string; r: number }[] = [];

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -width / 2) p.x = width / 2;
        if (p.x > width / 2) p.x = -width / 2;
        if (p.y < -height / 2) p.y = height / 2;
        if (p.y > height / 2) p.y = -height / 2;

        const scale = fov / (fov + p.z + 300);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;

        projParticles.push({
          x: px,
          y: py,
          scale,
          color: p.color,
          r: p.radius * scale,
        });
      });

      // Draw lines between near particles
      for (let i = 0; i < projParticles.length; i++) {
        for (let j = i + 1; j < projParticles.length; j++) {
          const p1 = projParticles[i];
          const p2 = projParticles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      projParticles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.r), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-95"
    />
  );
}
