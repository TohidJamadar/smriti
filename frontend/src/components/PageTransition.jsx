import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — Wraps page content with smooth enter/exit animations.
 * Uses Framer Motion AnimatePresence with location key for route transitions.
 *
 * Animation: fade + slight vertical slide (professional, not jarring)
 */
const variants = {
  initial: { opacity: 0, y: 14 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25, ease: 'easeIn' } },
};

export const PageTransition = ({ children }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="enter"
    exit="exit"
    className="w-full"
  >
    {children}
  </motion.div>
);

/**
 * AnimatedRoutes — Drop-in wrapper for <Routes>.
 * Reads location to key AnimatePresence correctly.
 */
export const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} variants={variants}
        initial="initial" animate="enter" exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
