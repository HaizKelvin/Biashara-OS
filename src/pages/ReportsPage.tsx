import { motion } from 'motion/react';
import { 
  BarChart3, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  PieChart as PieChartIcon,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useBusiness } from '../context/BusinessContext';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, format, subMonths } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function ReportsPage() {
  const { business } = useBusiness();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalExpenses: 0,
    profit: 0,
    salesCount: 0,
    expenseBreakdown: [] as {name: string, value: number}[]
  });

  useEffect(() => {
    if (!business?.id) return;

    const fetchData = async () => {
      let start;
      const end = endOfDay(new Date());

      if (period === 'daily') start = startOfDay(new Date());
      else if (period === 'weekly') start = startOfWeek(new Date(), { weekStartsOn: 1 });
      else start = startOfMonth(new Date());

      // Sales
      const salesQuery = query(
        collection(db, `businesses/${business.id}/sales`),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const salesSnap = await getDocs(salesQuery);
      const salesTotal = salesSnap.docs.reduce((acc, d) => acc + d.data().amount, 0);

      // Expenses
      const expQuery = query(
        collection(db, `businesses/${business.id}/expenses`),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const expSnap = await getDocs(expQuery);
      const expTotal = expSnap.docs.reduce((acc, d) => acc + d.data().amount, 0);

      // Breakdown
      const breakdownObj: Record<string, number> = {};
      expSnap.docs.forEach(d => {
        const cat = d.data().category;
        breakdownObj[cat] = (breakdownObj[cat] || 0) + d.data().amount;
      });
      const breakdownArr = Object.entries(breakdownObj).map(([name, value]) => ({ name, value }));

      setReportData({
        totalSales: salesTotal,
        totalExpenses: expTotal,
        profit: salesTotal - expTotal,
        salesCount: salesSnap.size,
        expenseBreakdown: breakdownArr
      });
    };

    fetchData();
  }, [business?.id, period]);

  const handleDownloadSummary = () => {
    const headers = ["Metric", "Value"];
    const content = [
      ["Report Period", period],
      ["Total Sales", reportData.totalSales],
      ["Total Expenses", reportData.totalExpenses],
      ["Net Profit", reportData.profit],
      ["Total Transactions", reportData.salesCount],
      ["", ""],
      ["Expense Breakdown", ""],
      ...reportData.expenseBreakdown.map(e => [e.name, e.value])
    ];

    const csvContent = [
      headers.join(","),
      ...content.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_summary_${period}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>
          <p className="text-slate-500">Analyze your business growth and spending patterns.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
           {(['daily', 'weekly', 'monthly'] as const).map(p => (
             <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold capitalize transition-all",
                period === p ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : "text-slate-400 hover:text-slate-600"
              )}
             >
               {p}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ReportStatCard title="Gross Sales" value={reportData.totalSales} icon={<TrendingUp className="text-emerald-600" />} />
         <ReportStatCard title="Total Expenses" value={reportData.totalExpenses} icon={<TrendingUp className="rotate-180 text-red-600" />} color="red" />
         <ReportStatCard title="Net Profit" value={reportData.profit} icon={<BarChart3 className={reportData.profit >= 0 ? "text-emerald-600" : "text-red-600"} />} color={reportData.profit >= 0 ? "emerald" : "red"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card>
           <CardHeader>
             <CardTitle className="flex justify-between items-center">
               <span>Performance Analysis</span>
               <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px]" onClick={handleDownloadSummary}><Download className="w-3 h-3" /> Report</Button>
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="h-[200px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Income', val: reportData.totalSales },
                    { name: 'Costs', val: reportData.totalExpenses }
                  ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                    <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={50}>
                       <Cell fill="#10b981" />
                       <Cell fill="#f43f5e" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[10px]">Profit Margin</h4>
                 <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, Math.max(0, (reportData.profit / (reportData.totalSales || 1)) * 100))}%` }} 
                    />
                 </div>
                 <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Transactions: {reportData.salesCount}</span>
                    <span className="text-emerald-600">Actual: {((reportData.profit / (reportData.totalSales || 1)) * 100).toFixed(1)}%</span>
                 </div>
              </div>
           </CardContent>
         </Card>

         <Card>
           <CardHeader>
             <CardTitle>Expense Category Breakdown</CardTitle>
           </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center">
             {reportData.expenseBreakdown.length === 0 ? (
               <div className="text-slate-400 italic">No expenses in this period.</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportData.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       formatter={(value: number) => `KES ${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
             )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

function ReportStatCard({ title, value, icon, color = "emerald" }: { title: string, value: number, icon: React.ReactNode, color?: "emerald" | "red" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center",
             color === "emerald" ? "bg-emerald-50" : "bg-red-50"
           )}>
             {icon}
           </div>
           <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
              <h3 className={cn(
                "text-2xl font-black mt-1 tracking-tight",
                color === "emerald" ? "text-slate-900" : "text-red-600"
              )}>
                {color === "red" ? "-" : ""} KES {Math.abs(value).toLocaleString()}
              </h3>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { cn } from '../lib/utils';
