import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrainCircuit, Menu, X, LogOut, User, BarChart2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FloatingNav — Centered pill-shaped navigation
 * Completely different from edge-to-edge headers:
 *   - Fixed center-top position
 *   - Frosted glass pill
 *   - Compact: Logo | Links | Auth
 *   - Shrinks slightly on scroll
 */
const FloatingNav = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (p) => location.pathname === p;
  const logout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };

  const isAdmin = user?.role === 'admin';

  const links = [
    { to: '/', label: 'Modules' },
    ...(user && !isAdmin ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    ...(user && isAdmin  ? [{ to: '/admin',     label: 'Admin Panel' }] : []),
  ];

  return (
    <>
      {/* ── Desktop floating pill ─────────────────────────────────── */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          className="nav-pill rounded-full pointer-events-auto flex items-center gap-1"
          animate={{
            paddingTop: scrolled ? '8px' : '10px',
            paddingBottom: scrolled ? '8px' : '10px',
            paddingLeft: scrolled ? '14px' : '18px',
            paddingRight: scrolled ? '14px' : '18px',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 mr-4 flex-shrink-0">
            <motion.div whileHover={{ rotate: 20, scale: 1.15 }} transition={{ type: 'spring', stiffness: 300 }}>
              <BrainCircuit size={20} className="text-sm-violet" />
            </motion.div>
            <span className="font-black text-base tracking-tight">
              <span className="text-gradient-violet">Smriti</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="w-px h-4 bg-sm-border mx-1 hidden sm:block" />

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {links.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${isActive(to)
                    ? (isAdmin ? 'bg-violet-600 text-white shadow-glow-sm' : 'bg-sm-violet text-white shadow-glow-sm')
                    : 'text-slate-400 hover:text-white hover:bg-sm-glass-2'
                  }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-px h-4 bg-sm-border mx-1 hidden sm:block" />

          {/* Auth */}
          <div className="hidden sm:flex items-center gap-1.5">
            {user ? (
              <>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sm-glass border ${isAdmin ? 'border-violet-500/40' : 'border-sm-border'}`}>
                  {isAdmin
                    ? <Shield size={11} className="text-violet-400" />
                    : <User   size={11} className="text-sm-violet" />}
                  <span className="text-xs font-semibold text-slate-300 max-w-[70px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  {isAdmin && <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wide">Admin</span>}
                </div>
                <button onClick={logout}
                  className="p-1.5 rounded-full text-slate-500 hover:text-sm-rose hover:bg-sm-rose/10 transition-colors"
                  title="Logout"
                >
                  <LogOut size={13} />
                </button>
              </>
            ) : (
              <>
                <Link to="/auth-select"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link to="/signup"
                  className="px-4 py-1.5 text-xs font-bold btn-violet text-white rounded-full"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="sm:hidden ml-1 p-1.5 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </motion.div>
      </div>

      {/* ── Mobile dropdown ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed top-20 left-4 right-4 z-50 nav-pill rounded-2xl p-4 space-y-2"
          >
            {links.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive(to) ? (isAdmin ? 'bg-violet-600 text-white' : 'bg-sm-violet text-white') : 'text-slate-400 hover:text-white hover:bg-sm-glass-2'
                  }`}
              >{label}</Link>
            ))}
            {user ? (
              <button onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sm-rose hover:bg-sm-rose/10 w-full transition-colors"
              >
                <LogOut size={14} /> Logout ({user.name.split(' ')[0]})
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link to="/auth-select" className="flex-1 text-center py-2.5 rounded-xl text-sm border border-sm-border text-slate-400">Log in</Link>
                <Link to="/signup" className="flex-1 text-center py-2.5 rounded-xl text-sm btn-violet text-white font-bold">Start Free</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNav;
