import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Trophy, BarChart2, MessageSquare, LogOut,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Send, Brain, Activity, Star, Search,
  ChevronUp, ChevronDown, Bell, Shield,
} from 'lucide-react';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

function authHeader() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.token ? { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' } : {};
}

const DOMAIN_COLORS = {
  Memory: '#8b5cf6', Attention: '#22d3ee', Language: '#fb7185',
  Executive: '#a3e635', Spatial: '#f97316', Reaction: '#fbbf24',
};
const PERIOD_LABELS = { all: 'All Time', month: 'This Month', week: 'This Week' };

// ── Tiny reusable components ──────────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
    style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
    {label}
  </span>
);

const DomainBar = ({ domain, value }) => (
  <div className="flex items-center gap-1.5 text-xs">
    <span className="w-16 text-slate-500 truncate">{domain}</span>
    <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: DOMAIN_COLORS[domain] }} />
    </div>
    <span className="w-7 text-right tabular-nums" style={{ color: DOMAIN_COLORS[domain] }}>{value}%</span>
  </div>
);

const TrendIcon = ({ trend }) => {
  if (trend === 'improving') return <TrendingUp size={13} className="text-emerald-400" />;
  if (trend === 'declining') return <TrendingDown size={13} className="text-red-400" />;
  return <Minus size={13} className="text-slate-500" />;
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="panel rounded-2xl p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color + '15', border: `1px solid ${color}30` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <div className="text-2xl font-black text-white tabular-nums">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-[10px] text-slate-600">{sub}</div>}
    </div>
  </div>
);

