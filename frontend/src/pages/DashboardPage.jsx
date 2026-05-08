import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BarChart2, TrendingUp, Brain, Trophy, Target, Activity, ArrowRight, Calendar, Zap, AlertCircle, CheckCircle2, Star, Bell, MessageSquare, BellDot } from 'lucide-react';
import { motion } from 'framer-motion';
import NeonCounter from '../components/ui/NeonCounter';
import { fadeUp, staggerContainer, staggerItem, VIEWPORT_CONFIG } from '../hooks/useScrollAnimation';
import { generateDashboardNarrative } from '../utils/dashboardAnalysis';

// ─── Module metadata — now includes alzheimers-extended + Reaction domain ─────
const MODULE_META = {
  'mindcheck-full': { label: 'General Cognitive', color: '#8b5cf6', domains: { Memory: 0.3, Language: 0.4, Attention: 0.3 } },
  'executive-us-standard': { label: 'Executive Function', color: '#a3e635', domains: { Executive: 0.5, Attention: 0.3, Memory: 0.2 } },
  'spatial-dynamics': { label: 'Spatial & Reaction', color: '#22d3ee', domains: { Spatial: 0.6, Reaction: 0.4 } },
  'ai-semantic': { label: 'AI Clinical Interview', color: '#fb7185', domains: { Language: 0.5, Executive: 0.3, Memory: 0.2 } },
  'alzheimers-extended': { label: "Alzheimer's Battery", color: '#f97316', domains: { Memory: 0.5, Language: 0.3, Attention: 0.2 } },
};
const DOMAINS = ['Memory', 'Attention', 'Language', 'Executive', 'Spatial', 'Reaction'];
const scorePct = (s, m) => (m > 0 ? Math.round((s / m) * 100) : 0);

// ─── Domain meta for analysis cards ──────────────────────────────────────────
const DOMAIN_META = {
  Memory: { color: '#8b5cf6', icon: '🧠', tip: 'Try daily word recall exercises and memory games.' },
  Attention: { color: '#22d3ee', icon: '🎯', tip: 'Mindfulness and focused reading improve sustained attention.' },
  Language: { color: '#fb7185', icon: '💬', tip: 'Reading aloud and word-finding games strengthen language skills.' },
  Executive: { color: '#a3e635', icon: '⚙️', tip: 'Puzzle solving and planning tasks develop executive control.' },
  Spatial: { color: '#f97316', icon: '📐', tip: 'Drawing, construction puzzles, and navigation exercises help spatial ability.' },
  Reaction: { color: '#fbbf24', icon: '⚡', tip: 'Reflex-based games and physical coordination activities improve reaction speed.' },
};

