import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  AlertCircle,
  Sparkles,
  ChevronRight,
  BrainCircuit,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { format, startOfDay, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import { getDailyInsights } from '../services/geminiService';

import { Download } from 'lucide-react';

export default function Dashboard() {
  const { business, sales, expenses, debts, inventory } = useBusiness();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [stats, setStats] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    activeDebts: 0,
    lowStock: 0,
    profit: 0,
    chartData: [] as any[]
  });

  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);

  // Sync stats reactively from BusinessContext data
  useEffect(() => {
    if (!business?.id) return;

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    let totalToday = 0;
    let totalYesterday = 0;
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = weekDays.map(day => ({ name: day, sales: 0 }));

    sales.forEach(s => {
      // If timestamp is null (optimistic update), assume it's today
      const date = s.timestamp?.toDate ? s.timestamp.toDate() : (s.timestamp ? new Date(s.timestamp) : new Date());
      const dayStart = startOfDay(date);
      const amount = s.amount || 0;

      if (dayStart.getTime() === today.getTime()) {
        totalToday += amount;
      } else if (dayStart.getTime() === yesterday.getTime()) {
        totalYesterday += amount;
      }
      
      // Calculate weekly trend - only for last 7 days actually
      if (date >= subDays(today, 6)) {
        const dayIndex = date.getDay();
        weeklyData[dayIndex].sales += amount;
      }
    });

    const totalExpensesToday = expenses.reduce((acc, e) => {
      const date = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
      if (startOfDay(date).getTime() === today.getTime()) {
        return acc + (e.amount || 0);
      }
      return acc;
    }, 0);

    const totalPendingDebts = debts
      .filter(d => d.status === 'pending')
      .reduce((acc, d) => acc + (d.amount || 0), 0);

    const lowStockCount = inventory.filter(i => i.quantity <= i.minStock).length;

    // Sort weekly data to start from 6 days ago
    const sortedWeekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const name = weekDays[d.getDay()];
      sortedWeekly.push({
        name,
        sales: weeklyData[d.getDay()].sales
      });
    }

    setStats({
      todaySales: totalToday,
      yesterdaySales: totalYesterday,
      activeDebts: totalPendingDebts,
      lowStock: lowStockCount,
      profit: totalToday - totalExpensesToday,
      chartData: sortedWeekly
    });
  }, [business?.id, sales, expenses, debts, inventory]);

  // AI Insights effect
  useEffect(() => {
    if (!business?.id || stats.todaySales === 0 && stats.activeDebts === 0) return;

    const fetchInsights = async () => {
      setLoadingAI(true);
      try {
        const insights = await getDailyInsights({ 
          totalToday: stats.todaySales, 
          totalDebts: stats.activeDebts, 
          bizName: business.name 
        });
        setAiInsights(insights);
      } catch (e) {
        setAiInsights(["Zidi kurekodi mauzo ili upate ushauri wa kukuza biashara."]);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchInsights();
  }, [business?.id, stats.todaySales, stats.activeDebts]);

  const salesTrend = stats.todaySales > stats.yesterdaySales;
  const hasYesterdaySales = stats.yesterdaySales > 0;
  const diff = hasYesterdaySales 
    ? Math.abs(((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100) 
    : 0;

  const handleExportDashboard = () => {
    const headers = ["Metric", "Value"];
    const content = [
      ["Today Sales", stats.todaySales],
      ["Yesterday Sales", stats.yesterdaySales],
      ["Active Debts", stats.activeDebts],
      ["Estimated Profit", stats.profit]
    ];

    const csvContent = [
      headers.join(","),
      ...content.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_stats_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1 block">{t('welcome')}, {user?.displayName?.split(' ')[0]}</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Business Overview</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl border-slate-200 dark:border-slate-800 dark:text-slate-100 h-11 px-6 flex-1 md:flex-initial flex items-center justify-center gap-2"
            onClick={handleExportDashboard}
          >
            <Download className="w-4 h-4" /> Export Stats
          </Button>
          <Button 
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 h-11 px-6 flex-1 md:flex-initial text-white font-bold flex items-center justify-center"
            onClick={() => navigate('/app/sales')}
          >
            + {t('add_sale')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`KES ${stats.todaySales.toLocaleString()}`} 
          trend={hasYesterdaySales ? (salesTrend ? 'up' : 'down') : null}
          percent={`${diff.toFixed(1)}%`}
          subtitle={hasYesterdaySales ? "vs yesterday" : "Welcome aboard"}
          icon={<TrendingUp className="text-emerald-600 w-5 h-5" />}
        />
        <StatCard 
          title="Daily Profit" 
          value={`KES ${stats.profit.toLocaleString()}`} 
          subtitle="est. for today"
          icon={<DollarSign className="text-blue-600 w-5 h-5" />}
          theme="blue"
        />
        <StatCard 
          title="Pending Debts" 
          value={`KES ${stats.activeDebts.toLocaleString()}`} 
          subtitle="money to collect"
          icon={<Users className="text-orange-600 w-5 h-5" />}
          theme="orange"
        />
        <StatCard 
          title="Cash Health" 
          value="Strong" 
          subtitle="Reconciled"
          icon={<ShieldCheck className="text-purple-600 w-5 h-5" />}
          theme="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="h-full border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
               <div>
                  <CardTitle className="text-lg font-bold">Sales & Profit Trend</CardTitle>
                  <p className="text-xs text-slate-400 font-medium">Last 7 recorded days</p>
               </div>
               <select className="text-xs font-bold bg-slate-50 border-none rounded-xl px-4 py-2 outline-none cursor-pointer text-slate-600">
                 <option>Past Week</option>
                 <option>Past Month</option>
               </select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.3 : 0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8', fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8', fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#fff', 
                        borderColor: isDark ? '#1e293b' : '#f1f5f9',
                        borderRadius: '24px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-slate-900 dark:bg-slate-900 text-white border-none rounded-[2rem] p-6 h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-emerald-500/30"></div>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                   <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-lg text-white italic">AI Advisor</h4>
              </div>

              <div className="space-y-3 relative z-10">
                 {loadingAI ? (
                    <div className="flex flex-col gap-3">
                       <div className="h-4 bg-white/10 rounded-full w-full animate-pulse"></div>
                       <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse"></div>
                    </div>
                 ) : (
                    aiInsights.map((insight, idx) => (
                       <div key={idx} className="flex gap-3 p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed text-slate-100 font-medium">{insight}</p>
                       </div>
                    ))
                 )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <button 
                  onClick={() => navigate('/app/reports')}
                  className="flex items-center justify-between w-full p-4 bg-emerald-600 rounded-xl font-bold text-xs tracking-tight hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/40"
                >
                  Full Strategic Plan
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, trend, percent, theme = 'emerald' }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
  };

  return (
    <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-[2.5rem] p-5 md:p-6 group transition-all md:hover:scale-[1.02]">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center", colors[theme])}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
              trend === 'up' ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600" : "bg-red-50 dark:bg-red-950 text-red-600"
            )}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {percent}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-1">{value}</h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

// Weekly aggregation helper removed, using real state now.
