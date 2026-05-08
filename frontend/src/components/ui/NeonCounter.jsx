import React, { useEffect, useRef, useState } from 'react';

/**
 * NeonCounter — Animated number that counts up to target value.
 * Gaming-inspired: fast start, eases out at the end.
 *
 * Props: to (target), duration (ms), decimals, prefix, suffix
 */
const NeonCounter = ({
  to = 0,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    start.current = null;
    const step = (ts) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((to * eased).toFixed(decimals)));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration, decimals]);

  return (
    <span className={className}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}{suffix}
    </span>
  );
};

export default NeonCounter;
