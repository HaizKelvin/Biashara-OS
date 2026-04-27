import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  UsersRound,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  X,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useBusiness } from '../context/BusinessContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { getAIAdvisory } from '../services/geminiService';

export default function DebtsPage() {
  const { business } = useBusiness();
  const [debts, setDebts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  
  // New Debt Form State
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!business?.id) return;

    const q = query(
      collection(db, `businesses/${business.id}/debts`),
      orderBy('status', 'desc'),
      orderBy('amount', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      setDebts(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/debts`);
    });

    return () => unsubscribe();
  }, [business?.id]);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return alert('Fill details');
    if (!business?.id) return;

    try {
      const debtData = {
        id: `debt_${Date.now()}`,
        customerName,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, `businesses/${business.id}/debts`), debtData);
      
      setCustomerName('');
      setAmount('');
      setDueDate('');
      setShowAddModal(false);
    } catch (error) {
      console.error(error);
      alert('Failed to add debt');
    }
  };

  const generateAIReminder = async (debt: any) => {
    setLoadingAI(debt.docId);
    try {
      const prompt = `Generate a polite but firm WhatsApp reminder message for a customer named ${debt.customerName} who owes KES ${debt.amount.toLocaleString()} to ${business?.name}. Mention that payment is appreciated. Return ONLY the message text.`;
      const message = await getAIAdvisory(prompt, {});
      
      // WhatsApp link encoding
      const encodedMsg = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    } catch (e) {
      alert("Failed to generate AI message.");
    } finally {
      setLoadingAI(null);
    }
  };

  const handleMarkPaid = async (debtDocId: string) => {
    if (!business?.id) return;
    try {
      const debtRef = doc(db, `businesses/${business.id}/debts`, debtDocId);
      await updateDoc(debtRef, { status: 'paid' });
    } catch (error) {
      console.error(error);
    }
  };

  const totalPending = debts.filter(d => d.status === 'pending').reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Okoa Tracker</h2>
          <p className="text-sm text-slate-500 font-medium">Manage pending customer payments and send AI reminders.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-emerald-600 h-12 px-6 shadow-lg shadow-emerald-100 flex items-center gap-2 font-bold">
          <Plus className="w-5 h-5" /> Add Debtor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-slate-900 text-white border-none rounded-[2rem] p-8">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Clock className="text-white w-6 h-6" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Total Owed</p>
            </div>
            <h3 className="text-4xl font-black tracking-tight">KES {totalPending.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">From {debts.filter(d => d.status === 'pending').length} customers</p>
         </Card>

         <Card className="rounded-[2rem] border-slate-100 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
               <AlertCircle className="text-orange-500 w-5 h-5" />
               <h4 className="font-bold text-sm">Collection Risk</h4>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
               <div className="bg-orange-500 h-full rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Moderate Liability</p>
         </Card>
      </div>

      <Card className="rounded-[2.5rem] border-slate-100 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.15em] text-slate-400">
                  <th className="px-8 py-5">Customer Profile</th>
                  <th className="px-8 py-5">Due Date</th>
                  <th className="px-8 py-5 text-right">Amount Owed</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-center">AI Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <CheckCircle className="text-emerald-200 w-12 h-12" />
                          <p className="text-slate-400 font-bold tracking-tight">Safisana! No pending debts today.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  debts.map((debt) => (
                    <motion.tr layout key={debt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">
                              {debt.customerName[0]}
                           </div>
                           <div>
                              <div className="font-bold text-slate-900">{debt.customerName}</div>
                              <div className="text-[10px] text-slate-400 font-medium tracking-tight">Added {debt.createdAt ? format(debt.createdAt.toDate(), 'MMM d, yyyy') : '...'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                           <CalendarIcon className="w-3.5 h-3.5 text-slate-300" />
                           {debt.dueDate ? format(debt.dueDate.toDate(), 'MMM d, yyyy') : 'Not set'}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="font-black text-slate-900 text-lg">KES {debt.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border",
                          debt.status === 'paid' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-orange-100 text-orange-600 bg-orange-50"
                        )}>
                          {debt.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          {debt.status === 'pending' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-4 rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 gap-2 font-bold text-[10px] uppercase tracking-widest"
                                onClick={() => generateAIReminder(debt)}
                                disabled={loadingAI === debt.docId}
                              >
                                {loadingAI === debt.docId ? (
                                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent animate-spin rounded-full"></div>
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                AI Remind
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-9 w-9 rounded-xl p-0 flex items-center justify-center bg-slate-900 hover:bg-slate-800"
                                onClick={() => handleMarkPaid(debt.docId)}
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-emerald-500 bg-emerald-50 p-2 rounded-xl">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                    <UsersRound className="text-white w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Okoa Record</h3>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Debt Management</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full hover:bg-slate-100 h-10 w-10">
                  <X className="w-6 h-6 text-slate-400" />
                </Button>
              </div>

              <form onSubmit={handleAddDebt} className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                   <Input 
                    placeholder="e.g. Neighbor Jane" 
                    className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                   />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Owed (KES)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs uppercase tracking-widest">KES</span>
                    <Input 
                      placeholder="0.00" 
                      className="pl-16 h-14 rounded-2xl bg-slate-50 border-none text-2xl font-black" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date (Optional)</label>
                   <Input 
                    type="date" 
                    className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                   />
                </div>

                <Button type="submit" size="lg" className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-emerald-100 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white tracking-tight transform hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Secure Debt Record
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
