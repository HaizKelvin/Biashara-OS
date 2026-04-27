import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  Filter,
  MoreVertical,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useBusiness } from '../context/BusinessContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { format, startOfDay } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';

export default function SalesPage() {
  const { business } = useBusiness();
  const [sales, setSales] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit'>('cash');
  const [category, setCategory] = useState('General');

  useEffect(() => {
    if (!business?.id) return;

    const q = query(
      collection(db, `businesses/${business.id}/sales`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `businesses/${business.id}/sales`);
    });

    return () => unsubscribe();
  }, [business?.id]);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !business?.id) return;

    try {
      await addDoc(collection(db, `businesses/${business.id}/sales`), {
        amount: Number(amount),
        paymentMethod,
        category,
        timestamp: serverTimestamp(),
      });
      setAmount('');
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleDeleteSale = async (id: string) => {
    if (!business?.id || !window.confirm('Are you sure you want to delete this sale?')) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/sales`, id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadSales = () => {
    if (sales.length === 0) return;
    
    const headers = ["Date", "Amount", "Method", "Category"];
    const csvContent = [
      headers.join(","),
      ...sales.map(s => {
        const date = s.timestamp ? format(s.timestamp.toDate(), 'yyyy-MM-dd HH:mm') : '';
        return `"${date}","${s.amount}","${s.paymentMethod}","${s.category}"`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayTotal = sales
    .filter(s => s.timestamp && startOfDay(s.timestamp.toDate()).getTime() === startOfDay(new Date()).getTime())
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center md:text-left">Sales Terminal</h2>
          <p className="text-sm text-slate-500 font-medium">Record daily transactions and monitor cash flow real-time.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-14 px-8 shadow-xl shadow-emerald-100 flex items-center gap-3 font-bold text-lg transform transition-all hover:scale-[1.02] active:scale-95 text-white">
          <Plus className="w-6 h-6" /> Record Sale
        </Button>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/20"></div>
            <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-emerald-400 w-6 h-6" />
               </div>
               <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30">Live</div>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Today's Revenue</p>
               <h3 className="text-4xl font-black tracking-tight italic">KES {todayTotal.toLocaleString()}</h3>
            </div>
         </Card>

         <Card className="rounded-[2.5rem] border-slate-100 p-8 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 mb-2">
               <BrainCircuit className="w-5 h-5 text-emerald-500" />
               <h4 className="text-sm font-bold text-slate-900 italic">Smart Insight</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-bold">Your sales peak between 4 PM and 7 PM. Ensure stock is ready before the evening rush.</p>
            <button 
              onClick={() => alert('Strategic planning requires at least 30 transactions to generate meaningful trends.')}
              className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 hover:underline flex items-center gap-1"
            >
               Strategic Plan <ChevronRight className="w-3 h-3" />
            </button>
         </Card>

         <div className="grid grid-cols-2 gap-4">
            <PaymentMethodCard icon={<Banknote className="text-blue-500" />} label="Cash" count={sales.filter(s => s.paymentMethod === 'cash').length} />
            <PaymentMethodCard icon={<Smartphone className="text-emerald-500" />} label="M-Pesa" count={sales.filter(s => s.paymentMethod === 'mpesa').length} />
         </div>
      </div>

      {/* Main Stats & Table */}
      <Card className="rounded-[3rem] border-slate-100 overflow-hidden shadow-sm">
        <CardHeader className="p-4 md:p-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between bg-white sticky top-0 z-10 gap-4">
           <div className="flex items-center gap-6 flex-1 w-full">
              <CardTitle className="text-lg font-bold shrink-0">History</CardTitle>
              <div className="relative w-full max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input 
                  placeholder="Search sales..." 
                  className="w-full h-11 bg-slate-50 border-none rounded-xl pl-12 pr-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300 outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 md:flex-initial rounded-xl border-slate-100 text-slate-500 h-11 md:h-10 px-4 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest border-slate-200"
                onClick={handleDownloadSales}
              >
                 <Download className="w-4 h-4" /> Export
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[600px] md:min-w-0">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.15em] text-slate-400 italic">
                  <th className="px-4 md:px-8 py-5">Timestamp</th>
                  <th className="px-4 md:px-8 py-5 text-center">Payment</th>
                  <th className="px-4 md:px-8 py-5 text-center">Category</th>
                  <th className="px-4 md:px-8 py-5 text-right font-black">Amount</th>
                  <th className="px-4 md:px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <ShoppingBag className="text-emerald-100 w-12 h-12" />
                          <p className="text-slate-400 font-bold tracking-tight text-[10px] uppercase tracking-[0.2em]">No sales recorded yet</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  sales.filter(s => (s.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (s.paymentMethod?.toLowerCase() || '').includes(searchQuery.toLowerCase())).map((sale) => (
                    <motion.tr layout key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <Clock className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {sale.timestamp ? format(sale.timestamp.toDate(), 'h:mm a') : '...'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {sale.timestamp ? format(sale.timestamp.toDate(), 'MMM d, yyyy') : '...'}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border",
                          sale.paymentMethod === 'cash' ? "bg-blue-50 border-blue-100 text-blue-600" :
                          sale.paymentMethod === 'mpesa' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                          "bg-purple-50 border-purple-100 text-purple-600"
                        )}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className="text-[10px] font-bold text-slate-500 tracking-tight">{sale.category}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="font-black text-slate-900 text-xl tracking-tight italic">KES {sale.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteSale(sale.id)}
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

      {/* Add Sale Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                    <ShoppingBag className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Njia ya Malipo</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 italic">Record New Transaction</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full hover:bg-slate-100 h-10 w-10">
                  <X className="w-6 h-6 text-slate-400" />
                </Button>
              </div>

              <form onSubmit={handleAddSale} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sale Amount (KES)</label>
                  <div className="relative group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs uppercase tracking-[0.2em]">KES</span>
                    <Input 
                      placeholder="0.00" 
                      className="pl-20 h-20 rounded-[1.5rem] bg-slate-50 border-none text-4xl font-black text-slate-900 tracking-tight transition-all focus:bg-white focus:ring-0" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                   <div className="grid grid-cols-3 gap-3">
                      <PaymentButton active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} icon={<Banknote className="w-5 h-5"/>} label="Cash" />
                      <PaymentButton active={paymentMethod === 'mpesa'} onClick={() => setPaymentMethod('mpesa')} icon={<Smartphone className="w-5 h-5"/>} label="M-Pesa" />
                      <PaymentButton active={paymentMethod === 'credit'} onClick={() => setPaymentMethod('credit')} icon={<CreditCard className="w-5 h-5"/>} label="Credit" />
                   </div>
                </div>

                <Button type="submit" size="lg" className="w-full h-20 rounded-[1.75rem] text-xl font-black shadow-2xl shadow-emerald-100 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white tracking-tight transform transition-all active:scale-[0.98]">
                  Finalize Transaction
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentMethodCard({ icon, label, count }: any) {
  return (
    <Card className="rounded-[1.75rem] border-slate-100 p-6 flex flex-col justify-center items-center text-center gap-3">
       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-slate-900">{count}</p>
       </div>
    </Card>
  );
}

function PaymentButton({ active, onClick, icon, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all transition-transform active:scale-95",
        active 
          ? "bg-emerald-50 border-emerald-600 text-emerald-700 shadow-lg shadow-emerald-100" 
          : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
      )}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
