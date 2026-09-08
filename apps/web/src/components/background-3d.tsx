"use client";

import React, { useEffect, useRef } from "react";

interface NodePoint {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulsePhase: number;
}

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

    // Mouse & Physics State
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    let smoothMouse = { x: -1000, y: -1000 };
    let isMouseOver = false;

    // Check accessibility reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      isMouseOver = true;
    };

    const handleMouseLeave = () => {
      isMouseOver = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // --- Create Background Layer Particles (Layer 1) ---
    const bgParticleCount = width < 768 ? 20 : width < 1024 ? 35 : 55;
    const bgParticles = Array.from({ length: bgParticleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      z: Math.random() * 0.4 + 0.1, // Depth 0.1 to 0.5 (Background)
      radius: Math.random() * 2 + 1,
      color: ["#3b82f6", "#6366f1", "#f97316", "#0284c7", "#8b5cf6"][Math.floor(Math.random() * 5)],
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    // --- Create Midground Neural Network Nodes (Layer 2) ---
    const nodeCount = width < 768 ? 15 : width < 1024 ? 30 : 45;
    const nodes: NodePoint[] = Array.from({ length: nodeCount }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        z: Math.random() * 0.3 + 0.4, // Depth 0.4 to 0.7 (Midground)
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.5 + 2,
        color: ["#2563eb", "#38bdf8", "#8b5cf6", "#6366f1"][Math.floor(Math.random() * 4)],
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    // Rotation angles for 3D objects
    let time = 0;

    // Helper 3D Projection
    const project3D = (x: number, y: number, z: number, cx: number, cy: number, fov: number = 380) => {
      const scale = fov / (fov + z);
      return {
        px: cx + x * scale,
        py: cy + y * scale,
        scale,
      };
    };

    // -------------------------------------------------------------
    // RENDER FUNCTIONS FOR 3D FOREGROUND OBJECTS (Layer 3)
    // -------------------------------------------------------------

    // 1. TOP-LEFT: AI Neural Sphere
    const drawAINeuralSphere = (cx: number, cy: number, baseRadius: number, mouseOffset: { x: number; y: number }) => {
      const x = cx + mouseOffset.x;
      const y = cy + mouseOffset.y;

      ctx.save();
      ctx.translate(x, y);

      // Outer Transparent Glass Shell
      const grad = ctx.createRadialGradient(-baseRadius * 0.3, -baseRadius * 0.3, baseRadius * 0.1, 0, 0, baseRadius);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      grad.addColorStop(0.3, "rgba(186, 230, 253, 0.35)");
      grad.addColorStop(0.7, "rgba(59, 130, 246, 0.2)");
      grad.addColorStop(1, "rgba(99, 102, 241, 0.4)");

      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#38bdf8";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.stroke();

      // Inner 3D Neural Brain Wireframe Core
      const coreRadius = baseRadius * 0.55;
      const phi = time * 0.015;
      const theta = time * 0.01;

      const sphereNodes: { x: number; y: number; z: number }[] = [];
      const numSphereNodes = 14;
      for (let i = 0; i < numSphereNodes; i++) {
        const lat = Math.acos(-1 + (2 * i) / numSphereNodes);
        const lon = Math.sqrt(numSphereNodes * Math.PI) * lat;
        const nx = coreRadius * Math.sin(lat) * Math.cos(lon + phi);
        const ny = coreRadius * Math.sin(lat) * Math.sin(lon + phi);
        const nz = coreRadius * Math.cos(lat + theta);
        sphereNodes.push({ x: nx, y: ny, z: nz });
      }

      // Draw Inner Neural Connections
      for (let i = 0; i < sphereNodes.length; i++) {
        for (let j = i + 1; j < sphereNodes.length; j++) {
          const p1 = sphereNodes[i];
          const p2 = sphereNodes[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
          if (dist < coreRadius * 1.3) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * (1 - dist / (coreRadius * 1.3))})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw Inner Glowing Core Nodes
      sphereNodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#38bdf8";
        ctx.fill();
      });

      // Rotating Orbital Ring 1 (Cyan)
      ctx.save();
      ctx.rotate(time * 0.012);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#38bdf8";
      ctx.stroke();
      ctx.restore();

      // Rotating Orbital Ring 2 (Violet Accent)
      ctx.save();
      ctx.rotate(-time * 0.015 + Math.PI / 4);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#8b5cf6";
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    };

    // 2. TOP-RIGHT: 3D Graduation Cap
    const drawGraduationCap = (cx: number, cy: number, scale: number, mouseOffset: { x: number; y: number }) => {
      const x = cx + mouseOffset.x;
      const y = cy + mouseOffset.y + Math.sin(time * 0.02) * 5;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Rotating Orbital Ring around Graduation Cap
      ctx.save();
      ctx.rotate(time * 0.01);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, 75, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f59e0b";
      ctx.stroke();
      ctx.restore();

      // 3D Skull Cap Base
      const baseGrad = ctx.createLinearGradient(0, 5, 0, 35);
      baseGrad.addColorStop(0, "#1e3a8a");
      baseGrad.addColorStop(1, "#1d4ed8");
      ctx.beginPath();
      ctx.moveTo(-28, 8);
      ctx.quadraticCurveTo(0, 38, 28, 8);
      ctx.quadraticCurveTo(24, 28, 0, 35);
      ctx.quadraticCurveTo(-24, 28, -28, 8);
      ctx.fillStyle = baseGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      // 3D Diamond Mortarboard Top (Rotated 3D Polygon)
      const tiltAngle = Math.sin(time * 0.015) * 0.1;
      ctx.save();
      ctx.rotate(tiltAngle);

      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(55, -8);
      ctx.lineTo(0, 16);
      ctx.lineTo(-55, -8);
      ctx.closePath();

      const topGrad = ctx.createLinearGradient(-55, -32, 55, 16);
      topGrad.addColorStop(0, "#3b82f6");
      topGrad.addColorStop(0.5, "#2563eb");
      topGrad.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = topGrad;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#2563eb";
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.stroke();

      // Center Button
      ctx.beginPath();
      ctx.arc(0, -8, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#f59e0b";
      ctx.fill();

      // Golden Tassel
      const tasselSway = Math.sin(time * 0.03) * 6;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(35, 6);
      ctx.lineTo(40 + tasselSway, 28);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(40 + tasselSway, 31, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();

      ctx.restore();
      ctx.restore();
    };

    // 3. BOTTOM-LEFT: AI Laptop
    const drawAILaptop = (cx: number, cy: number, scale: number, mouseOffset: { x: number; y: number }) => {
      const x = cx + mouseOffset.x;
      const y = cy + mouseOffset.y + Math.cos(time * 0.02) * 5;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Light Orbit Ring around Laptop
      ctx.save();
      ctx.rotate(-time * 0.01);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Holographic Glow Beam from Screen
      const beamGrad = ctx.createLinearGradient(0, -45, 0, 10);
      beamGrad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.beginPath();
      ctx.moveTo(-35, -40);
      ctx.lineTo(35, -40);
      ctx.lineTo(50, 10);
      ctx.lineTo(-50, 10);
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // Screen Frame (Angled 3D Perspective)
      ctx.beginPath();
      ctx.moveTo(-42, -45);
      ctx.lineTo(42, -45);
      ctx.lineTo(38, 5);
      ctx.lineTo(-38, 5);
      ctx.closePath();
      const screenGrad = ctx.createLinearGradient(-42, -45, 42, 5);
      screenGrad.addColorStop(0, "#0f172a");
      screenGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = screenGrad;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Screen Display — Holographic Glowing "AI" Chip
      ctx.beginPath();
      ctx.arc(0, -20, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
      ctx.fill();
      ctx.font = "900 11px sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#38bdf8";
      ctx.fillText("AI", 0, -20);
      ctx.shadowBlur = 0;

      // Base Keyboard Body Plate
      ctx.beginPath();
      ctx.moveTo(-48, 8);
      ctx.lineTo(48, 8);
      ctx.lineTo(56, 24);
      ctx.lineTo(-56, 24);
      ctx.closePath();
      const baseGrad = ctx.createLinearGradient(-56, 8, 56, 24);
      baseGrad.addColorStop(0, "#334155");
      baseGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = baseGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.stroke();

      // Trackpad
      ctx.beginPath();
      ctx.moveTo(-10, 16);
      ctx.lineTo(10, 16);
      ctx.lineTo(12, 21);
      ctx.lineTo(-12, 21);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    // 4. BOTTOM-RIGHT: 3D Knowledge Book Stack
    const drawBookStack = (cx: number, cy: number, scale: number, mouseOffset: { x: number; y: number }) => {
      const x = cx + mouseOffset.x;
      const y = cy + mouseOffset.y + Math.sin(time * 0.018) * 4;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const books = [
        { label: "Grow", color1: "#6366f1", color2: "#4f46e5", yOffset: 12, rot: -0.05 },
        { label: "Research", color1: "#2563eb", color2: "#1d4ed8", yOffset: -4, rot: 0.06 },
        { label: "Learn", color1: "#8b5cf6", color2: "#7c3aed", yOffset: -20, rot: -0.02 },
      ];

      books.forEach((book) => {
        ctx.save();
        ctx.translate(0, book.yOffset);
        ctx.rotate(book.rot);

        // 3D Book Volume Cover
        ctx.beginPath();
        ctx.roundRect(-42, -8, 84, 16, 4);
        const bookGrad = ctx.createLinearGradient(-42, -8, 84, 16);
        bookGrad.addColorStop(0, book.color1);
        bookGrad.addColorStop(1, book.color2);
        ctx.fillStyle = bookGrad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = book.color1;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Book Pages Edge (White spine accent)
        ctx.beginPath();
        ctx.rect(32, -6, 8, 12);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();

        // Label Badge
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#ffffff";
        ctx.fillText(book.label, -6, 0);

        ctx.restore();
      });

      ctx.restore();
    };

    // 5. SIDE OBJECTS: Floating Research Document Card
    const drawResearchCard = (cx: number, cy: number, scale: number, mouseOffset: { x: number; y: number }) => {
      const x = cx + mouseOffset.x;
      const y = cy + mouseOffset.y + Math.cos(time * 0.025) * 6;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.rotate(Math.sin(time * 0.015) * 0.08);

      // Glassmorphic Card
      ctx.beginPath();
      ctx.roundRect(-30, -40, 60, 80, 8);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.shadowBlur = 16;
      ctx.shadowColor = "rgba(37, 99, 235, 0.25)";
      ctx.fill();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Header icon bar
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(-22, -32, 24, 4);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-22, -22, 44, 3);
      ctx.fillRect(-22, -14, 38, 3);
      ctx.fillRect(-22, -6, 40, 3);
      ctx.fillRect(-22, 2, 28, 3);

      // Verified Badge Pill
      ctx.beginPath();
      ctx.roundRect(-22, 16, 44, 14, 7);
      ctx.fillStyle = "#dbeafe";
      ctx.fill();
      ctx.font = "bold 8px sans-serif";
      ctx.fillStyle = "#1d4ed8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✓ Paper", 0, 23);

      ctx.restore();
    };

    // -------------------------------------------------------------
    // MAIN ANIMATION LOOP
    // -------------------------------------------------------------
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      time += 1;

      // Smooth mouse interpolation for physics
      if (isMouseOver && !prefersReducedMotion) {
        smoothMouse.x += (mouse.targetX - smoothMouse.x) * 0.06;
        smoothMouse.y += (mouse.targetY - smoothMouse.y) * 0.06;
      } else {
        smoothMouse.x += (width / 2 - smoothMouse.x) * 0.03;
        smoothMouse.y += (height / 2 - smoothMouse.y) * 0.03;
      }

      // Parallax offsets per layer
      const mouseOffsetX = (smoothMouse.x - width / 2) * 0.05;
      const mouseOffsetY = (smoothMouse.y - height / 2) * 0.05;

      // --- LAYER 1: Background Particles & Ambient Spotlights ---
      bgParticles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        const px = p.x + mouseOffsetX * p.z;
        const py = p.y + mouseOffsetY * p.z;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // --- LAYER 2: Midground Neural Network Mesh ---
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (!prefersReducedMotion) {
          n1.x += n1.vx;
          n1.y += n1.vy;
          if (n1.x < 0 || n1.x > width) n1.vx *= -1;
          if (n1.y < 0 || n1.y > height) n1.vy *= -1;
        }

        const p1x = n1.x + mouseOffsetX * n1.z;
        const p1y = n1.y + mouseOffsetY * n1.z;

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const p2x = n2.x + mouseOffsetX * n2.z;
          const p2y = n2.y + mouseOffsetY * n2.z;

          const dist = Math.hypot(p1x - p2x, p1y - p2y);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Mouse Proximity Lighting & Magnetic Attraction for Nodes
        const distToMouse = Math.hypot(p1x - smoothMouse.x, p1y - smoothMouse.y);
        let nodeGlow = 0.5;
        let scaleBoost = 1;

        if (distToMouse < 180 && isMouseOver) {
          nodeGlow = Math.min(1, 0.5 + (1 - distToMouse / 180) * 0.5);
          scaleBoost = 1 + (1 - distToMouse / 180) * 0.6;
        }

        ctx.beginPath();
        ctx.arc(p1x, p1y, n1.radius * scaleBoost, 0, Math.PI * 2);
        ctx.fillStyle = n1.color;
        ctx.shadowBlur = nodeGlow * 12;
        ctx.shadowColor = n1.color;
        ctx.globalAlpha = nodeGlow;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // --- LOGIN BUTTON PROXIMITY ATTRACTION & RADIAL GLOW ---
      const loginBtnEl = document.getElementById("campuslink-signin-btn");
      if (loginBtnEl) {
        const btnRect = loginBtnEl.getBoundingClientRect();
        const btnCx = btnRect.left + btnRect.width / 2;
        const btnCy = btnRect.top + btnRect.height / 2;

        const distToBtn = Math.hypot(smoothMouse.x - btnCx, smoothMouse.y - btnCy);
        if (distToBtn < 200 && isMouseOver) {
          const intensity = 1 - distToBtn / 200;
          ctx.save();
          ctx.beginPath();
          ctx.arc(btnCx, btnCy, btnRect.width * 0.75, 0, Math.PI * 2);
          const btnGlow = ctx.createRadialGradient(btnCx, btnCy, 10, btnCx, btnCy, btnRect.width * 0.75);
          btnGlow.addColorStop(0, `rgba(37, 99, 235, ${intensity * 0.35})`);
          btnGlow.addColorStop(1, "rgba(37, 99, 235, 0)");
          ctx.fillStyle = btnGlow;
          ctx.fill();
          ctx.restore();
        }
      }

      // --- CURSOR LIGHT RIPPLE HALO ---
      if (isMouseOver && !prefersReducedMotion) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(smoothMouse.x, smoothMouse.y, 45, 0, Math.PI * 2);
        const rippleGrad = ctx.createRadialGradient(smoothMouse.x, smoothMouse.y, 0, smoothMouse.x, smoothMouse.y, 45);
        rippleGrad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
        rippleGrad.addColorStop(0.6, "rgba(99, 102, 241, 0.1)");
        rippleGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = rippleGrad;
        ctx.fill();
        ctx.restore();
      }

      // --- LAYER 3: FOREGROUND 3D OBJECTS (Desktop & Tablet) ---
      if (width >= 640) {
        // Desktop / Tablet layout positions outside the login card
        const fgMouseX = mouseOffsetX * 1.2;
        const fgMouseY = mouseOffsetY * 1.2;

        // 1. TOP-LEFT: AI Neural Sphere
        const sphereX = width * 0.16;
        const sphereY = height * 0.22;
        const sphereRadius = width < 1024 ? 42 : 58;
        drawAINeuralSphere(sphereX, sphereY, sphereRadius, { x: fgMouseX, y: fgMouseY });

        // 2. TOP-RIGHT: 3D Graduation Cap
        const capX = width * 0.84;
        const capY = height * 0.24;
        const capScale = width < 1024 ? 0.75 : 1.0;
        drawGraduationCap(capX, capY, capScale, { x: fgMouseX, y: fgMouseY });

        // 3. BOTTOM-LEFT: AI Laptop
        const laptopX = width * 0.15;
        const laptopY = height * 0.76;
        const laptopScale = width < 1024 ? 0.75 : 1.0;
        drawAILaptop(laptopX, laptopY, laptopScale, { x: fgMouseX, y: fgMouseY });

        // 4. BOTTOM-RIGHT: 3D Knowledge Book Stack
        const bookX = width * 0.85;
        const bookY = height * 0.74;
        const bookScale = width < 1024 ? 0.75 : 1.0;
        drawBookStack(bookX, bookY, bookScale, { x: fgMouseX, y: fgMouseY });

        // 5. SIDE OBJECT: Floating Research Paper Card (Desktop only)
        if (width >= 1024) {
          const cardX = width * 0.88;
          const cardY = height * 0.48;
          drawResearchCard(cardX, cardY, 0.8, { x: fgMouseX * 1.1, y: fgMouseY * 1.1 });
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
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