// ─── Overall Cognitive Analysis Section ─────────────────────────────────────
const CognitiveAnalysis = ({ domainScores, moduleGroups }) => {
  const narrative = generateDashboardNarrative(domainScores, moduleGroups);
  const hasData = Object.values(domainScores).some(v => v > 0);

  return (
    <motion.div className="mb-5"
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_CONFIG} transition={{ duration: 0.5 }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-sm-violet" />
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Overall Cognitive Analysis</h2>
        {!hasData && <span className="text-xs text-slate-600 ml-auto">Complete tests to unlock insights</span>}
      </div>

      {/* Domain score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {DOMAINS.map(domain => {
          const score = domainScores[domain] || 0;
          const meta = DOMAIN_META[domain];
          const isStrong = score >= 70;
          const isWeak = score > 0 && score < 50;
          return (
            <motion.div key={domain}
              initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.35 }}
              className="panel rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden"
              style={score > 0 ? { borderColor: meta.color + '30' } : {}}
            >
              {isStrong && <div className="absolute inset-0 opacity-5 rounded-2xl" style={{ background: meta.color }} />}
              <span className="text-2xl mb-2">{meta.icon}</span>
              <div className="text-xl font-black tabular-nums mb-1"
                style={{ color: score > 0 ? meta.color : '#334155' }}>
                {score > 0 ? `${score}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{domain}</div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} whileInView={{ width: `${score}%` }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: meta.color }}
                />
              </div>
              {isStrong && <span className="text-[9px] mt-1 font-bold" style={{ color: meta.color }}>STRENGTH</span>}
              {isWeak && <span className="text-[9px] mt-1 font-bold text-red-400">NEEDS FOCUS</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic narrative panels */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Cognitive Summary — full dynamic paragraph */}
          <div className="panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-sm-lime" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Cognitive Summary</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">{narrative.summary}</p>
            {narrative.strengths.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {narrative.strengths.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />{s}
                  </div>
                ))}
              </div>
            )}
            {narrative.weakAreas.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {narrative.weakAreas.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />{s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvement Tips — dynamic, score-conditioned */}
          <div className="panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-sm-cyan" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Improvement Tips</span>
            </div>
            <div className="space-y-3">
              {narrative.tips.length > 0
                ? narrative.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-sm-violet font-bold flex-shrink-0 mt-0.5">▸</span>
                    <span>{tip}</span>
                  </div>
                ))
                : <p className="text-xs text-slate-500">All assessed domains are performing well!</p>
              }
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Stat Strip (NOT boxed cards — raw numbers with labels) ──────────────────
const StatStrip = ({ results, highestPct, avgPct, favLabel }) => {
  const stats = [
    { n: results.length, label: 'Tests Run', suffix: '', color: '#8b5cf6' },
    { n: highestPct, label: 'Best Score', suffix: '%', color: '#a3e635' },
    { n: avgPct, label: 'Avg Score', suffix: '%', color: '#22d3ee' },
  ];
  return (
    <div className="flex flex-wrap gap-12 items-end py-8 border-b border-sm-border mb-10">
      {stats.map(({ n, label, suffix, color }) => (
        <div key={label}>
          <div className="stat-number" style={{ color }}>
            <NeonCounter to={n} duration={1200} suffix={suffix} />
          </div>
          <div className="text-xs text-slate-600 uppercase tracking-widest font-bold mt-1">{label}</div>
        </div>
      ))}
      <div className="ml-auto hidden lg:block text-right">
        <div className="text-xs text-slate-600 uppercase tracking-widest font-bold mb-1">Top Module</div>
        <div className="text-lg font-black text-white truncate max-w-[200px]">{favLabel}</div>
      </div>
    </div>
  );
};

// ─── Animated bar chart ───────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  if (!data.length) return <p className="text-slate-600 text-sm py-6 text-center">No module data yet.</p>;
  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <motion.div key={item.testId}
          initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
              <span className="text-sm font-medium text-slate-300">{item.label}</span>
            </div>
            <span className="text-sm font-black tabular-nums" style={{ color: item.color }}>{item.bestPct}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} whileInView={{ width: `${item.bestPct}%` }}
              viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: `linear-gradient(90deg, ${item.color}60, ${item.color})`, boxShadow: `0 0 6px ${item.color}55` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Line chart (original SVG — layout only changes) ─────────────────────────
