import React, { useState } from 'react';
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
  Smartphone as PhoneIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

export default function MpesaReconciliationPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const simulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSynced(true);
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">C2B Sync Portal</h2>
          <p className="text-sm text-slate-500 font-medium">Auto-reconcile M-Pesa StkPush and Paybill transactions.</p>
        </div>
        <Button 
          onClick={simulateSync} 
          disabled={isSyncing}
          className="rounded-2xl bg-emerald-600 h-14 px-8 shadow-xl shadow-emerald-100 flex items-center gap-3 font-bold text-lg text-white"
        >
          {isSyncing ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
          {isSyncing ? 'Linking Gateway...' : 'Sync M-Pesa'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
               <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                  <Smartphone className="w-12 h-12 text-emerald-600" />
               </div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center">
                  <RefreshCcw className={cn("w-6 h-6 text-emerald-600", isSyncing && "animate-spin")} />
               </div>
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Real-time Reconciliation</h3>
               <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 font-medium">Connect your Daraja API credentials to automatically pull every Till Number transaction into Biashara.</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Last Sync</p>
                  <p className="font-bold text-slate-900">Never</p>
               </div>
               <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">API Status</p>
                  <p className="font-bold text-emerald-600">Encrypted</p>
               </div>
            </div>
         </Card>

         <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="flex items-center gap-3 mb-6">
                  <BrainCircuit className="w-6 h-6 text-emerald-400" />
                  <h4 className="font-bold text-lg italic tracking-tight">AI Audit Trail</h4>
               </div>
               <p className="text-sm text-slate-300 leading-relaxed font-medium">Our AI matches incoming M-Pesa names with your registered Debts automatically.</p>
               <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency Boost</span>
                  <span className="text-emerald-400 font-black">+85%</span>
               </div>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 p-8 flex flex-col gap-4">
               <h4 className="font-bold text-sm text-slate-900 italic">Connected Channels</h4>
               <div className="space-y-3">
                  <ChannelItem label="Lipa na Mpesa Till" status="active" />
                  <ChannelItem label="B2C Payouts" status="legacy" />
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