// ── Inline Message Form ────────────────────────────────────────────────────────
const InlineMessageForm = ({ userId, msgHistory = [] }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success
  const [history, setHistory] = useState([...msgHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

  const handleSend = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`${BASE}/api/admin/send-message/${userId}`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setHistory(prev => [newMsg, ...prev]);
        setStatus('success');
        setText('');
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
      {history.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
          {history.map(m => (
            <div key={m._id} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] text-slate-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="text-xs text-slate-300 truncate">{m.text}</span>
              </div>
              <div className="flex-shrink-0">
                {m.checked ? (
                  <span className="text-[9px] font-bold text-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">Read</span>
                ) : (
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">Unread</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a clinical suggestion or encouragement..."
          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          disabled={status === 'loading' || status === 'success'}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || status === 'loading' || status === 'success'}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white"
        >
          {status === 'loading' ? 'Sending...' : status === 'success' ? <><CheckCircle2 size={12} /> Sent</> : <><Send size={12} /> Send</>}
        </button>
      </div>
    </div>
  );
};

// ── Tab: Users ─────────────────────────────────────────────────────────────────
const UsersTab = ({ users, loading }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('avgScore');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (k) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };

  const filtered = users
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] > b[sortKey] ? 1 : -1) * v;
    });

  if (loading) return <div className="text-center py-20 text-slate-500">Loading users…</div>;

  return (
    <div className="space-y-4">
      {/* Search + sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-grow">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-400/50" />
        </div>
        {['avgScore', 'latestScore', 'totalTests'].map(k => (
          <button key={k} onClick={() => toggleSort(k)}
            className={`flex items-center gap-1 text-xs px-3 py-2 rounded-lg border transition-colors ${sortKey === k ? 'border-violet-500/50 bg-violet-500/10 text-violet-400' : 'border-white/10 text-slate-500 hover:border-white/20'}`}>
            {k === 'avgScore' ? 'Avg' : k === 'latestScore' ? 'Latest' : 'Tests'}
            {sortKey === k && (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
          </button>
        ))}
      </div>

      {/* Needs Attention Banner */}
      {filtered.some(u => u.needsAttention) && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          <AlertTriangle size={14} /> {filtered.filter(u => u.needsAttention).length} user(s) need clinical attention
        </div>
      )}

      {/* User rows */}
      <div className="panel rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/05">
          {filtered.map(u => (
            <div key={u._id} className="p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ background: u.needsAttention ? '#ef444430' : '#8b5cf630', border: `1px solid ${u.needsAttention ? '#ef444450' : '#8b5cf650'}` }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{u.name}</span>
                    <span className="text-xs text-slate-500">{u.email}</span>
                    {u.needsAttention && <Pill label="Needs Attention" color="#ef4444" />}
                    {u.avgScore >= 75 && <Pill label="High Performer" color="#10b981" />}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span>Avg <strong className="text-white">{u.avgScore}%</strong></span>
                    <span>Latest <strong className="text-white">{u.latestScore}%</strong></span>
                    <span>{u.totalTests} test{u.totalTests !== 1 ? 's' : ''}</span>
                    <span>Last active {new Date(u.lastActive).toLocaleDateString()}</span>
                  </div>
                  {/* Domain bars */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                    {Object.entries(u.domainScores).filter(([, v]) => v > 0).map(([d, v]) => (
                      <DomainBar key={d} domain={d} value={v} />
                    ))}
                  </div>
                </div>
                {/* Score ring */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-black tabular-nums"
                    style={{ color: u.avgScore >= 70 ? '#10b981' : u.avgScore >= 45 ? '#f59e0b' : '#ef4444' }}>
                    {u.avgScore}%
                  </div>
                  <div className="text-[10px] text-slate-600">overall</div>
                </div>
              </div>
              <InlineMessageForm userId={u._id} msgHistory={u.msg} />
            </div>
          ))}
          {!filtered.length && <div className="py-12 text-center text-slate-600 text-sm">No users found</div>}
        </div>
      </div>
    </div>
  );
};

// ── Tab: Leaderboard ───────────────────────────────────────────────────────────
const LeaderboardTab = ({ period, setPeriod }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/api/admin/leaderboard?period=${period}`, { headers: authHeader() })
      .then(r => r.json()).then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const medalColors = ['#f59e0b', '#94a3b8', '#b45309'];
  const badgeColor = b => b === 'Excellent' ? '#10b981' : b === 'Stable' ? '#22d3ee' : b === 'Needs Attention' ? '#ef4444' : '#64748b';

  if (loading) return <div className="text-center py-20 text-slate-500">Loading leaderboard…</div>;

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-2">
        {Object.entries(PERIOD_LABELS).map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`text-xs px-4 py-2 rounded-xl border font-medium transition-colors ${period === k ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="panel rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/05">
          {data.map((u, i) => (
            <div key={u._id} className={`flex items-center gap-4 p-4 ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {i < 3
                  ? <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                  : <span className="text-sm font-bold text-slate-500">#{u.rank}</span>
                }
              </div>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: (medalColors[i] || '#8b5cf6') + '20', color: medalColors[i] || '#8b5cf6' }}>
                {u.name[0].toUpperCase()}
              </div>
              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="text-sm font-semibold text-white">{u.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <TrendIcon trend={u.trend} />
                  <span className="text-xs text-slate-500">{u.trend} · {u.totalTests} tests</span>
                </div>
              </div>
              {/* Badge + Score */}
              <div className="flex items-center gap-3">
                <Pill label={u.badge} color={badgeColor(u.badge)} />
                <div className="text-xl font-black tabular-nums" style={{ color: badgeColor(u.badge) }}>
                  {u.avgScore}%
                </div>
              </div>
            </div>
          ))}
          {!data.length && <div className="py-12 text-center text-slate-600 text-sm">No data for this period</div>}
        </div>
      </div>
    </div>
  );
};

// ── Tab: Analytics ─────────────────────────────────────────────────────────────
const AnalyticsTab = ({ stats }) => {
  if (!stats) return <div className="text-center py-20 text-slate-500">Loading analytics…</div>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="#8b5cf6" />
        <StatCard icon={Activity} label="Total Tests" value={stats.totalTests} color="#22d3ee" />
        <StatCard icon={Brain} label="Platform Avg" value={`${stats.avgPlatform}%`} color="#a3e635" />
        <StatCard icon={AlertTriangle} label="Weakest Domain" value={stats.weakestDomain} color="#f97316" />
      </div>

      {/* Domain averages */}
      <div className="panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={15} className="text-violet-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Average Domain Scores (All Users)</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(stats.avgDomains).sort((a, b) => b[1] - a[1]).map(([d, v]) => (
            <div key={d}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{d}</span>
                <span className="font-bold tabular-nums" style={{ color: DOMAIN_COLORS[d] }}>{v}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8 }}
                  style={{ background: DOMAIN_COLORS[d], boxShadow: `0 0 6px ${DOMAIN_COLORS[d]}55` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



// ═══════════════════════════════════════════════════════════════════════════════
const AdminPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    Promise.all([
      fetch(`${BASE}/api/admin/users`, { headers: authHeader() }).then(r => r.json()),
      fetch(`${BASE}/api/admin/stats`, { headers: authHeader() }).then(r => r.json()),
    ]).then(([u, s]) => {
      setUsers(Array.isArray(u) ? u : []);
      setStats(s?.totalUsers !== undefined ? s : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/admin-login'); };

  if (!currentUser || currentUser.role !== 'admin') return <Navigate to="/admin-login" replace />;

  const TABS = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-sm-bg text-slate-100">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/08 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Smriti Admin</div>
            <div className="text-[10px] text-slate-500">Clinical Dashboard</div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="hidden md:flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/05'}`}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        <button onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/05">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* ── Mobile tab bar ── */}
      <div className="md:hidden flex border-b border-white/08 bg-black/40 px-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${tab === t.id ? 'text-violet-400' : 'text-slate-600'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white">
            {TABS.find(t => t.id === tab)?.label}
            {tab === 'users' && stats && (
              <span className="text-sm font-normal text-slate-500 ml-3">{users.length} users · {users.filter(u => u.needsAttention).length} need attention</span>
            )}
          </h1>
        </motion.div>

        {/* Tab content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === 'users' && <UsersTab users={users} loading={loading} />}
          {tab === 'leaderboard' && <LeaderboardTab period={period} setPeriod={setPeriod} />}
          {tab === 'analytics' && <AnalyticsTab stats={stats} />}

        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
