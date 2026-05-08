import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Github, Twitter, Linkedin, Zap } from 'lucide-react';

const Footer = () => (
  <footer className="relative z-10 border-t border-jb-border">
    {/* Top glow line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-jb-cyan/40 to-transparent" />

    <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

        {/* Brand */}
        <div className="md:col-span-1 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <BrainCircuit size={22} className="text-jb-cyan" />
            <span className="text-lg font-black tracking-tighter bg-gradient-to-r from-jb-cyan to-jb-purple bg-clip-text text-transparent">
              Smriti
            </span>
          </Link>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Clinical-grade cognitive assessment with real-time AI analytics and personalized insights.
          </p>
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <Zap size={11} className="text-jb-cyan" />
            <span>AI-Powered · Clinical Grade · Real-time</span>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Platform</h4>
          <ul className="space-y-2.5 text-sm text-slate-500">
            {[['/', 'Modules'], ['/dashboard', 'Dashboard'], ['/login', 'Login'], ['/signup', 'Sign Up']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-jb-cyan transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Connect</h4>
          <div className="flex gap-2">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#"
                className="w-9 h-9 glass flex items-center justify-center rounded-xl text-slate-400 hover:text-jb-cyan hover:border-jb-cyan/30 transition-all hover:-translate-y-0.5"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-jb-border flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Smriti Cognitive Platform. All rights reserved.</p>
        <div className="flex gap-5 text-xs text-slate-600">
          <a href="#" className="hover:text-jb-cyan transition-colors">Privacy</a>
          <a href="#" className="hover:text-jb-cyan transition-colors">Terms</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
