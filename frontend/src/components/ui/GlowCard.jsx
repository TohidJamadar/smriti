import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * GlowCard — Reusable depth card with:
 *   - Mouse-tilt 3D effect (rotateX/Y)
 *   - Glow spotlight that follows cursor
 *   - Hover scale + shadow lift
 *   - Animated top accent line
 *
 * Props:
 *   children, className, glowColor, tiltAmount, onClick
 */
const GlowCard = ({
  children,
  className = '',
  glowColor = '14,165,233',   // RGB triplet for cyan
  tiltAmount = 8,             // max tilt degrees
  hover = true,
  onClick,
  style = {},
}) => {
  const ref = useRef(null);

  // ── Raw mouse values ───────────────────────────────────────────────────
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotX = useMotionValue(50); // % position for spotlight
  const spotY = useMotionValue(50);

  // ── Damped spring for smooth tilt ──────────────────────────────────────
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [tiltAmount, -tiltAmount]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltAmount, tiltAmount]), { stiffness: 200, damping: 25 });

  const handleMouseMove = (e) => {
    if (!hover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width  - 0.5;
    const ny = (e.clientY - rect.top)  / rect.height - 0.5;
    x.set(nx);
    y.set(ny);
    spotX.set(((e.clientX - rect.left) / rect.width)  * 100);
    spotY.set(((e.clientY - rect.top)  / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    x.set(0); y.set(0);
    spotX.set(50); spotY.set(50);
  };

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={hover ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      style={{
        rotateX: hover ? rotateX : 0,
        rotateY: hover ? rotateY : 0,
        transformStyle: 'preserve-3d',
        transformPerspective: 800,
        ...style,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`relative glass-card overflow-hidden cursor-default group ${className}`}
    >
      {/* Cursor spotlight glow */}
      {hover && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [spotX, spotY],
              ([sx, sy]) =>
                `radial-gradient(220px circle at ${sx}% ${sy}%, rgba(${glowColor},0.10) 0%, transparent 70%)`
            ),
          }}
        />
      )}

      {/* Top accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-jb-cyan/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {children}
    </motion.div>
  );
};

export default GlowCard;
