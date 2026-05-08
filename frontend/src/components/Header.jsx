import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BrainCircuit, LogOut, User, Sun, Moon,
  BarChart2, Globe, ChevronDown, Menu, X,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LANGUAGES = [
  { code: 'en',    label: 'English' },
  { code: 'hi',    label: 'हिंदी (Hindi)' },
  { code: 'mr',    label: 'मराठी (Marathi)' },
  { code: 'es',    label: 'Español' },
  { code: 'fr',    label: 'Français' },
  { code: 'zh-CN', label: '中文' },
];

const NAV_LINKS = [
  { to: '/', label: 'Modules' },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2, authRequired: true },
];

const Header = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const [langOpen, setLangOpen]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const langRef = useRef(null);

  // ── Track scroll to tighten header ──────────────────────────────────────
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 30));

  // ── Close on outside click & route change ───────────────────────────────
  useEffect(() => {
    const fn = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  useEffect(() => { setMobileOpen(false); setLangOpen(false); }, [location.pathname]);

  const handleLangChange = (code) => {
    document.cookie = `googtrans=/en/${code}; path=/`;
    document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/`;
    window.location.reload();
  };
  const handleLogout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.header
        animate={{
          backgroundColor: scrolled ? 'rgba(5,5,10,0.88)' : 'rgba(5,5,10,0.3)',
          backdropFilter:  scrolled ? 'blur(24px) saturate(180%)' : 'blur(12px)',
          borderBottomColor: scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        }}
        transition={{ duration: 0.35 }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ WebkitBackdropFilter: 'blur(24px)' }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-jb-cyan/60 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <motion.div whileHover={{ rotate: 18, scale: 1.12 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <BrainCircuit size={24} className="text-jb-cyan" />
            </motion.div>
            <span className="font-black text-xl tracking-tighter">
              <span className="bg-gradient-to-r from-jb-cyan via-cyan-300 to-jb-purple bg-clip-text text-transparent">
                Smriti
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            <div id="google_translate_element" className="hidden" />

            {/* Nav links */}
            {NAV_LINKS.filter(l => !l.authRequired || user).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
                  ${isActive(to)
                    ? 'text-jb-cyan bg-jb-cyan/10 border border-jb-cyan/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {Icon && <Icon size={13} />}
                {label}
                {isActive(to) && (
                  <motion.div layoutId="navIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-jb-cyan"
                  />
                )}
              </Link>
            ))}

            {/* Language */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-jb-border hover:border-jb-cyan/40 text-slate-400 hover:text-white transition-all text-xs"
              >
                <Globe size={13} className="text-jb-cyan" />
                <ChevronDown size={11} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 w-44 py-1.5 glass rounded-xl shadow-2xl z-50 origin-top-right"
                  >
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => handleLangChange(l.code)}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-jb-cyan/10 transition-colors"
                      >{l.label}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme */}
            <motion.button onClick={toggleTheme} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9, rotate: 15 }}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-jb-border hover:border-jb-cyan/40 text-slate-400 hover:text-white transition-colors"
            >
              {isDark ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-indigo-400" />}
            </motion.button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl ml-1">
                <div className="w-5 h-5 rounded-lg bg-jb-cyan/20 flex items-center justify-center">
                  <User size={11} className="text-jb-cyan" />
                </div>
                <span className="text-xs font-semibold text-slate-200 max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                <div className="w-px h-3.5 bg-white/10" />
                <motion.button onClick={handleLogout} whileHover={{ color: '#f87171' }}
                  className="text-slate-500 p-0.5" title="Logout"
                >
                  <LogOut size={12} />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link to="/login" className="px-3 py-1.5 text-xs text-slate-400 font-medium hover:text-white transition-colors">
                  Log In
                </Link>
                <Link to="/signup"
                  className="px-4 py-1.5 text-xs font-bold bg-jb-cyan hover:bg-jb-cyan-light text-white rounded-xl transition-colors shadow-glow-sm hover:shadow-glow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <motion.button className="md:hidden glass w-9 h-9 flex items-center justify-center rounded-xl"
            onClick={() => setMobileOpen(!mobileOpen)} whileTap={{ scale: 0.9 }}
          >
            {mobileOpen ? <X size={16} className="text-white" /> : <Menu size={16} className="text-slate-300" />}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
            className="fixed top-16 left-0 right-0 z-40 glass-strong border-b border-jb-border px-4 py-4 space-y-2 md:hidden"
          >
            {NAV_LINKS.filter(l => !l.authRequired || user).map(({ to, label }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive(to) ? 'bg-jb-cyan/10 text-jb-cyan border border-jb-cyan/20' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >{label}</Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 w-full transition-colors">
                <LogOut size={15} /> Logout ({user.name.split(' ')[0]})
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link to="/login" className="flex-1 text-center px-3 py-2.5 rounded-xl text-sm border border-jb-border text-slate-300">Log In</Link>
                <Link to="/signup" className="flex-1 text-center px-3 py-2.5 rounded-xl text-sm bg-jb-cyan text-white font-bold">Get Started</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer — so content starts below fixed header */}
      <div className="h-16" />
    </>
  );
};

export default Header;
