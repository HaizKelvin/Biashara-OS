import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  RefreshCcw,
  Globe,
  Bell,
  Search,
  ChevronRight,
  FileText,
  Sun,
  Moon,
  Calculator
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import FloatingCalculator from '../FloatingCalculator';

export default function DashboardLayout() {
  const { signOutUser, user } = useAuth();
  const { business, loading, createBusiness, netBalance } = useBusiness();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!business?.id) return;
    const q = query(
      collection(db, `businesses/${business.id}/notifications`),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    return onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/notifications`);
    });
  }, [business?.id]);

  const navigation = [
    { name: t('dashboard'), href: '/app', icon: LayoutDashboard },
    { name: t('sales'), href: '/app/sales', icon: ShoppingBag },
    { name: t('expenses'), href: '/app/expenses', icon: Receipt },
    { name: t('inventory'), href: '/app/inventory', icon: Package },
    { name: t('debts'), href: '/app/debts', icon: Users },
    { name: t('mpesa_recon'), href: '/app/mpesa', icon: RefreshCcw },
    { name: t('reports'), href: '/app/reports', icon: BarChart3 },
    { name: t('settings'), href: '/app/settings', icon: Settings },
  ];

  if (loading) return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="font-bold text-slate-400 animate-pulse tracking-widest text-[10px] uppercase">Biashara Starting...</p>
       </div>
    </div>
  );

  if (!business) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl text-center border border-slate-100">
           <div className="w-20 h-20 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
              <TrendingUp className="text-white w-10 h-10" />
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Initialize Your Business</h2>
           <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">Biashara needs your business name to setup your AI-powered financial core.</p>
           <form onSubmit={async (e) => {
             e.preventDefault();
             const name = (e.target as any).bizName.value;
             if (name) await createBusiness(name);
           }} className="space-y-4">
              <Input name="bizName" label="Business Name" placeholder="e.g. King Motor Spares" required className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-100">Setup Business OS</Button>
           </form>
           <button onClick={() => signOutUser().then(() => window.location.href = '/')} className="mt-8 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest">Logout</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden transition-colors duration-300">
      {/* Sidebar Component */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn("p-8 shrink-0 transition-opacity", isSidebarCollapsed && "opacity-0 invisible h-0 p-0 overflow-hidden")}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <TrendingUp className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black leading-none text-slate-900">Biashara</h1>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mt-1 font-bold">Smart Business OS</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                    {!isSidebarCollapsed && item.name}
                  </div>
                  {isActive && !isSidebarCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn("mt-auto p-8 space-y-4 transition-opacity", isSidebarCollapsed && "opacity-0 invisible h-0 p-0 overflow-hidden")}>
           {/* Language Switcher Only */}
           <div className="flex gap-2">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center gap-2 group transition-all"
              >
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest font-black">
                  {language === 'en' ? 'EN' : 'SW'}
                </span>
              </button>
           </div>

           {/* User Profile */}
           <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200/50 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm">
                {user?.displayName?.[0] || 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{user?.displayName}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{business.name}</p>
              </div>
              <button onClick={() => signOutUser()} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 lg:px-8 shrink-0 transition-colors duration-300">
           <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => isSidebarCollapsed ? setIsSidebarCollapsed(false) : setIsSidebarOpen(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              {location.pathname === '/app' && (
                <div className="relative w-full max-w-md hidden md:block">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                    placeholder="Search records..." 
                    className="w-full h-11 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        alert('Advanced search is being indexed. Results will appear shortly.');
                      }
                    }}
                   />
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link to="/app/calculator" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Calculator className="w-5 h-5" />
              </Link>

              {location.pathname === '/app' && (
                <div className="flex items-center gap-2 md:gap-4 relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                     <Bell className="w-5 h-5" />
                     {notifications.length > 0 && (
                       <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                     )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 z-[100]"
                      >
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Alerts</h3>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Recent</span>
                        </div>
                        <div className="space-y-2">
                          {notifications.length > 0 ? notifications.map((n, i) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                          )) : (
                            <div className="py-8 text-center">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No alerts today</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1 md:mx-2 hidden sm:block"></div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 px-2 md:px-4 py-1.5 md:py-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-end">
                     <p className="text-[7px] md:text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Net Balance</p>
                     <p className="text-[10px] md:text-sm font-black text-emerald-700 dark:text-emerald-300 mt-1 whitespace-nowrap uppercase tracking-tighter">KES {netBalance.toLocaleString()}</p>
                  </div>
                </div>
              )}
           </div>
        </header>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 cursor-default pb-20 lg:pb-12"
          onClick={() => {
            if (window.innerWidth > 1024) {
              setIsSidebarCollapsed(true);
            } else {
              setIsSidebarOpen(false);
            }
          }}
        >
          <Outlet />
        </div>
        
        <FloatingCalculator />
      </main>
    </div>
  );
}
