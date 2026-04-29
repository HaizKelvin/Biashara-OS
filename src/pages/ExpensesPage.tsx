import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Receipt, 
  Clock, 
  X, 
  Banknote,
  TrendingDown,
  PieChart,
  ShoppingBag,
  Sparkles,
  Search,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { useBusiness } from '../context/BusinessContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { format, startOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import VoiceEntry from '../components/ai/VoiceEntry';

export default function ExpensesPage() {
  const { business, expenses } = useBusiness();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [description, setDescription] = useState('');

  // Filter & Pagination Logic
  const filteredExpenses = expenses.filter(e => 
    (e.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (e.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (e.amount.toString().includes(searchQuery))
  );

  const totalItems = filteredExpenses.length;
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
        userId: user?.uid,
        timestamp: serverTimestamp(),
      });
      setAmount('');
      setDescription('');
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `businesses/${business.id}/expenses`);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!business?.id || !window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/expenses`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `businesses/${business.id}/expenses/${id}`);
    }
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Expense Tracker</h2>
          <p className="text-sm text-slate-500 font-medium italic">Record costs, manage utilities, and monitor spending leaks.</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceEntry type="expense" onEntry={(data) => handleAddExpense(undefined, data)} />
          <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-14 px-8 shadow-xl shadow-emerald-100 flex items-center gap-3 font-bold text-lg text-white">
            <Plus className="w-6 h-6" /> Record Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-white border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                  <TrendingDown className="w-6 h-6" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spent Today</p>
            </div>
            <h3 className="text-3xl font-black text-red-600 tracking-tight italic uppercase">KES {todayTotal.toLocaleString()}</h3>
         </Card>

         <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="flex items-center gap-3 mb-2 text-emerald-400">
               <Sparkles className="w-4 h-4" />
               <h4 className="text-sm font-bold italic uppercase tracking-tighter">Budget AI</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-bold italic">Your monthly overhead is within limits. Consider reinvesting 10% of profit into stock.</p>
         </Card>

         <Card className="rounded-[2.5rem] border-slate-100 p-8 flex flex-col justify-center items-center text-center">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-2">
               <PieChart className="text-slate-400 w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory costs are prioritized</p>
         </Card>
      </div>

      <Card className="rounded-[3rem] border-slate-100 overflow-hidden shadow-sm">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between bg-white gap-4">
           <div className="flex items-center gap-6 flex-1 w-full">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Expense History</CardTitle>
              <div className="relative w-full max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input 
                  placeholder="Search expenses..." 
                  className="w-full h-11 bg-slate-50 border-none rounded-xl pl-12 pr-4 text-xs font-bold text-slate-600 outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.15em] text-slate-400 italic">
                  <th className="px-8 py-5">Expense Details</th>
                  <th className="px-8 py-5 text-center">Category</th>
                  <th className="px-8 py-5 text-right font-black">Amount Spent</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <Receipt className="text-emerald-100 w-12 h-12" />
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">No expenses recorded</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((expense) => (
                    <motion.tr layout key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                             <Banknote className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 text-sm">{expense.description || 'General Expense'}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                                {expense.timestamp?.toDate ? format(expense.timestamp.toDate(), 'MMM d, h:mm a') : 'Now'}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-slate-100 bg-slate-50 text-slate-500 italic">
                           {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="font-black text-slate-900 text-xl tracking-tight italic">KES {expense.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleDeleteExpense(expense.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                           <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl p-10 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                       <Receipt className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Record Expense</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 italic">Enter cost details</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full h-10 w-10">
                   <X className="w-6 h-6 text-slate-400" />
                 </Button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount spent (KES)</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs uppercase tracking-[0.2em]">KES</span>
                      <Input placeholder="0.00" className="pl-20 h-20 rounded-[1.5rem] bg-slate-50 border-none text-4xl font-black text-slate-900 tracking-tight outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" autoFocus />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                       <select className="w-full h-14 rounded-xl bg-slate-50 px-4 font-bold text-sm outline-none border-none" value={category} onChange={e => setCategory(e.target.value)}>
                          <option>Rent</option>
                          <option>Stock</option>
                          <option>Transport</option>
                          <option>Wages</option>
                          <option>Bills</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[100px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                       <Input placeholder="e.g. Electricity" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold text-sm" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                 </div>

                 <Button type="submit" className="w-full h-20 rounded-[1.75rem] text-xl font-black shadow-2xl shadow-emerald-100 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white tracking-tight transform transition-all active:scale-[0.98]"> Verify & Record Cost </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
