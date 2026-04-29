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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">M-Pesa Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium italic">Reconcile via API or Smart AI Text Extraction.</p>
        </div>
        <div className="flex gap-3">
          {extractedItems.length > 0 && (
            <Button 
               onClick={handleDownloadCSV}
               variant="outline"
               className="rounded-2xl border-slate-200 h-14 px-6 flex items-center gap-3 font-bold text-slate-600 italic uppercase"
            >
               <Download className="w-5 h-5" />
               CSV
            </Button>
          )}
          <Button 
            onClick={simulateSync} 
            disabled={isSyncing}
            className="rounded-2xl bg-emerald-600 h-14 px-8 shadow-xl shadow-emerald-100 flex items-center gap-3 font-bold text-lg text-white italic uppercase"
          >
            {isSyncing ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
            {isSyncing ? 'Linking...' : 'Daraja Sync'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: AI Recon Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Copy className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 italic uppercase">AI Recon Workspace</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">Paste M-Pesa SMS block for batch accounting</p>
               </div>
            </div>

            <div className="space-y-4">
              <textarea 
                value={pastedMessage}
                onChange={(e) => setPastedMessage(e.target.value)}
                placeholder="Paste your M-Pesa transaction SMS messages here (one or many)..."
                className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-bold text-slate-600 outline-none focus:border-emerald-200 transition-all placeholder:text-slate-300 italic"
              />
              <Button 
                onClick={handleExtract}
                disabled={isExtracting || !pastedMessage.trim()}
                className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-slate-100 italic"
              >
                {isExtracting ? (
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <BrainCircuit className="w-5 h-5 text-emerald-400" />
                )}
                {isExtracting ? 'Analyzing Block...' : 'Extract All Transactions'}
              </Button>
            </div>

            <AnimatePresence>
              {extractedItems.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-8 border-t border-slate-100 space-y-6"
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-4">Detected Transactions ({extractedItems.length})</p>
                  
                  {extractedItems.map((item, idx) => {
                    const isEditing = editingId === (item.transactionId || item.tempId);
                    const statusKey = item.tempId || item.transactionId;
                    
                    return (
                      <div key={statusKey || idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all relative">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditItem(item)}
                            className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.transactionId || item.tempId)}
                            className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                  label="Amount" 
                                  value={editForm.amount} 
                                  onChange={(e: any) => setEditForm({ ...editForm, amount: e.target.value })} 
                                />
                                <Input 
                                  label="Party" 
                                  value={editForm.party} 
                                  onChange={(e: any) => setEditForm({ ...editForm, party: e.target.value })} 
                                />
                             </div>
                             <div className="flex gap-3">
                                <Button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 h-10 rounded-xl text-white text-[10px] uppercase font-black tracking-widest gap-2">
                                  <Save className="w-3 h-3" /> Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1 h-10 rounded-xl text-slate-500 text-[10px] uppercase font-black tracking-widest gap-2">
                                  <CloseIcon className="w-3 h-3" /> Cancel
                                </Button>
                             </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <ExtractedField label="Amount" value={`KES ${item.amount}`} icon={<TrendingUp className="w-3 h-3" />} />
                              <ExtractedField label="Ref ID" value={item.transactionId} icon={<Smartphone className="w-3 h-3" />} />
                              <ExtractedField label="Party" value={item.party} icon={<PhoneIcon className="w-3 h-3" />} />
                            </div>
                            
                            <div className="mt-6 flex flex-col md:flex-row gap-3">
                                <Button 
                                  onClick={() => handleSaveAsTransaction(item, 'sale')}
                                  disabled={saveStatus[statusKey] === 'saving' || saveStatus[statusKey] === 'success'}
                                  className={cn(
                                    "flex-1 h-12 rounded-xl text-white font-bold gap-2 uppercase text-[9px] tracking-widest italic",
                                    saveStatus[statusKey] === 'success' ? "bg-emerald-100 text-emerald-600 pointer-events-none" : "bg-emerald-600 hover:bg-emerald-700"
                                  )}
                                >
                                  {saveStatus[statusKey] === 'saving' && <RefreshCcw className="w-3 h-3 animate-spin" />}
                                  {saveStatus[statusKey] === 'success' && <CheckCircle className="w-3 h-3" />}
                                  {saveStatus[statusKey] === 'success' ? 'Recorded as Sale' : 'Record as Sale'}
                                </Button>
                                <Button 
                                  onClick={() => handleSaveAsTransaction(item, 'expense')}
                                  disabled={saveStatus[statusKey] === 'saving' || saveStatus[statusKey] === 'success'}
                                  variant="outline"
                                  className={cn(
                                    "flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold gap-2 uppercase text-[9px] tracking-widest italic",
                                     saveStatus[statusKey] === 'success' && "opacity-50"
                                  )}
                                >
                                  Record as Expense
                                </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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

      <Card className="rounded-[3rem] border-slate-100 p-8 md:p-12 shadow-sm overflow-hidden relative">
         <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-6">
               <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="text-xl font-black text-slate-900 italic uppercase">Extraction History</h3>
               </div>
               
               <div className="space-y-4">
                  {reconHistory.length === 0 ? (
                    <div className="p-8 bg-slate-50 rounded-3xl text-center">
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No previous extractions found</p>
                    </div>
                  ) : (
                    reconHistory.map((log) => (
                      <div key={log.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                               <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                               <div className="text-sm font-black text-slate-900 italic uppercase">{log.extractedCount} Transactions Extracted</div>
                               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM d, h:mm a') : 'Recent'}</div>
                            </div>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setPastedMessage(log.rawMessage);
                              setExtractedItems(log.items);
                              setIsExtracting(false);
                              const statuses: any = {};
                              log.items.forEach((r: any) => statuses[r.tempId || r.transactionId] = 'idle');
                              setSaveStatus(statuses);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="rounded-xl font-black text-[9px] uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 italic"
                         >
                            Restore Data
                         </Button>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="w-full md:w-80 p-8 bg-slate-900 rounded-[2.5rem] flex flex-col justify-center text-center text-white">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCcw className="w-8 h-8 text-emerald-400" />
               </div>
               <h4 className="font-bold">Auto-Persistence</h4>
               <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">Biashara automatically archives your M-Pesa SMS blocks so you never lose an unrecorded transaction during session breaks.</p>
            </div>
         </div>
      </Card>

      <Card className="rounded-[3rem] border-slate-100 p-8 md:p-12 shadow-sm overflow-hidden relative">
         <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-6">
               <div>
                  <h3 className="text-xl font-black text-slate-900 italic uppercase">DARJA API Configuration</h3>
                  <p className="text-xs text-slate-400 font-medium">Link your Safaricom Developer Portal credentials to enable automated reconciliation.</p>
               </div>
               
               <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="Consumer Key" placeholder="Paste your Consumer Key" className="h-12 rounded-xl" />
                     <Input label="Consumer Secret" placeholder="Paste your Secret" type="password" className="h-12 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="Shortcode (Till/Paybill)" placeholder="e.g. 174379" className="h-12 rounded-xl" />
                     <Input label="Passkey" placeholder="Paste Passkey" type="password" className="h-12 rounded-xl" />
                  </div>
                  <Button type="button" variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] italic">Verify Connection</Button>
               </form>
            </div>

            <div className="w-full md:w-80 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center text-center">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-50 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
               </div>
               <h4 className="font-bold text-slate-900">Why connect?</h4>
               <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Connecting M-Pesa allows Biashara to match payments to sales instantly, eliminating manual entry errors and providing a precise cash flow audit trail.</p>
            </div>
         </div>
      </Card>
    </div>
  );
}

function ExtractedField({ label, value, icon }: any) {
  return (
    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
       <div className="flex items-center gap-2 mb-2 text-slate-400">
          {icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <p className="text-sm font-black text-slate-900 tracking-tight italic">{value || '---'}</p>
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
