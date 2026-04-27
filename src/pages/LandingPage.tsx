import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  Smartphone, 
  BrainCircuit, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Sparkles,
  PieChart,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 selection:text-emerald-900 overflow-x-hidden transition-colors duration-300">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-[0.03] dark:opacity-[0.07] grayscale" 
          alt="Abstract Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] dark:bg-emerald-600/5" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] dark:bg-blue-600/5" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-none">
               <TrendingUp className="text-white w-6 h-6" />
             </div>
             <span className="text-xl font-black tracking-tight uppercase">Biashara <span className="text-emerald-600">OS</span></span>
           </div>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#contact">Support</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 px-4 h-10 hover:bg-slate-100 dark:hover:bg-slate-900">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-2xl px-6 h-11 text-xs font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] shadow-xl shadow-slate-200 dark:shadow-none">
                Anza Sasa
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Made for Kenyan Entrepreneurs
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[0.95] md:leading-[0.85] mb-10 italic">
              Scale Your <span className="text-emerald-600 underline decoration-emerald-200 dark:decoration-emerald-900 underline-offset-[12px]">Biz</span> <br /> 
              With AI Power.
            </h1>

            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-semibold leading-relaxed">
              Transform your daily hustle. Real-time profit tracking, AI advisors, <br className="hidden md:block" />
              and smart debt reminders all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register">
                <Button className="h-16 px-12 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-[0_20px_50px_rgba(16,185,129,0.3)] gap-3 transition-all hover:scale-105 active:scale-95 group">
                  Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic">No card required</p>
                <div className="flex items-center gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map(i => <ShieldCheck key={i} className="w-3 h-3 text-emerald-500" />)}
                  <span className="text-[9px] font-bold text-slate-400 ml-1">Trusted by 5,000+ SMEs</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Grid (Bento) */}
          <div className="mt-40 grid grid-cols-1 md:grid-cols-12 gap-8 text-left" id="features">
             <div className="md:col-span-8">
                <BentoCard 
                  title="Smart AI Insights" 
                  desc="Afadhali uwe na advisor. Get daily strategic tips derived directly from your transaction patterns. Perfect for Salon, Shop, or Wholesale."
                  icon={<div className="w-14 h-14 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20"><BrainCircuit className="w-8 h-8 text-white" /></div>}
                  className="bg-slate-900 dark:bg-slate-900 text-white min-h-[450px] border-none"
                  visual={<BrainVisual />}
                />
             </div>
             <div className="md:col-span-4">
                <BentoCard 
                  title="Smart Reminders" 
                  desc="Say goodbye to unpaid debts. Automated professional reminders for your 'Okoa' customers."
                  icon={<div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center"><MessageSquare className="w-6 h-6 text-white" /></div>}
                  className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30"
                />
             </div>
             <div className="md:col-span-4">
                <BentoCard 
                  title="Mobile First" 
                  desc="Designed for the Kenyan market. Lightning fast even on 3G connections. Manage everything from your phone."
                  icon={<div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center"><Smartphone className="w-6 h-6 text-white" /></div>}
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30"
                />
             </div>
             <div className="md:col-span-8">
                <BentoCard 
                  title="Profit Health Check" 
                  desc="See where your money is going. Visual reports that actually make sense, with AI analysis of your margins. We handle the math, you handle the cash."
                  icon={<div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-lg"><PieChart className="w-8 h-8 text-emerald-600" /></div>}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[350px]"
                  visual={<ReportVisual />}
                />
             </div>
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
           <Zap className="w-10 h-10 text-amber-500 mx-auto mb-8" />
           <p className="text-3xl md:text-5xl font-black italic tracking-tight text-slate-800 dark:text-slate-100 leading-[1.1] mb-8">
             "The best way to predict your business's future is to manage its records today. Biashara OS is that tool."
           </p>
           <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-full border-2 border-white dark:border-slate-800" />
              <div className="text-left">
                <p className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Peter K.</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wholesale Owner, Nairobi</p>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
               <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200 flex-shrink-0">
                   <TrendingUp className="text-white w-6 h-6" />
                 </div>
                 <span className="text-2xl font-black tracking-tight uppercase">Biashara <span className="text-emerald-600">OS</span></span>
               </div>
               <h3 className="text-3xl font-black italic mb-6 dark:text-slate-100">Ready to transform?</h3>
               <p className="text-slate-500 dark:text-slate-400 font-semibold mb-10 max-w-sm">Join thousands of Kenyan merchants scaling their dreams with intelligent automated tools.</p>
               <div className="flex gap-4">
                  <Link to="/register">
                    <Button className="h-14 px-8 rounded-2xl bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">Start Now</Button>
                  </Link>
                  <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 dark:border-slate-800 dark:text-slate-100 font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900">View Demo</Button>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-10">
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 dark:border-slate-900 pb-2">Platform</h4>
                  <ul className="space-y-4">
                     <li><FooterLink>Dashboard</FooterLink></li>
                     <li><FooterLink>Inventory</FooterLink></li>
                     <li><FooterLink>Finances</FooterLink></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 dark:border-slate-900 pb-2">Legal</h4>
                  <ul className="space-y-4">
                     <li><FooterLink>Privacy</FooterLink></li>
                     <li><FooterLink>Terms</FooterLink></li>
                     <li><FooterLink>Support</FooterLink></li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 Biashara Intelligence Hub. All Rights Reserved.</p>
            <div className="flex gap-6">
               <Globe className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-emerald-500 transition-colors cursor-help" />
               <Smartphone className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-emerald-500 transition-colors cursor-help" />
               <ShieldCheck className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-emerald-500 transition-colors cursor-help" />
            </div>
         </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: any) {
  return (
    <a href={href} className="text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">
      {children}
    </a>
  );
}

function FooterLink({ children }: any) {
  return (
    <a href="#" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all block w-fit">
      {children}
    </a>
  );
}

function BentoCard({ title, desc, icon, className, visual }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.01 }}
      className={cn("p-12 rounded-[4rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden relative flex flex-col justify-between h-full group transition-all duration-500", className)}
    >
       <div className="relative z-10 transition-transform group-hover:translate-x-2">
          <div className="mb-8">{icon}</div>
          <h3 className="text-3xl font-black italic tracking-tight mb-4">{title}</h3>
          <p className="text-base font-semibold leading-relaxed opacity-70 max-w-xs">{desc}</p>
       </div>
       {visual && <div className="mt-12 relative z-10">{visual}</div>}
       
       <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />
    </motion.div>
  );
}

