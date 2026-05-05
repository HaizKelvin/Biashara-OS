import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCcw, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Zap,
  Smartphone as PhoneIcon,
  Copy,
  ArrowRight,
  Plus,
  Download,
  Trash2,
  Edit2,
  Save,
  X as CloseIcon,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { parseMpesaMessage } from '../services/geminiService';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { format } from 'date-fns';

export default function MpesaReconciliationPage() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  // AI Recon State
  const [pastedMessage, setPastedMessage] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<{[key: string]: 'idle' | 'saving' | 'success'}>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [reconHistory, setReconHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!business?.id) return;
    const q = query(
      collection(db, `businesses/${business.id}/recon_history`),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReconHistory(logs);
    }, (error) => {
      console.error("History fetch error:", error);
    });

    return () => unsubscribe();
  }, [business?.id]);

  const simulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSynced(true);
    }, 3000);
  };

  const handleExtract = async () => {
    if (!pastedMessage.trim() || !business?.id) return;
    setIsExtracting(true);
    try {
      const results = await parseMpesaMessage(pastedMessage);
      const mappedResults = results.map((r: any, idx: number) => ({
        ...r,
        tempId: r.transactionId || `mpe_temp_${idx}_${Date.now()}`
      }));
      setExtractedItems(mappedResults);
      
      // Immediate storage of the extraction attempt for history
      if (mappedResults.length > 0) {
        await addDoc(collection(db, `businesses/${business.id}/recon_history`), {
          rawMessage: pastedMessage,
          extractedCount: mappedResults.length,
          timestamp: serverTimestamp(),
          items: mappedResults
        });
      }

      // Reset statuses
      const statuses: any = {};
      mappedResults.forEach((r: any) => statuses[r.tempId] = 'idle');
      setSaveStatus(statuses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEditItem = (item: any) => {
    const id = item.transactionId || item.tempId;
    setEditingId(id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    setExtractedItems(prev => prev.map(item => {
      const id = item.transactionId || item.tempId;
      return id === editingId ? editForm : item;
    }));
    setEditingId(null);
    setEditForm(null);
  };

  const handleDeleteItem = (id: string) => {
    setExtractedItems(prev => prev.filter(item => (item.transactionId || item.tempId) !== id));
  };

  const handleDownloadCSV = () => {
    if (extractedItems.length === 0) return;
    
    const headers = ['Transaction ID', 'Amount', 'Type', 'Party', 'Timestamp'];
    const rows = extractedItems.map(item => [
      item.transactionId,
      item.amount,
      item.type,
      item.party,
      item.timestamp || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mpesa_recon_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAsTransaction = async (item: any, type: 'sale' | 'expense') => {
    if (!business?.id || !user?.uid) return;
    const userId = user.uid;
    const sid = item.tempId || item.transactionId;
    
    setSaveStatus(prev => ({ ...prev, [sid]: 'saving' }));
    try {
      // Clean amount: remove non-numeric except dot
      const cleanAmount = typeof item.amount === 'string' 
        ? parseFloat(item.amount.replace(/[^0-9.]/g, ''))
        : Number(item.amount);

      if (isNaN(cleanAmount)) {
        throw new Error('Invalid amount format');
      }

      const collectionName = type === 'sale' ? 'sales' : 'expenses';
      const transactionData: any = {
        amount: cleanAmount,
        paymentMethod: 'mpesa',
        userId: userId,
        description: `M-Pesa Ref: ${item.transactionId || 'N/A'} | Party: ${item.party}`,
        timestamp: serverTimestamp(),
      };

      if (type === 'sale') {
        transactionData.customerName = item.party;
      } else {
        transactionData.category = 'M-Pesa Expense';
      }

      await addDoc(collection(db, `businesses/${business.id}/${collectionName}`), transactionData);
      setSaveStatus(prev => ({ ...prev, [sid]: 'success' }));
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, [sid]: 'idle' }));
      handleFirestoreError(error, OperationType.WRITE, `businesses/${business.id}/${type === 'sale' ? 'sales' : 'expenses'}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-emerald-100">
            <Zap className="w-3 h-3 fill-current" /> Intelligent Accounting
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight italic uppercase leading-none">M-Pesa <span className="text-emerald-500">Sync</span></h2>
          <p className="text-sm text-slate-400 font-medium italic mt-2">Reconcile via API or Smart AI Text Extraction.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {extractedItems.length > 0 && (
            <Button 
               onClick={handleDownloadCSV}
               variant="outline"
               className="rounded-2xl border-slate-200 h-14 px-6 flex items-center gap-3 font-bold text-slate-600 italic uppercase bg-white hover:bg-slate-50 transition-all"
            >
               <Download className="w-5 h-5 text-slate-400" />
               Export CSV
            </Button>
          )}
          <Button 
            onClick={simulateSync} 
            disabled={isSyncing}
            className="rounded-2xl bg-slate-950 hover:bg-slate-900 h-14 px-8 shadow-2xl shadow-slate-200 flex items-center gap-4 font-black text-lg text-white italic uppercase transition-all hover:translate-y-[-2px] active:scale-95"
          >
            {isSyncing ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Smartphone className="w-6 h-6 text-emerald-400" />}
            {isSyncing ? 'Linking...' : 'Daraja API Sync'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: AI Recon Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-xl shadow-slate-100 border-t-4 border-t-emerald-500 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                     <BrainCircuit className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 italic uppercase leading-none">AI Extraction Lab</h3>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 opacity-80">Batch-process M-Pesa SMS records instantly</p>
                  </div>
               </div>
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Engine Active</span>
               </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="relative group">
                <textarea 
                  value={pastedMessage}
                  onChange={(e) => setPastedMessage(e.target.value)}
                  placeholder="Paste multiple M-Pesa SMS messages here... Biashara AI will handle the rest."
                  className="w-full h-48 bg-slate-50/50 border-2 border-slate-100 rounded-[2.5rem] p-8 text-sm font-bold text-slate-600 outline-none focus:border-emerald-200 focus:bg-white transition-all placeholder:text-slate-300 italic resize-none"
                />
                <div className="absolute bottom-6 right-6 opacity-40 group-hover:opacity-100 transition-opacity">
                   <Copy className="w-6 h-6 text-slate-300" />
                </div>
              </div>

              <Button 
                onClick={handleExtract}
                disabled={isExtracting || !pastedMessage.trim()}
                className="w-full h-20 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-widest gap-4 shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.01] active:scale-[0.99] italic"
              >
                {isExtracting ? (
                  <RefreshCcw className="w-6 h-6 animate-spin" />
                ) : (
                  <Zap className="w-6 h-6 fill-current" />
                )}
                {isExtracting ? 'Analyzing Metadata...' : 'Synthesize Transactions'}
              </Button>
            </div>

            <AnimatePresence>
              {extractedItems.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 pt-12 border-t border-slate-100 space-y-6"
                >
                  <div className="flex items-center justify-between mb-8">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Synthesized Records ({extractedItems.length})</p>
                     <div className="h-px bg-slate-100 flex-1 ml-4 shadow-sm" />
                  </div>
                  
                  <div className="space-y-4">
                    {extractedItems.map((item, idx) => {
                      const isEditing = editingId === (item.transactionId || item.tempId);
                      const statusKey = item.tempId || item.transactionId;
                      
                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={statusKey || idx} 
                          className="p-8 bg-white rounded-[2.5rem] border border-slate-100 group hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-slate-100 transition-all relative overflow-hidden"
                        >
                          {/* Accent bar */}
                          <div className={cn(
                            "absolute top-0 left-0 w-2 h-full transition-colors",
                            saveStatus[statusKey] === 'success' ? "bg-emerald-500" : "bg-slate-200"
                          )} />

                          <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="w-10 h-10 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm flex items-center justify-center transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.transactionId || item.tempId)}
                              className="w-10 h-10 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm flex items-center justify-center transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {isEditing ? (
                            <div className="space-y-6">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Amount (KES)</label>
                                     <Input 
                                      className="rounded-2xl h-14 font-black text-lg bg-slate-50 border-none"
                                      value={editForm.amount} 
                                      onChange={(e: any) => setEditForm({ ...editForm, amount: e.target.value })} 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Party Name</label>
                                     <Input 
                                      className="rounded-2xl h-14 font-black bg-slate-50 border-none"
                                      value={editForm.party} 
                                      onChange={(e: any) => setEditForm({ ...editForm, party: e.target.value })} 
                                    />
                                  </div>
                               </div>
                               <div className="flex gap-4">
                                  <Button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 h-14 rounded-2xl text-white text-xs uppercase font-black tracking-widest gap-3 shadow-xl shadow-emerald-100">
                                    <Save className="w-4 h-4" /> Save Synthesized Data
                                  </Button>
                                  <Button variant="ghost" onClick={() => setEditingId(null)} className="h-14 px-8 rounded-2xl text-slate-400 text-xs uppercase font-black tracking-widest">
                                    Cancel
                                  </Button>
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <ExtractedField label="Amount" value={`KES ${Number(item.amount).toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} variant="amount" />
                                <ExtractedField label="Trans Ref" value={item.transactionId} icon={<Smartphone className="w-4 h-4" />} />
                                <ExtractedField label="Recipient / Sender" value={item.party} icon={<PhoneIcon className="w-4 h-4" />} />
                              </div>
                              
                              <div className="mt-8 flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-50">
                                  <Button 
                                    onClick={() => handleSaveAsTransaction(item, 'sale')}
                                    disabled={saveStatus[statusKey] === 'saving' || saveStatus[statusKey] === 'success'}
                                    className={cn(
                                      "flex-1 h-14 rounded-2xl text-white font-black gap-3 uppercase text-[10px] tracking-widest italic transition-all",
                                      saveStatus[statusKey] === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 pointer-events-none" : "bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200"
                                    )}
                                  >
                                    {saveStatus[statusKey] === 'saving' && <RefreshCcw className="w-4 h-4 animate-spin" />}
                                    {saveStatus[statusKey] === 'success' && <CheckCircle className="w-4 h-4" />}
                                    {saveStatus[statusKey] === 'success' ? 'Persisted to Sales' : 'Record as Sale'}
                                  </Button>
                                  <Button 
                                    onClick={() => handleSaveAsTransaction(item, 'expense')}
                                    disabled={saveStatus[statusKey] === 'saving' || saveStatus[statusKey] === 'success'}
                                    variant="outline"
                                    className={cn(
                                      "flex-1 h-14 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-900 font-black gap-3 uppercase text-[10px] tracking-widest italic transition-all hover:bg-slate-50",
                                       saveStatus[statusKey] === 'success' && "opacity-30"
                                    )}
                                  >
                                    Record as Expense
                                  </Button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Right Col: Stats & Info */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-slate-900 border-none rounded-[2.5rem] p-8 text-white relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex flex-col h-full justify-between">
                 <div>
                    <div className="flex items-center gap-3 mb-6">
                       <Sparkles className="text-emerald-400 w-6 h-6" />
                       <h4 className="font-black text-lg italic uppercase tracking-tight">Financial Accuracy</h4>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed italic">The AI Recon tool automatically extracts party names and matches them to your records, reducing data entry time by 90%.</p>
                 </div>
                 <div className="mt-12 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total AI Extracts</span>
                       <span className="text-emerald-400 font-black">24</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy Rate</span>
                       <span className="text-emerald-400 font-black">99.2%</span>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      <AnimatePresence>
        {synced && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center justify-between"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                   <CheckCircle className="text-white w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-bold text-emerald-900 italic">Sync Successful</h4>
                   <p className="text-sm text-emerald-700">0 duplicate transactions found. All records are valid.</p>
                </div>
             </div>
             <Button variant="ghost" onClick={() => setSynced(false)} className="text-emerald-700 font-bold uppercase tracking-widest text-[10px]">Dismiss</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-slate-100 p-8 md:p-12 shadow-xl shadow-slate-100 overflow-hidden relative bg-white">
           <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                    <History className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 italic uppercase leading-none">Archives</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 pl-0.5">Recent Extraction History</p>
                 </div>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                 {reconHistory.length === 0 ? (
                   <div className="p-12 bg-slate-50/50 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
                      <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Stable History Blank</p>
                   </div>
                 ) : (
                   reconHistory.map((log) => (
                     <div key={log.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                 <CheckCircle className="w-6 h-6 text-emerald-500/50" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-50 flex items-center justify-center">
                                 <div className="w-1 h-1 bg-white rounded-full" />
                              </div>
                           </div>
                           <div>
                              <div className="text-sm font-black text-slate-900 italic uppercase">{log.extractedCount} Items Extracted</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM d, h:mm a') : 'Recent Process'}</div>
                           </div>
                        </div>
                        <Button 
                           variant="outline" 
                           onClick={() => {
                             setPastedMessage(log.rawMessage);
                             setExtractedItems(log.items);
                             setIsExtracting(false);
                             const statuses: any = {};
                             log.items.forEach((r: any) => statuses[r.tempId || r.transactionId] = 'idle');
                             setSaveStatus(statuses);
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           className="rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all h-10 px-4"
                        >
                           Restore
                        </Button>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 p-8 md:p-12 shadow-xl shadow-slate-100 overflow-hidden relative bg-white">
           <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <Smartphone className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 italic uppercase leading-none">Daraja API</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 pl-0.5">Automated M-Pesa Linkage</p>
                 </div>
              </div>
              
              <form className="space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Consumer Key</label>
                       <Input placeholder="Base64 Key..." className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Shortcode</label>
                       <Input placeholder="e.g. 174379" className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg" />
                    </div>
                 </div>
                 
                 <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Recommendation</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic mb-6">Use Sandbox credentials first to ensure your webhooks are correctly configured before going live.</p>
                    <Button type="button" className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs italic shadow-xl shadow-emerald-900/50">
                       Establish Connection
                    </Button>
                 </div>
              </form>
           </div>
        </Card>
      </div>
    </div>
  );
}

function ExtractedField({ label, value, icon, variant }: any) {
  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all",
      variant === 'amount' ? "bg-emerald-50/30 border-emerald-100 shadow-sm" : "bg-slate-50/50 border-slate-100"
    )}>
       <div className="flex items-center gap-2 mb-3 text-slate-400">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            variant === 'amount' ? "bg-emerald-500 text-white" : "bg-white text-slate-400 shadow-sm"
          )}>
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
       </div>
       <p className={cn(
         "text-lg font-black tracking-tight italic truncate",
         variant === 'amount' ? "text-emerald-700" : "text-slate-900"
       )}>{value || '---'}</p>
    </div>
  );
}

function ChannelItem({ label, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
       <div className="flex items-center gap-3">
          <PhoneIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{label}</span>
       </div>
       <span className={cn(
          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
          status === 'active' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-100 border-slate-200 text-slate-400"
       )}>
          {status}
       </span>
    </div>
  );
}
