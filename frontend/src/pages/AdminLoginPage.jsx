import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedButton from '../components/ui/AnimatedButton';
import { login } from '../api/auth';
import { staggerContainer, staggerItem, scaleIn, fadeUp } from '../hooks/useScrollAnimation';

const Field = ({ icon: Icon, label, type, name, value, onChange, placeholder, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div variants={staggerItem} className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase ml-0.5">{label}</label>
      <div className="relative">
        <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ boxShadow: focused ? '0 0 0 2px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.12)' : '0 0 0 1px rgba(255,255,255,0.06)' }}
          transition={{ duration: 0.2 }}
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon size={15} className={`transition-colors duration-200 ${focused ? 'text-violet-400' : 'text-slate-600'}`} />
        </div>
        <input type={type} name={name} required={required} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border-0 rounded-xl text-white text-sm outline-none placeholder-slate-700"
        />
      </div>
    </motion.div>
  );
};

const AdminLoginPage = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form);
      if (user.role !== 'admin') {
        setError('Access denied: Admin privileges required.');
        localStorage.removeItem('user');
        return;
      }
      navigate('/admin');
    }
    catch (err) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div className="text-center mb-8" initial="hidden" animate="visible" variants={staggerContainer(0.1)}>
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-5 shadow-glow-sm">
              <ShieldCheck size={24} className="text-violet-400" />
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl font-black text-white tracking-tight">Admin Portal</motion.h1>
          <motion.p variants={fadeUp} className="text-slate-500 mt-1.5 text-sm">Sign in with clinical privileges</motion.p>
        </motion.div>

        {/* Card */}
        <motion.div initial="hidden" animate="visible" variants={scaleIn}
          className="relative glass-card p-8 overflow-hidden"
          style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.06)' }}
        >
          {/* Accent gradient top */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />
          
          <motion.form onSubmit={onSubmit} initial="hidden" animate="visible"
            variants={staggerContainer(0.08)} className="space-y-5"
          >
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
              >{error}</motion.div>
            )}
            <Field icon={Mail}  label="Admin Email"    type="email"    name="email"    value={form.email}    onChange={onChange} placeholder="admin@alzdetect.com" required />
            <Field icon={Lock}  label="Password" type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
            <motion.div variants={staggerItem} className="pt-1">
              <AnimatedButton type="submit" size="lg" loading={loading} fullWidth className="shadow-glow-violet bg-violet-600 hover:bg-violet-500">
                Sign In to Admin Panel <LogIn size={15} />
              </AnimatedButton>
            </motion.div>
          </motion.form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center text-slate-500 text-sm mt-7 pt-6 border-t border-jb-border"
          >
            <Link to="/auth-select" className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Back to Selection
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
