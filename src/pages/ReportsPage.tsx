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
  const { business, sales, expenses } = useBusiness();
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

    const end = endOfDay(new Date());
    let start;
    if (period === 'daily') start = startOfDay(new Date());
    else if (period === 'weekly') start = startOfWeek(new Date(), { weekStartsOn: 1 });
    else start = startOfMonth(new Date());

    const filteredSales = sales.filter(s => {
      const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
      return date >= start && date <= end;
    });

    const filteredExpenses = expenses.filter(e => {
      const date = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
      return date >= start && date <= end;
    });

    const salesTotal = filteredSales.reduce((acc, d) => acc + (d.amount || 0), 0);
    const expTotal = filteredExpenses.reduce((acc, d) => acc + (d.amount || 0), 0);

    const breakdownObj: Record<string, number> = {};
    filteredExpenses.forEach(d => {
      const cat = d.category || 'General';
      breakdownObj[cat] = (breakdownObj[cat] || 0) + (d.amount || 0);
    });
    const breakdownArr = Object.entries(breakdownObj).map(([name, value]) => ({ name, value }));

    setReportData({
      totalSales: salesTotal,
      totalExpenses: expTotal,
      profit: salesTotal - expTotal,
      salesCount: filteredSales.length,
      expenseBreakdown: breakdownArr
    });
  }, [sales, expenses, period, business?.id]);

  const handleDownloadFullExport = () => {
    if (!business) return;
    
    // Detailed Exports
    const salesHeader = ["Type", "Amount", "Method", "Date", "Items"];
    const salesRows = sales.map(s => [
      "SALE", 
      s.amount, 
      s.paymentMethod, 
      s.timestamp?.toDate?.()?.toLocaleString() || s.timestamp,
      (s.items || []).map((i: any) => `${i.name}x${i.quantity}`).join("; ")
    ]);

    const expHeader = ["Type", "Amount", "Category", "Date", "Description"];
    const expRows = expenses.map(e => [
      "EXPENSE", 
      e.amount, 
      e.category, 
      e.timestamp?.toDate?.()?.toLocaleString() || e.timestamp,
      e.description || ""
    ]);

    const csvContent = [
      salesHeader.join(","),
      ...salesRows.map(row => row.join(",")),
      "\n",
      expHeader.join(","),
      ...expRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const saveAs = (period === 'monthly' ? 'Monthly' : period === 'weekly' ? 'Weekly' : 'Daily') + '_Audit_Report.csv';
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = saveAs;
    link.click();
  };

  const generateCashFlowDoc = () => {
    // Generate a simple Cash Flow text document
    const doc = `
BUSINESS CASH FLOW STATEMENT
---------------------------
Business: ${business?.name}
Report Period: ${period.toUpperCase()}
Generated: ${new Date().toLocaleString()}

1. CASH INFLOWS
   - Sales Revenue: KES ${reportData.totalSales.toLocaleString()}
   Total Inflows: KES ${reportData.totalSales.toLocaleString()}

2. CASH OUTFLOWS
   - Business Expenses: KES ${reportData.totalExpenses.toLocaleString()}
   Total Outflows: KES ${reportData.totalExpenses.toLocaleString()}

3. NET CASH FLOW
   - Cash Balance Change: KES ${reportData.profit.toLocaleString()}
   - Status: ${reportData.profit >= 0 ? 'SURPLUS' : 'DEFICIT'}

---------------------------
Biashara Assistant - AI Powered Financials
    `;
    
    const blob = new Blob([doc], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `CashFlow_${period}_${format(new Date(), 'yyyyMMdd')}.txt`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Intel & Reports</h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time Performance Metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
             {(['daily', 'weekly', 'monthly'] as const).map(p => (
               <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider",
                  period === p ? "bg-white text-emerald-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-500"
                )}
               >
                 {p}
               </button>
             ))}
          </div>
          <Button onClick={handleDownloadFullExport} variant="outline" className="rounded-2xl gap-2 font-black text-[10px] uppercase tracking-wider">
            <Download className="w-4 h-4" /> Full Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ReportStatCard title="Gross Sales" value={reportData.totalSales} icon={<TrendingUp className="text-emerald-600 w-6 h-6" />} />
         <ReportStatCard title="Total Expenses" value={reportData.totalExpenses} icon={<TrendingUp className="rotate-180 text-red-600 w-6 h-6" />} color="red" />
         <ReportStatCard title="Net Profit" value={reportData.profit} icon={<BarChart3 className={reportData.profit >= 0 ? "text-emerald-600 w-6 h-6" : "text-red-600 w-6 h-6"} />} color={reportData.profit >= 0 ? "emerald" : "red"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50">
           <CardHeader>
             <CardTitle className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-slate-400">
               <span>Performance Analysis</span>
               <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black text-emerald-600" onClick={generateCashFlowDoc}>
                 <FileText className="w-3 h-3" /> Cash Flow Statement
               </Button>
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-8 p-8">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Income', val: reportData.totalSales },
                    { name: 'Costs', val: reportData.totalExpenses }
                  ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      formatter={(v: number) => `KES ${v.toLocaleString()}`} 
                    />
                    <Bar dataKey="val" radius={[12, 12, 12, 12]} barSize={60}>
                       <Cell fill="#10b981" />
                       <Cell fill="#f43f5e" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profit Margin</h4>
                   <span className="text-2xl font-black text-emerald-600 tracking-tighter">{((reportData.profit / (reportData.totalSales || 1)) * 100).toFixed(1)}%</span>
                 </div>
                 <div className="w-full bg-slate-50 h-4 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                      style={{ width: `${Math.min(100, Math.max(0, (reportData.profit / (reportData.totalSales || 1)) * 100))}%` }} 
                    />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 italic">Target: 35.0% for healthy growth in retail sector.</p>
              </div>
           </CardContent>
         </Card>

         <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50">
           <CardHeader>
             <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Expense Category Breakdown</CardTitle>
           </CardHeader>
           <CardContent className="h-[400px] flex items-center justify-center p-8">
             {reportData.expenseBreakdown.length === 0 ? (
               <div className="flex flex-col items-center gap-4 text-slate-300">
                 <PieChartIcon className="w-16 h-16 stroke-[1]" />
                 <p className="text-xs font-bold uppercase tracking-widest">No expenses recorded</p>
               </div>
             ) : (
                <div className="w-full h-full flex flex-col md:flex-row items-center">
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {reportData.expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                           formatter={(value: number) => `KES ${value.toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/3 flex flex-col gap-3 mt-4 md:mt-0">
                    {reportData.expenseBreakdown.map((e, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{e.name}</span>
                          <span className="text-[10px] font-black text-slate-900">{((e.value / reportData.totalExpenses) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
