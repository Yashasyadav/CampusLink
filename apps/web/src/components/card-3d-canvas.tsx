"use client";

import React, { useEffect, useRef } from "react";

export default function Card3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // 3D Icosahedron Vertices
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const baseVertices = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];

    // Normalize base vertices
    const vertices = baseVertices.map(([x, y, z]) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      return [x / len, y / len, z / len];
    });

    // Edges connecting vertices
    const edges: [number, number][] = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dx = vertices[i][0] - vertices[j][0];
        const dy = vertices[i][1] - vertices[j][1];
        const dz = vertices[i][2] - vertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.1) {
          edges.push([i, j]);
        }
      }
    }

    // Outer particle ring
    const ringParticles: { angle: number; radius: number; speed: number; y: number; color: string }[] = [];
    const ringColors = ["#f97316", "#38bdf8", "#818cf8", "#34d399"];
    for (let i = 0; i < 40; i++) {
      ringParticles.push({
        angle: (i / 40) * Math.PI * 2,
        radius: 120 + Math.random() * 20,
        speed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        y: (Math.random() - 0.5) * 40,
        color: ringColors[Math.floor(Math.random() * ringColors.length)],
      });
    }

    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      rotX += 0.006;
      rotY += 0.009;
      rotZ += 0.003;

      const cx = width * 0.75;
      const cy = height * 0.45;
      const radiusScale = Math.min(width, height) * 0.28;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      // Transform Vertices
      const transformedVertices = vertices.map(([x, y, z]) => {
        // Y rot
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // X rot
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Z rot
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        const fov = 350;
        const scale = fov / (fov + z2 * radiusScale * 0.5 + 200);
        const px = cx + x3 * radiusScale * scale;
        const py = cy + y3 * radiusScale * scale;

        return { x: px, y: py, z: z2, scale };
      });

      // Draw 3D Edges with glowing gradient strokes
      edges.forEach(([i, j]) => {
        const v1 = transformedVertices[i];
        const v2 = transformedVertices[j];
        const avgZ = (v1.z + v2.z) / 2;
        const alpha = Math.max(0.15, (avgZ + 1) / 2) * 0.65;

        const grad = ctx.createLinearGradient(v1.x, v1.y, v2.x, v2.y);
        grad.addColorStop(0, `rgba(96, 165, 250, ${alpha})`);
        grad.addColorStop(1, `rgba(249, 115, 22, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#3b82f6";
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw Glowing Vertex Nodes
      transformedVertices.forEach((v) => {
        const nodeAlpha = Math.max(0.3, (v.z + 1) / 2);
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3.5 * v.scale, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#f97316";
        ctx.globalAlpha = nodeAlpha;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Draw Rotating 3D Particle Orbit Ring
      ringParticles.forEach((p) => {
        p.angle += p.speed;
        const rx = cx + Math.cos(p.angle) * p.radius;
        const ry = cy + Math.sin(p.angle) * (p.radius * 0.35) + p.y;

        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
