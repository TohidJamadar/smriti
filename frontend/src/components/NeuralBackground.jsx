import React, { useEffect, useRef } from 'react';

/**
 * NeuralBackground — Enhanced
 * ────────────────────────────
 * Improvements over the original:
 *   1. Mouse-based parallax: particles subtly shift toward cursor (very gentle)
 *   2. Dual color palette: cyan + purple tones for a gaming-depth gradient feel
 *   3. Particle size variation with opacity tiers (foreground / midground / background)
 *   4. Reduced connection threshold on mobile to avoid lag
 *   5. Performance: particle count capped at 80
 */
const NeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // ─── Mouse with smooth lerp target ────────────────────────────────────
    let mouse = { x: null, y: null, targetX: null, targetY: null };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      if (!mouse.x) { mouse.x = e.clientX; mouse.y = e.clientY; }
    };

    const resizeCanvas = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ─── Particle class ────────────────────────────────────────────────────
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x      = Math.random() * canvas.width;
        this.y      = Math.random() * canvas.height;
        // Depth tier: 0 (far) → 1 (close)
        this.depth  = Math.random();
        this.size   = this.depth * 2 + 0.5;
        const speed = 0.12 + this.depth * 0.3;
        this.speedX = (Math.random() - 0.5) * speed;
        this.speedY = (Math.random() - 0.5) * speed;
        // Alternate hue: cyan (primary) or purple (accent)
        this.hue    = Math.random() > 0.65 ? 270 : 190; // purple vs cyan
        this.alpha  = 0.2 + this.depth * 0.5;
      }

      update() {
        // Subtle mouse parallax — deeper particles move less
        if (mouse.x && mouse.targetX) {
          // Smooth lerp toward mouse target
          mouse.x += (mouse.targetX - mouse.x) * 0.04;
          mouse.y += (mouse.targetY - mouse.y) * 0.04;

          const dx      = (mouse.x - canvas.width / 2)  / canvas.width;
          const dy      = (mouse.y - canvas.height / 2) / canvas.height;
          const parallaxStrength = this.depth * 0.4; // near = stronger pull
          this.x += dx * parallaxStrength;
          this.y += dy * parallaxStrength;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges (smoother than bouncing)
        if (this.x > canvas.width  + 10) this.x = -10;
        if (this.x < -10) this.x = canvas.width  + 10;
        if (this.y > canvas.height + 10) this.y = -10;
        if (this.y < -10) this.y = canvas.height + 10;
      }

      draw() {
        // Outer soft glow for close particles
        if (this.depth > 0.6) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, 0.06)`;
          ctx.fill();
        }
        // Core dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.alpha})`;
        ctx.fill();
      }
    }

    // ─── Init — capped at 80 for performance ──────────────────────────────
    const init = () => {
      particles = [];
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 80);
      for (let i = 0; i < count; i++) particles.push(new Particle());
    };

    // ─── Draw connections between nearby particles ─────────────────────────
    const connect = () => {
      // Reduce connection distance on mobile
      const maxDist = canvas.width < 768 ? 80 : 130;
      const maxDistSq = maxDist * maxDist;

      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx   = particles[a].x - particles[b].x;
          const dy   = particles[a].y - particles[b].y;
          const dist = dx * dx + dy * dy;

          if (dist < maxDistSq) {
            const opacity = (1 - dist / maxDistSq) * 0.35;
            // Gradient line between the two particle hues
            const grad = ctx.createLinearGradient(
              particles[a].x, particles[a].y,
              particles[b].x, particles[b].y
            );
            grad.addColorStop(0, `hsla(${particles[a].hue}, 80%, 65%, ${opacity})`);
            grad.addColorStop(1, `hsla(${particles[b].hue}, 80%, 65%, ${opacity})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = particles[a].depth * 1.2;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }

        // Mouse connection — bright accent line
        if (mouse.x) {
          const dx   = particles[a].x - mouse.x;
          const dy   = particles[a].y - mouse.y;
          const dist = dx * dx + dy * dy;
          if (dist < 22500) { // 150px radius
            const opacity = (1 - dist / 22500) * 0.7 * particles[a].depth;
            ctx.strokeStyle = `hsla(190, 100%, 60%, ${opacity})`;
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    };

    // ─── Main loop ────────────────────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) { p.update(); p.draw(); }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

export default NeuralBackground;