function BrainVisual() {
  return (
    <div className="flex gap-3">
       {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-1 h-32 bg-white/10 dark:bg-slate-800/30 rounded-2xl relative overflow-hidden group-hover:bg-white/20 transition-all border border-white/5">
             <motion.div 
               animate={{ height: ['20%', '90%', '40%', '100%', '20%'] }}
               transition={{ duration: 1.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
               className="absolute bottom-0 w-full bg-emerald-400/40 dark:bg-emerald-500/30"
             />
          </div>
       ))}
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="flex items-end gap-2 h-20">
       {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex-1 bg-emerald-600/20 dark:bg-emerald-500/10 rounded-t-xl group-hover:bg-emerald-600/40 transition-colors"
          />
       ))}
    </div>
  );
}


function PriceCard({ tier, price, features, featured }: any) {
  return (
    <div className={cn(
      "p-12 rounded-[3.5rem] border text-left flex flex-col h-full relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-100",
      featured ? "bg-white border-emerald-200 shadow-xl" : "bg-white border-slate-100"
    )}>
       {featured && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-6 py-2 rounded-bl-3xl tracking-[0.2em]">Popular</div>}
       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">{tier}</p>
       <div className="flex items-baseline gap-1 mb-8">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">KES</span>
          <span className="text-5xl font-black tracking-tighter text-slate-900">{price}</span>
       </div>
       <ul className="space-y-4 mb-10 flex-1">
          {features.map((f: any) => (
            <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600 italic">
               <ShieldCheck className="w-5 h-5 text-emerald-500" /> {f}
            </li>
          ))}
       </ul>
       <Button className={cn(
         "h-14 rounded-2xl w-full font-black text-sm uppercase tracking-widest transform transition-all active:scale-95",
         featured ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" : "bg-slate-900 text-white border border-slate-100"
       )}>
         Select Plan
       </Button>
    </div>
  );
}
