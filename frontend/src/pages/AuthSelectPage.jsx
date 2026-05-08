import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp, scaleIn } from '../hooks/useScrollAnimation';

const AuthSelectPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <motion.div className="text-center mb-10" initial="hidden" animate="visible" variants={staggerContainer(0.1)}>
          <motion.div variants={fadeUp}>
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm font-semibold">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Welcome to Smriti
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 mt-2 text-sm md:text-base">
            Please select your account type to continue
          </motion.p>
        </motion.div>

        {/* Selection Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden" animate="visible" variants={staggerContainer(0.1)}
        >
          {/* User Card */}
          <motion.div variants={scaleIn}>
            <Link to="/login" className="block relative glass-card p-8 md:p-10 overflow-hidden hover:-translate-y-1 hover:shadow-glow-cyan transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <User size={32} className="text-cyan-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">User Login</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Access your personal cognitive dashboard, take test modules, and view your performance history.
              </p>
              
              <div className="flex items-center text-cyan-400 text-sm font-semibold">
                Continue as User <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </motion.div>

          {/* Admin Card */}
          <motion.div variants={scaleIn}>
            <Link to="/admin-login" className="block relative glass-card p-8 md:p-10 overflow-hidden hover:-translate-y-1 hover:shadow-glow-violet transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck size={32} className="text-violet-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Admin Login</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Access the clinical dashboard to monitor patients, review analytics, and send suggestions.
              </p>
              
              <div className="flex items-center text-violet-400 text-sm font-semibold">
                Continue as Admin <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthSelectPage;