const LineChart = ({ data }) => {
  const W = 560, H = 185, PL = 44, PR = 16, PT = 16, PB = 32, iW = W - PL - PR, iH = H - PT - PB;
  const yTicks = [0, 25, 50, 75, 100];
  if (data.length < 2) return (<div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-700"><TrendingUp size={28} className="opacity-30" /><p className="text-sm">Complete 2+ tests to see trend</p></div>);
  const toX = (i) => PL + (i / (data.length - 1)) * iW;
  const toY = (v) => PT + iH - (v / 100) * iH;
  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.pct), ...d }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(H - PB).toFixed(1)} L${PL},${(H - PB).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" overflow="visible">
      <defs>
        <linearGradient id="lgArea2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" /></linearGradient>
        <linearGradient id="lgLine2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#a3e635" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
        <filter id="ptGlow2"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {yTicks.map(t => (<g key={t}><line x1={PL} y1={toY(t)} x2={W - PR} y2={toY(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,4" /><text x={PL - 6} y={toY(t) + 4} textAnchor="end" fill="#1e293b" fontSize="10">{t}%</text></g>))}
      <path d={areaPath} fill="url(#lgArea2)" />
      <path d={linePath} fill="none" stroke="url(#lgLine2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 3000, strokeDashoffset: 3000, animation: 'dashDraw 1.6s ease-out forwards' }} />
      {pts.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="7" fill="#8b5cf6" fillOpacity="0.12" /><circle cx={p.x} cy={p.y} r="3.5" fill="#8b5cf6" filter="url(#ptGlow2)" /><text x={p.x} y={p.y - 11} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600">{p.pct}%</text></g>))}
    </svg>
  );
};

// ─── Radar chart (original — only colors updated) ─────────────────────────────
const RadarChart = ({ scores }) => {
  const CX = 130, CY = 130, R = 90, n = DOMAINS.length, step = (2 * Math.PI) / n, start = -Math.PI / 2;
  const pt = (idx, r) => ({ x: CX + r * Math.cos(start + idx * step), y: CY + r * Math.sin(start + idx * step) });
  const rings = [0.25, 0.5, 0.75, 1];
  const dataPts = DOMAINS.map((d, i) => pt(i, ((scores[d] || 0) / 100) * R));
  const dataD = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
  const hasData = DOMAINS.some(d => (scores[d] || 0) > 0);
  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[200px] mx-auto">
      <defs>
        <linearGradient id="rdrG2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a3e635" stopOpacity="0.4" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" /></linearGradient>
        <filter id="rdrGlow2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {rings.map((r, ri) => { const p = DOMAINS.map((_, i) => pt(i, r * R)); const d = p.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ') + 'Z'; return <path key={ri} d={d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />; })}
      {DOMAINS.map((_, i) => { const ax = pt(i, R); return <line key={i} x1={CX} y1={CY} x2={ax.x.toFixed(1)} y2={ax.y.toFixed(1)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />; })}
      {hasData && <path d={dataD} fill="url(#rdrG2)" stroke="#a3e635" strokeWidth="1.5" filter="url(#rdrGlow2)" />}
      {hasData && dataPts.map((p, i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#8b5cf6" filter="url(#rdrGlow2)" />)}
      {DOMAINS.map((d, i) => { const lp = pt(i, R + 22); return <text key={d} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fill={scores[d] > 0 ? '#475569' : '#1e293b'} fontSize="10" fontWeight="600">{d}</text>; })}
    </svg>
  );
};

// ─── Admin Alerts / Suggestions Panel ───────────────────────────────────────
const AdminAlerts = ({ userToken }) => {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const fetchMessages = useCallback(() => {
    fetch(`${base}/api/user/messages`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userToken, base]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (id) => {
    try {
      await fetch(`${base}/api/user/messages/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' }
      });
      setMessages(prev => prev.map(m => m._id === id ? { ...m, isRead: true } : m));
    } catch { /* noop */ }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (!loading && messages.length === 0) return null;

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-2.5 mb-3 w-full text-left group">
        <div className="relative">
          {unreadCount > 0 ? <BellDot size={17} className="text-amber-400" /> : <Bell size={17} className="text-slate-500" />}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center" style={{ lineHeight: 1 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Suggestions from Admin</h2>
        {unreadCount > 0 && <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
        <span className="ml-auto text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">{collapsed ? 'Show ▾' : 'Hide ▴'}</span>
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {loading && (
            <div className="panel rounded-2xl p-5 text-center">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && messages.map((msg, i) => (
            <motion.div key={msg._id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className={`panel rounded-2xl p-5 relative overflow-hidden transition-all ${msg.isRead ? 'border-white/07 opacity-80' : 'border-amber-400/25'}`}
              style={!msg.isRead ? { boxShadow: '0 0 0 1px rgba(251,191,36,0.15), 0 4px 24px rgba(0,0,0,0.5)' } : {}}
            >
              {!msg.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-400 to-orange-500" />}
              
              <div className="flex items-start gap-3 pl-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.isRead ? 'bg-white/05 border border-white/08' : 'bg-amber-400/10 border border-amber-400/25'}`}>
                  <MessageSquare size={16} className={msg.isRead ? 'text-slate-500' : 'text-amber-400'} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className={`font-bold text-sm leading-snug ${msg.isRead ? 'text-slate-300' : 'text-white'}`}>{msg.subject}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!msg.isRead && <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>}
                      <span className="text-[10px] text-slate-600">{new Date(msg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed mb-3 ${msg.isRead ? 'text-slate-500' : 'text-slate-300'}`}>{msg.body}</p>
                  <div className="flex items-center gap-3">
                    {msg.isRead ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500"><CheckCircle2 size={11} /> Read</span>
                    ) : (
                      <button onClick={() => markRead(msg._id)} className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/08 hover:bg-amber-400/15 px-2.5 py-1 rounded-lg transition-colors">
                        <CheckCircle2 size={11} /> Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const DashStyle = () => (
  <style>{`@keyframes dashDraw { to { stroke-dashoffset: 0; } }`}</style>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useEffect(() => {
    let base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    fetch(`${base}/api/tests/results`, { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(async r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setResults(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/auth-select" replace />;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-sm-violet/20 border-t-sm-violet rounded-full animate-spin mx-auto" />
        <p className="font-mono text-[10px] text-slate-600 tracking-widest uppercase animate-pulse">Syncing Data</p>
      </div>
    </div>
  );

  // ── Unchanged analytics logic ─────────────────────────────────────────────
  const valid = results.filter(r => r.maxScore > 0);
  const allPcts = valid.map(r => scorePct(r.finalScore, r.maxScore));
  const avgPct = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;
  const highestPct = allPcts.length ? Math.max(...allPcts) : 0;
  const moduleCounts = results.reduce((acc, r) => { acc[r.testId] = (acc[r.testId] || 0) + 1; return acc; }, {});
  const favModuleId = Object.keys(moduleCounts).sort((a, b) => moduleCounts[b] - moduleCounts[a])[0];
  const favLabel = favModuleId ? (MODULE_META[favModuleId]?.label ?? favModuleId) : '—';
  const lineData = [...valid].reverse().map(r => ({ pct: scorePct(r.finalScore, r.maxScore), label: MODULE_META[r.testId]?.label ?? r.testId, date: new Date(r.createdAt).toLocaleDateString() }));
  const moduleGroups = results.reduce((acc, r) => { (acc[r.testId] = acc[r.testId] || []).push(r); return acc; }, {});
  const barData = Object.keys(moduleGroups).map(id => {
    const best = moduleGroups[id].reduce((b, r) => { const p = scorePct(r.finalScore, r.maxScore); return p > b.pct ? { pct: p } : b; }, { pct: 0 });
    return { testId: id, label: MODULE_META[id]?.label ?? id, color: MODULE_META[id]?.color ?? '#8b5cf6', bestPct: best.pct, attempts: moduleGroups[id].length };
  }).sort((a, b) => b.bestPct - a.bestPct);
  const domainScores = Object.fromEntries(DOMAINS.map(d => {
    const c = Object.keys(moduleGroups).flatMap(id => { const m = MODULE_META[id]; if (!m?.domains[d]) return []; const bp = Math.max(...moduleGroups[id].map(r => scorePct(r.finalScore, r.maxScore))); return [{ pct: bp, w: m.domains[d] }]; });
    if (!c.length) return [d, 0];
    const tw = c.reduce((s, x) => s + x.w, 0);
    return [d, Math.round(c.reduce((s, x) => s + x.pct * x.w, 0) / tw)];
  }));
  const recent = results.slice(0, 6);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!results.length) return (
    <div className="min-h-screen pt-28 flex flex-col items-center justify-start px-6">
      <DashStyle />
      <div className="w-full max-w-2xl mt-4 mb-6">
        <AdminAlerts userToken={user?.token} />
      </div>
      <motion.div initial="hidden" animate="visible" variants={staggerContainer(0.1)} className="text-center max-w-md mt-10">
        <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sm-violet/10 border border-sm-violet/20 mb-8" style={{ boxShadow: '0 0 24px rgba(139,92,246,0.2)' }}>
          <BarChart2 size={36} className="text-sm-violet" />
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-4xl font-black text-white mb-4">No Results Yet</motion.h1>
        <motion.p variants={fadeUp} className="text-slate-500 text-lg mb-10">Complete a module to unlock your command center.</motion.p>
        <motion.div variants={fadeUp}>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3.5 font-bold text-white btn-violet rounded-2xl text-sm">
            <Zap size={15} /> Start a Module
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 px-6 md:px-10 pb-20">
      <DashStyle />
      <div className="max-w-7xl mx-auto">

        {/* Page title */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-sm-lime animate-blink" />
            <span className="font-mono text-[11px] text-sm-lime tracking-widest uppercase">Command Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {user?.name?.split(' ')[0] ?? 'User'}
            <span className="text-gradient-violet"> · Dashboard</span>
          </h1>
        </motion.div>

        {/* Admin Alerts */}
        <AdminAlerts userToken={user?.token} />

        {/* Stat strip — raw numbers, no boxes */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <StatStrip results={results} highestPct={highestPct} avgPct={avgPct} favLabel={favLabel} />
        </motion.div>

        {/* Overall Cognitive Analysis */}
        <CognitiveAnalysis domainScores={domainScores} moduleGroups={moduleGroups} />

        {/* Main: 3-col asymmetric grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">

          {/* Performance trend — 7 cols */}
          <motion.div className="lg:col-span-7 panel rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_CONFIG} transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={15} className="text-sm-violet" />
              <h2 className="text-sm font-bold text-white">Performance Trend</h2>
              <span className="ml-auto font-mono text-[10px] text-slate-600">{lineData.length} sessions</span>
            </div>
            <LineChart data={lineData} />
          </motion.div>

          {/* Cognitive radar — 5 cols */}
          <motion.div className="lg:col-span-5 panel rounded-2xl p-6 flex flex-col"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_CONFIG} transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain size={15} className="text-sm-lime" />
              <h2 className="text-sm font-bold text-white">Cognitive Profile</h2>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <RadarChart scores={domainScores} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-sm-border">
              {DOMAINS.map(d => (
                <div key={d} className="text-center">
                  <div className="text-sm font-black text-sm-violet tabular-nums">{domainScores[d]}%</div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wide">{d}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom: bar chart + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div className="panel rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_CONFIG} transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={15} className="text-sm-cyan" />
              <h2 className="text-sm font-bold text-white">Module Best Scores</h2>
            </div>
            <BarChart data={barData} />
          </motion.div>

          {/* Recent — compact list */}
          <motion.div className="panel rounded-2xl p-6 flex flex-col"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_CONFIG} transition={{ duration: 0.5, delay: 0.08 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={15} className="text-sm-amber" />
              <h2 className="text-sm font-bold text-white">Recent Sessions</h2>
            </div>
            <div className="space-y-2 flex-grow">
              {recent.map((r, i) => {
                const p = scorePct(r.finalScore, r.maxScore);
                const meta = MODULE_META[r.testId];
                const clr = meta?.color ?? '#8b5cf6';
                return (
                  <motion.div key={r._id}
                    initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sm-glass border border-sm-border hover:border-sm-violet/25 transition-colors"
                  >
                    <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: clr, boxShadow: `0 0 6px ${clr}` }} />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-slate-300 truncate">{meta?.label ?? r.testId}</p>
                      <p className="text-[10px] text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-black tabular-nums" style={{ color: clr }}>{p}%</div>
                      <div className="text-[10px] text-slate-600">{r.finalScore}/{r.maxScore}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <Link to="/" className="flex items-center gap-1.5 text-xs text-sm-violet hover:text-sm-violet-pale mt-4 pt-4 border-t border-sm-border font-medium transition-colors">
              <Zap size={12} /> Take another module
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
