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
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { useBusiness } from '../context/BusinessContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { getAIAdvisory } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

export default function DebtsPage() {
  const { business, debts } = useBusiness();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // New Debt Form State
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Filter & Pagination Logic
  const filteredDebts = debts.filter(d => 
    (d.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredDebts.length;
  const paginatedDebts = filteredDebts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDownloadCSV = () => {
    if (filteredDebts.length === 0) return;
    
    const headers = ['Customer Name', 'Amount', 'Due Date', 'Status'];
    const rows = filteredDebts.map(d => [
      d.customerName,
      d.amount,
      d.dueDate?.toDate ? format(d.dueDate.toDate(), 'yyyy-MM-dd') : 'No Date',
      d.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `debts_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;
    if (!business?.id) return;

    try {
      const debtData = {
        customerName,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        userId: user?.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, `businesses/${business.id}/debts`), debtData);
      
      setCustomerName('');
      setAmount('');
      setDueDate('');
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `businesses/${business.id}/debts`);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!business?.id || !window.confirm('Delete this record?')) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/debts`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `businesses/${business.id}/debts/${id}`);
    }
  };

  const generateAIReminder = async (debt: any) => {
    setLoadingAI(debt.id);
    try {
      const prompt = `Generate a polite but firm WhatsApp reminder message for a customer named ${debt.customerName} who owes KES ${debt.amount.toLocaleString()} to ${business?.name}. Focus on payment collection. Return ONLY the message.`;
      const message = await getAIAdvisory(prompt, {});
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
      handleFirestoreError(error, OperationType.UPDATE, `businesses/${business.id}/debts/${debtDocId}`);
    }
  };

  const pendingDebts = debts.filter(d => d.status === 'pending');
  const totalPending = pendingDebts.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Okoa Management</h2>
          <p className="text-sm text-slate-500 font-medium italic">Track collectibles and leverage AI for debt recovery.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadCSV}
            variant="outline" 
            className="rounded-2xl border-slate-200 h-14 px-6 flex items-center gap-3 font-bold text-slate-600 italic uppercase"
          >
            <Download className="w-5 h-5" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-14 px-8 shadow-xl shadow-slate-200 flex items-center gap-3 font-black text-lg uppercase italic">
            <Plus className="w-6 h-6" /> Add Debtor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Wallet className="text-white w-5 h-5" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 italic">Total Uncollected</p>
            </div>
            <h3 className="text-4xl font-black tracking-tight italic leading-none">KES {totalPending.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest italic">From {pendingDebts.length} active debtors</p>
         </Card>

         <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  <AlertCircle className="w-5 h-5" />
               </div>
               <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Recovery Risk</h4>
            </div>
            <div className="space-y-3">
               <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: pendingDebts.length > 5 ? '75%' : '35%' }}></div>
               </div>
               <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{pendingDebts.length > 5 ? 'High Intensity' : 'Moderate Flow'}</p>
                  <p className="text-[10px] text-slate-900 font-black italic">{pendingDebts.length > 5 ? '75%' : '35%'}</p>
               </div>
            </div>
         </Card>
      </div>

      <Card className="rounded-[3rem] border-slate-100 overflow-hidden shadow-sm">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between bg-white gap-4">
           <div className="flex items-center gap-6 flex-1 w-full">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Debt Ledger</CardTitle>
              <div className="relative w-full max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input 
                  placeholder="Search debtors..." 
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
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.15em] text-slate-400 italic">
                  <th className="px-8 py-5">Customer Profile</th>
                  <th className="px-8 py-5">Repayment Date</th>
                  <th className="px-8 py-5 text-right">Balance</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-center">Smart Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedDebts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <CheckCircle className="text-emerald-100 w-12 h-12" />
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No outstanding debts</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDebts.map((debt) => (
                    <motion.tr layout key={debt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm">
                              {debt.customerName[0]}
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 text-sm italic">{debt.customerName}</div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">Record added {debt.createdAt?.toDate ? format(debt.createdAt.toDate(), 'MMM d') : 'Recently'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                           <CalendarIcon className="w-3.5 h-3.5 opacity-40" />
                           {debt.dueDate?.toDate ? format(debt.dueDate.toDate(), 'MMM d, yyyy') : (debt.dueDate instanceof Date ? format(debt.dueDate, 'MMM d, yyyy') : 'No Date Set')}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="font-black text-slate-900 text-lg italic">KES {debt.amount.toLocaleString()}</div>
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
                        <div className="flex items-center justify-center gap-3">
                          {debt.status === 'pending' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 px-4 rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 gap-2 font-black text-[9px] uppercase tracking-widest italic"
                                onClick={() => generateAIReminder(debt)}
                                disabled={loadingAI === debt.id}
                              >
                                {loadingAI === debt.id ? "Drafting..." : <><Sparkles className="w-3.5 h-3.5" /> AI Remind</>}
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-10 w-10 rounded-xl p-0 flex items-center justify-center bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-100"
                                onClick={() => handleMarkPaid(debt.id)}
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-emerald-500 bg-emerald-50 w-10 h-10 flex items-center justify-center rounded-xl border border-emerald-100">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          )}
                          <button onClick={() => handleDeleteDebt(debt.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Add Debt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl p-10 overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100">
                    <UsersRound className="text-white w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase text-shadow-sm">Record Okoa</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 italic">Liability tracking</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full h-10 w-10">
                  <X className="w-6 h-6 text-slate-400" />
                </Button>
              </div>

              <form onSubmit={handleAddDebt} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Profile Name</label>
                   <Input placeholder="e.g. Neighbor Jane" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Debt Value (KES)</label>
                  <div className="relative">
                    <Input placeholder="0" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-black text-xl italic" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">KES CURRENCY</div>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Repayment Date</label>
                   <Input type="date" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>

                <Button type="submit" size="lg" className="w-full h-20 rounded-[1.75rem] text-xl font-black shadow-2xl shadow-slate-100 mt-6 bg-slate-900 hover:bg-slate-800 text-white tracking-widest italic uppercase"> Secure Debt Record </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Wallet(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
  );
}
