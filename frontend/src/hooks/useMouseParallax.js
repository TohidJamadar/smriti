import { useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

/**
 * useMouseParallax — Returns smooth spring-damped x/y values
 * that follow the mouse, normalized to [-0.5, 0.5] range.
 *
 * Usage:
 *   const { x, y } = useMouseParallax({ strength: 20 });
 *   // Apply as: style={{ x: useTransform(x, v => v * strength), y: ... }}
 *
 * Options:
 *   strength  — max pixel offset (default 20)
 *   stiffness — spring stiffness (default 80)
 *   damping   — spring damping (default 20)
 */
const useMouseParallax = ({
  strength = 20,
  stiffness = 80,
  damping = 20,
  disabled = false,
} = {}) => {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { stiffness, damping });
  const y = useSpring(rawY, { stiffness, damping });

  useEffect(() => {
    if (disabled) return;

    const handle = (e) => {
      // Normalize to [-0.5, 0.5] * strength
      const nx = (e.clientX / window.innerWidth  - 0.5) * strength;
      const ny = (e.clientY / window.innerHeight - 0.5) * strength;
      rawX.set(nx);
      rawY.set(ny);
    };

    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, [disabled, strength, rawX, rawY]);

  return { x, y };
};

export default useMouseParallax;
