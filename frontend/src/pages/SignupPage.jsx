import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { signup } from '../api/auth';
import { staggerContainer, staggerItem, fadeUp } from '../hooks/useScrollAnimation';

const Field = ({ label, type, name, value, onChange, placeholder, required, minLength }) => {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div variants={staggerItem} className="space-y-1.5">
      <label className="font-mono text-[10px] tracking-widest uppercase text-slate-500">{label}</label>
      <div className="relative">
        <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ boxShadow: focused ? '0 0 0 2px rgba(163,230,53,0.5), 0 0 20px rgba(163,230,53,0.08)' : '0 0 0 1px rgba(255,255,255,0.07)' }}
          transition={{ duration: 0.2 }}
        />
        <input type={type} name={name} required={required} minLength={minLength}
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 bg-sm-bg rounded-xl text-white text-sm outline-none placeholder-slate-700"
        />
      </div>
    </motion.div>
  );
};

const StrengthBar = ({ password }) => {
  if (!password.length) return null;
  const s = password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const colors = ['', '#fb7185', '#fbbf24', '#a3e635'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  return (
    <div className="flex items-center gap-2 mt-1.5">
      {[1,2,3].map(i => (
        <motion.div key={i} className="h-1 flex-1 rounded-full"
          animate={{ backgroundColor: i <= s ? colors[s] : 'rgba(255,255,255,0.07)' }}
          transition={{ duration: 0.3 }}
        />
      ))}
      <span className="text-[10px] font-bold" style={{ color: colors[s] }}>{labels[s]}</span>
    </div>
  );
};

const SignupPage = () => {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signup(form); navigate('/'); }
    catch (err) { setError(err.message || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-20 flex">
      {/* Left panel — lime-accented visual */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16 border-r border-sm-border overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(163,230,53,0.08), transparent 65%)' }} />
        <div className="relative w-64 h-64 mb-10">
          <div className="absolute inset-0 rounded-full border border-sm-lime/20 animate-spin-slow" />
          <div className="absolute inset-8 rounded-full border border-sm-cyan/15 animate-spin-rev" />
          <div className="absolute inset-[35%] rounded-full bg-sm-bg-2 border border-sm-lime/30 flex items-center justify-center animate-orb-pulse" style={{ boxShadow: '0 0 24px rgba(163,230,53,0.25)' }}>
            <Cpu size={28} className="text-sm-lime" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Join Smriti</h2>
        <p className="text-slate-500 text-center max-w-xs leading-relaxed">Start measuring your cognitive performance today. Free forever.</p>
        <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
          {['Unlimited assessments', 'AI-powered grading', 'Personal analytics'].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-sm-lime" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px w-6 bg-sm-lime" />
              <span className="font-mono text-[11px] text-sm-lime tracking-widest uppercase">New Account</span>
            </div>
            <h2 className="text-2xl font-black text-white">Create your profile</h2>
          </motion.div>

          <motion.form onSubmit={onSubmit}
            initial="hidden" animate="visible" variants={staggerContainer(0.08)} className="space-y-4"
          >
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-sm-rose/10 border border-sm-rose/25 text-sm-rose text-sm text-center"
              >{error}</motion.div>
            )}
            <Field label="Full Name" type="text"     name="name"     value={form.name}     onChange={onChange} placeholder="John Doe"        required />
            <Field label="Email"     type="email"    name="email"    value={form.email}    onChange={onChange} placeholder="you@example.com" required />
            <motion.div variants={staggerItem}>
              <Field label="Password"  type="password" name="password" value={form.password} onChange={onChange} placeholder="Min 6 characters" required minLength="6" />
              <StrengthBar password={form.password} />
            </motion.div>

            <motion.div variants={staggerItem} className="pt-2">
              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-4 font-bold text-sm-bg btn-violet text-white rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #a3e635, #22d3ee)', boxShadow: '0 0 20px rgba(163,230,53,0.3)' }}
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><UserPlus size={16} /> Create Account</>
                }
              </motion.button>
            </motion.div>
          </motion.form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Have an account?{' '}
            <Link to="/login" className="text-sm-violet font-semibold hover:text-sm-violet-pale transition-colors inline-flex items-center gap-1">
              Log in <ArrowRight size={12} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
