import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Cpu, Zap, ChevronRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import useMouseParallax from '../hooks/useMouseParallax';
import { staggerContainer, staggerItem, fadeUp, VIEWPORT_CONFIG } from '../hooks/useScrollAnimation';

/* ── Orbital ring visual (hero right panel) ────────────────────────────────── */
const OrbitalRing = () => (
  <div className="relative w-full max-w-[380px] aspect-square mx-auto flex-shrink-0">
    {/* Outer ring — spins slow */}
    <div className="absolute inset-0 rounded-full border border-sm-violet/20 animate-spin-slow" />
    {/* Mid ring — reverse spin */}
    <div className="absolute inset-[12%] rounded-full border border-sm-lime/15 animate-spin-rev" />
    {/* Inner ring */}
    <div className="absolute inset-[22%] rounded-full border border-sm-cyan/20" />

    {/* Orbiting dot 1 — violet */}
    <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sm-violet shadow-glow-violet -translate-y-1.5" />
    </motion.div>
    {/* Orbiting dot 2 — lime */}
    <motion.div className="absolute inset-[12%]" animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sm-lime shadow-glow-lime translate-y-1" />
    </motion.div>

    {/* Center orb */}
    <div className="absolute inset-[32%] rounded-full bg-gradient-to-br from-sm-violet/40 to-sm-bg-2 border border-sm-violet/30 animate-orb-pulse flex items-center justify-center shadow-glow-violet">
      <Cpu size={28} className="text-sm-violet-pale" />
    </div>

    {/* Data readout floats */}
    {[
      { label: 'Memory',   val: '94%', pos: 'top-[15%] right-[5%]',   color: 'text-sm-violet-pale' },
      { label: 'Focus',    val: '87%', pos: 'bottom-[18%] left-[3%]',  color: 'text-sm-lime' },
      { label: 'Reaction', val: '91%', pos: 'bottom-[8%] right-[8%]',  color: 'text-sm-cyan' },
    ].map(({ label, val, pos, color }) => (
      <motion.div key={label} className={`absolute ${pos} panel rounded-lg px-2.5 py-1.5`}
        animate={{ y: [0, -5, 0] }} transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-black ${color}`}>{val}</div>
      </motion.div>
    ))}
  </div>
);

/* ── Module card ─────────────────────────────────────────────────────────────── */
const MODULE_COLORS = ['neon-left-violet', 'neon-left-lime', 'neon-left-cyan'];
const MODULE_ACCENTS = ['sm-violet', 'sm-lime', 'sm-cyan'];

const ModuleCard = ({ test, index, featured = false }) => {
  const colorClass  = MODULE_COLORS[index % 3];
  const accentColor = ['#8b5cf6', '#a3e635', '#22d3ee'][index % 3];

  return (
    <motion.div variants={staggerItem}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={`panel rounded-2xl ${colorClass} overflow-hidden group ${featured ? 'p-8' : 'p-6'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase"
            style={{ color: accentColor }}
          >
            MOD-{String(index + 1).padStart(2, '0')}
          </span>
          <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: accentColor }} />
        </div>
        {featured && <span className="text-[10px] font-bold text-sm-lime bg-sm-lime/10 border border-sm-lime/20 px-2.5 py-1 rounded-full tracking-widest uppercase">Featured</span>}
      </div>

      <h3 className={`font-bold text-white mb-2 leading-tight ${featured ? 'text-2xl' : 'text-lg'}`}>
        {test.title}
      </h3>
      <p className={`text-slate-500 leading-relaxed mb-6 ${featured ? 'text-base max-w-lg' : 'text-sm'}`}>
        {test.description}
      </p>

      <Link to={`/test/${test.id}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-outline-violet group-hover:btn-violet transition-all"
        style={{ borderColor: `${accentColor}60`, color: accentColor }}
      >
        Launch <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
};

/* ── Landing Page ────────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });

  const { x: mx, y: my } = useMouseParallax({ strength: 22 });
  const { scrollY }      = useScroll();
  const heroY            = useTransform(scrollY, [0, 500], [0, -80]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    fetch(`${base}/api/tests`).then(r => r.json()).then(d => { setTests(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/auth-select" replace />;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-sm-violet/20 border-t-sm-violet animate-spin" />
        <span className="text-[10px] text-slate-600 tracking-widest uppercase animate-pulse">Initializing</span>
      </div>
    </div>
  );

  const [featured, ...rest] = tests;

  return (
    <div className="min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center pt-28 pb-20 px-6 md:px-12 lg:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: text */}
            <motion.div style={{ y: heroY }}>
              <motion.div initial="hidden" animate="visible" variants={staggerContainer(0.1)}>
                {/* System badge */}
                <motion.div variants={fadeUp} className="mb-8">
                  <div className="inline-flex items-center gap-2.5 panel rounded-full px-4 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sm-lime animate-blink" />
                    <span className="font-mono text-[11px] text-slate-400 tracking-widest uppercase">
                      System Online · AI Ready
                    </span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={fadeUp} className="mb-6">
                  <h1 className="font-black tracking-tighter leading-[0.88]"
                    style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
                  >
                    <span className="block text-white">Measure</span>
                    <span className="block text-white">your</span>
                    <span className="block text-gradient-main">cognitive</span>
                    <span className="block text-white">edge.</span>
                  </h1>
                </motion.div>

                <motion.p variants={fadeUp}
                  className="text-slate-400 text-lg leading-relaxed max-w-md mb-10"
                >
                  Clinical-grade brain assessment with{' '}
                  <span className="text-sm-violet font-medium">real-time AI grading</span>{' '}
                  and deep cognitive analytics.
                </motion.p>

                {/* CTAs */}
                <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-12">
                  {tests[0] && (
                    <Link to={`/test/${tests[0].id}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 font-bold btn-violet text-white rounded-2xl text-sm"
                    >
                      <Zap size={15} /> Begin Assessment
                    </Link>
                  )}
                  <Link to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3.5 font-bold btn-outline-violet text-sm rounded-2xl text-sm-violet"
                  >
                    My Dashboard <ArrowRight size={14} />
                  </Link>
                </motion.div>

                {/* Mini stats */}
                <motion.div variants={fadeUp} className="flex gap-10">
                  {[
                    { n: tests.length, label: 'Modules', color: 'text-sm-violet' },
                    { n: '100%', label: 'AI-Graded', color: 'text-sm-lime' },
                    { n: '<10min', label: 'Per Test', color: 'text-sm-cyan' },
                  ].map(({ n, label, color }) => (
                    <div key={label}>
                      <div className={`text-2xl font-black tabular-nums ${color}`}>{n}</div>
                      <div className="text-xs text-slate-600 uppercase tracking-widest mt-0.5">{label}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right: orbital visual with mouse parallax */}
            <motion.div style={{ x: mx, y: my }} className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              >
                <OrbitalRing />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SKEWED DIVIDER ──────────────────────────────────────────── */}
      <div className="relative h-16 -mt-8 overflow-hidden">
        <div className="absolute inset-0 bg-sm-bg-1 origin-left" style={{ transform: 'skewY(-2deg)' }} />
        <div className="absolute inset-0 border-t border-sm-border origin-left" style={{ transform: 'skewY(-2deg)' }} />
      </div>

      {/* ── MODULES ───────────────────────────────────────────────────── */}
      <section className="bg-sm-bg-1 px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto">

          <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT_CONFIG} variants={staggerContainer(0.08)} className="mb-12">
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px]" style={{ background: 'linear-gradient(90deg, #8b5cf6, transparent)' }} />
              <span className="font-mono text-[11px] text-sm-violet tracking-widest uppercase">Assessment Library</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Choose your module
            </motion.h2>
          </motion.div>

          {/* Featured (first) — full width */}
          {featured && (
            <motion.div className="mb-5"
              initial="hidden" whileInView="visible" viewport={VIEWPORT_CONFIG} variants={staggerContainer(0.05)}
            >
              <ModuleCard test={featured} index={0} featured />
            </motion.div>
          )}

          {/* Remaining — 3-col grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" whileInView="visible" viewport={VIEWPORT_CONFIG} variants={staggerContainer(0.07)}
          >
            {rest.map((t, i) => <ModuleCard key={t.id} test={t} index={i + 1} />)}
          </motion.div>
        </div>
      </section>

      {/* ── BOTTOM SKEW ───────────────────────────────────────────────── */}
      <div className="relative h-16 overflow-hidden">
        <div className="absolute inset-0 bg-sm-bg-1 origin-right" style={{ transform: 'skewY(2deg)' }} />
      </div>
    </div>
  );
};

export default LandingPage;