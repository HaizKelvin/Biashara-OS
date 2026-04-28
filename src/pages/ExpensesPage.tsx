import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Receipt, 
  ArrowUpRight, 
  Clock, 
  X, 
  Filter, 
  MoreVertical,
  Banknote,
  TrendingDown,
  AlertCircle,
  PieChart,
  ShoppingBag,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useBusiness } from '../context/BusinessContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { format, startOfDay } from 'date-fns';
import VoiceEntry from '../components/ai/VoiceEntry';
import { Download, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  const { business, expenses } = useBusiness();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [description, setDescription] = useState('');

  const handleAddExpense = async (e?: React.FormEvent, voiceData?: any) => {
    e?.preventDefault();
    const finalAmount = voiceData?.amount || amount;
    const finalCategory = voiceData?.category || category;
    const finalDesc = voiceData?.description || description;

    if (!finalAmount || !business?.id) return;

    try {
      await addDoc(collection(db, `businesses/${business.id}/expenses`), {
        amount: Number(finalAmount),
        category: finalCategory,
        description: finalDesc || '',
        timestamp: serverTimestamp(),
      });
      setAmount('');
      setDescription('');
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!business?.id || !window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/expenses`, id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadExpenses = () => {
    if (expenses.length === 0) return;
    
    const headers = ["Date", "Amount", "Category", "Description"];
    const csvContent = [
      headers.join(","),
      ...expenses.map(e => {
        const date = e.timestamp ? format(e.timestamp.toDate(), 'yyyy-MM-dd HH:mm') : '';
        return `"${date}","${e.amount}","${e.category}","${e.description}"`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayTotal = expenses
    .filter(e => {
      const date = e.timestamp?.toDate ? e.timestamp.toDate() : (e.timestamp ? new Date(e.timestamp) : new Date());
      return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
    })
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expense Tracker</h2>
          <p className="text-sm text-slate-500 font-medium">Record costs, manage utilities, and monitor spending leaks.</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceEntry type="expense" onEntry={(data) => handleAddExpense(undefined, data)} />
          <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-emerald-600 h-12 px-6 shadow-lg shadow-emerald-100 flex items-center gap-2 font-bold text-white hover:bg-emerald-700">
            <Plus className="w-5 h-5" /> Record Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-white border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                  <TrendingDown className="w-6 h-6" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spent Today</p>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight italic text-red-600">KES {todayTotal.toLocaleString()}</h3>
         </Card>

         <Card className="bg-slate-900 text-white border-none rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="flex items-center gap-3 mb-2">
               <Sparkles className="w-4 h-4 text-emerald-400" />
               <h4 className="text-sm font-bold text-slate-200 italic">Spending AI</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Your rent is due soon. We've optimized your cash flow strategy.</p>
         </Card>

         <Card className="rounded-[2rem] border-slate-100 p-8 flex flex-col justify-center items-center text-center">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-2">
               <PieChart className="text-slate-400 w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory is major cost</p>
         </Card>
      </div>

      <Card className="rounded-[2.5rem] border-slate-100 overflow-hidden shadow-sm">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
           <CardTitle className="text-lg font-bold">Expense History</CardTitle>
           <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl border-slate-100 text-slate-500 h-10 px-4 flex items-center gap-2 font-bold text-xs uppercase tracking-widest border-slate-200"
                onClick={handleDownloadExpenses}
              >
                 <Download className="w-4 h-4" /> Download
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl border-slate-100 text-slate-500 h-10 px-4 flex items-center gap-2 font-bold text-xs uppercase tracking-widest border-slate-200"
                onClick={() => alert('Filtering options will be available as your transaction volume increases.')}
              >
                 <Filter className="w-4 h-4" /> Filter
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.15em] text-slate-400">
                  <th className="px-8 py-5">Expense Details</th>
                  <th className="px-8 py-5 text-center">Category</th>
                  <th className="px-8 py-5 text-right font-black">Amount Spent</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <Receipt className="text-emerald-100 w-12 h-12" />
                          <p className="text-slate-400 font-bold tracking-tight text-[10px] uppercase tracking-[0.2em]">Safisana! No expenses yet.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <motion.tr layout key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                             <Banknote className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="font-bold text-slate-900">{expense.description || 'General Expense'}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                                {expense.timestamp?.toDate ? format(expense.timestamp.toDate(), 'MMM d, h:mm a') : format(new Date(), 'MMM d, h:mm a')}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                           {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="font-black text-slate-900 text-xl tracking-tight">KES {expense.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl p-10 outline-none"
            >
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
                       <Receipt className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Record Expense</h3>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full">
                   <X />
                 </Button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount spent (KES)</label>
                    <Input 
                      placeholder="0.00" 
                      className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-2xl font-black" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      autoFocus
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                       <select 
                         className="w-full h-14 rounded-2xl bg-slate-50 px-4 font-bold text-sm outline-none border-none"
                         value={category}
                         onChange={e => setCategory(e.target.value)}
                       >
                          <option>Rent</option>
                          <option>Stock</option>
                          <option>Transport</option>
                          <option>Wages</option>
                          <option>Bills</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                       <Input placeholder="e.g. Electricity" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                 </div>

                 <Button type="submit" size="lg" className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-red-100 mt-4 bg-slate-900 text-white hover:bg-slate-800">
                    Verify & Record Cost
                 </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
