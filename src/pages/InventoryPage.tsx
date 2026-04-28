import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreVertical,
  X,
  Sparkles,
  TrendingUp,
  Warehouse,
  History,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useBusiness } from '../context/BusinessContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { getAIAdvisory } from '../services/geminiService';

export default function InventoryPage() {
  const { business, inventory } = useBusiness();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !sellPrice) return;
    if (!business?.id) return;

    try {
      await addDoc(collection(db, `businesses/${business.id}/inventory`), {
        name,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice),
        lowStockThreshold: Number(lowStockThreshold),
        updatedAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setName(''); setQuantity(''); setBuyPrice(''); setSellPrice('');
    } catch (e) {
      console.error(e);
    }
  };

  const generateRestockAdvice = async () => {
    setLoadingAI(true);
    try {
      const lowStockItems = inventory.filter(i => i.quantity <= i.lowStockThreshold);
      const itemsList = lowStockItems.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ');
      const prompt = `Based on these low stock items: ${itemsList}, provide a quick 2-sentence restock strategy for a retail shop. Focus on what to prioritize to maximize profit. Return only the advice.`;
      const advice = await getAIAdvisory(prompt, {});
      setAiSuggestions(advice);
    } catch (e) {
      setAiSuggestions("Unable to fetch advice. Keep your records updated!");
    } finally {
      setLoadingAI(false);
    }
  };

  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5)).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium">Track stock levels, profitability, and AI-driven restocking.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-emerald-600 h-12 px-6 shadow-lg shadow-emerald-100 flex items-center gap-2 font-bold">
          <Plus className="w-5 h-5" /> {inventory.length === 0 ? 'Initialize Stock' : 'Add Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Stats Bento */}
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] border-slate-100 p-8">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                     <Warehouse />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Valuation</h4>
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                 KES {inventory.reduce((acc, item) => acc + (item.quantity * (item.buyPrice || 0)), 0).toLocaleString()}
               </h3>
               <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">Capital locked in stock</p>
            </Card>

            <Card className="rounded-[2rem] border-slate-100 p-8">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                     <AlertCircle />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Items</h4>
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lowStockCount} Items</h3>
               <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest italic">Needs immediate attention</p>
            </Card>
         </div>

         {/* AI Restock Box */}
         <Card className="bg-slate-900 text-white border-none rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-emerald-500/30"></div>
            <div>
               <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-lg">Inventory AI</h4>
               </div>
               {aiSuggestions ? (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-relaxed text-slate-300 font-medium">
                    {aiSuggestions}
                 </motion.p>
               ) : (
                 <p className="text-xs text-slate-400 leading-relaxed">Click below to generate an AI restocking strategy based on current levels.</p>
               )}
            </div>
            <Button 
               className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold gap-2 shadow-lg shadow-emerald-900/40 text-white"
               onClick={generateRestockAdvice}
               disabled={loadingAI}
            >
               {loadingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <TrendingUp className="w-4 h-4" />}
               Smart Restock Advisor
            </Button>
         </Card>
      </div>

      {/* Inventory Table */}
      <Card className="rounded-[2.5rem] border-slate-100 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black tracking-[0.15em] text-slate-400">
                    <th className="px-8 py-5">Product Name</th>
                    <th className="px-8 py-5 text-center">Stock Level</th>
                    <th className="px-8 py-5 text-right">Buying Price</th>
                    <th className="px-8 py-5 text-right">Selling Price</th>
                    <th className="px-8 py-5 text-right">Profit Potential</th>
                    <th className="px-8 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-3">
                            <ShoppingCart className="text-emerald-100 w-12 h-12" />
                            <p className="text-slate-400 font-bold tracking-tight uppercase tracking-widest text-[10px]">Your stock room is empty</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const isLow = item.quantity <= (item.lowStockThreshold || 5);
                      const profit = (item.sellPrice - item.buyPrice) * item.quantity;
                      return (
                        <motion.tr layout key={item.docId} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Package className="text-slate-400 w-5 h-5" />
                                 </div>
                                 <div className="font-bold text-slate-900">{item.name}</div>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <span className={cn(
                                 "text-sm font-black",
                                 isLow ? "text-red-600" : "text-emerald-600"
                              )}>
                                 {item.quantity} units
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right font-medium text-slate-500">KES {item.buyPrice?.toLocaleString()}</td>
                           <td className="px-8 py-6 text-right font-black text-slate-900">KES {item.sellPrice.toLocaleString()}</td>
                           <td className="px-8 py-6 text-right font-bold text-emerald-600">+KES {profit.toLocaleString()}</td>
                           <td className="px-8 py-6 text-center">
                              <span className={cn(
                                 "text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border",
                                 isLow ? "border-red-100 text-red-600 bg-red-50" : "border-emerald-100 text-emerald-600 bg-emerald-50"
                              )}>
                                 {isLow ? 'Critical' : 'Good'}
                              </span>
                           </td>
                        </motion.tr>
                      );
                    })
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
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Package className="text-white w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Item</h3>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Add to Warehouse</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full hover:bg-slate-100">
                  <X />
                </Button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-6">
                <Input label="Item Name" placeholder="e.g. Sugar 1kg" className="rounded-2xl" value={name} onChange={e => setName(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Quantity" type="number" placeholder="0" className="rounded-2xl" value={quantity} onChange={e => setQuantity(e.target.value)} />
                   <Input label="Low Stock Alert At" type="number" placeholder="5" className="rounded-2xl" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Buying Price" type="number" placeholder="0" className="rounded-2xl" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
                   <Input label="Selling Price" type="number" placeholder="0" className="rounded-2xl" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                </div>
                <Button type="submit" size="lg" className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-emerald-100 mt-6 transform transition-all active:scale-95">
                   Register Stock
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
