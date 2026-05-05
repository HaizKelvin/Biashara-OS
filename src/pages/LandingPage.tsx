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
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-400/20 rounded-full blur-[140px] dark:bg-emerald-600/10 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[140px] dark:bg-blue-600/10 animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')] opacity-[0.05] dark:opacity-[0.1]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border-b border-white/50 dark:border-slate-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200 dark:shadow-none hover:rotate-6 transition-transform cursor-pointer">
               <TrendingUp className="text-white w-7 h-7" />
             </div>
             <span className="text-2xl font-black tracking-tight uppercase italic">Biashara <span className="text-emerald-600">Hub</span></span>
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
      <section className="relative pt-64 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] mb-12 border border-emerald-50 dark:border-slate-800 shadow-xl shadow-emerald-500/5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> AI-Powered Business Hub for Kenya 🇰🇪
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-[-0.04em] leading-[0.9] md:leading-[0.8] mb-12 italic text-slate-900 dark:text-white">
              The <span className="text-emerald-500 underline decoration-emerald-200/50 underline-offset-[16px]">Smartest</span> way <br /> 
              to run your biz.
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 dark:text-slate-500 max-w-3xl mx-auto mb-16 font-medium leading-relaxed tracking-tight">
              Manage sales, track expenses, and chat with your <span className="text-slate-900 dark:text-white font-black">AI Business Advisor</span>. <br className="hidden md:block" />
              Built for Shopkeepers, Wholesale, and Service Stars.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link to="/register">
                <Button className="h-20 px-16 rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-[0_30px_60px_rgba(16,185,129,0.35)] gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   Start Your Journey <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <div className="text-left">
                <div className="flex -space-x-4 mb-3">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-12 h-12 rounded-full bg-slate-200 border-4 border-white dark:border-slate-950 overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" referrerPolicy="no-referrer" />
                     </div>
                   ))}
                   <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white font-black text-xs shadow-lg">+5k</div>
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 italic">Trusted by 5,000+ Biasharas</p>
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

          <div className="mt-48 text-center pb-20">
             <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-24 italic text-slate-900 dark:text-white">Simple as <span className="text-emerald-500 underline underline-offset-8">1, 2, 3</span>.</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                <div className="hidden md:block absolute top-[40%] left-0 w-full h-[6px] bg-slate-50 dark:bg-slate-900 -z-10" />
                <StepCard 
                  num="01" 
                  title="Connect" 
                  desc="Sync your M-Pesa or input transactions in seconds. It's fast and easy." 
                  color="emerald"
                />
                <StepCard 
                  num="02" 
                  title="Analyze" 
                  desc="Watch your dashboard come alive with real-time AI analytics and trends." 
                  color="blue"
                />
                <StepCard 
                  num="03" 
                  title="Elevate" 
                  desc="Use strategic AI insights to stock better and maximize your daily profit." 
                  color="purple"
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
      whileHover={{ y: -12, scale: 1.02 }}
      className={cn("p-14 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative flex flex-col justify-between h-full group transition-all duration-500", className)}
    >
       <div className="relative z-10 transition-transform group-hover:translate-x-3">
          <div className="mb-10 transform scale-110 origin-left">{icon}</div>
          <h3 className="text-4xl font-black italic tracking-tighter mb-6">{title}</h3>
          <p className="text-lg font-medium leading-relaxed opacity-80 max-w-sm">{desc}</p>
       </div>
       {visual && <div className="mt-16 relative z-10">{visual}</div>}
       
       <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] group-hover:bg-emerald-500/10 transition-colors" />
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

function StepCard({ num, title, desc, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500 shadow-emerald-200 text-white",
    blue: "bg-blue-500 shadow-blue-200 text-white",
    purple: "bg-purple-500 shadow-purple-200 text-white"
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 flex flex-col items-center text-center relative"
    >
       <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl mb-8", colors[color])}>
         {num}
       </div>
       <h4 className="text-2xl font-black italic mb-4 text-slate-900 dark:text-white">{title}</h4>
       <p className="text-sm font-semibold opacity-60 leading-relaxed">{desc}</p>
    </motion.div>
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
