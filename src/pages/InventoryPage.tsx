import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle, 
  ChevronRight,
  X,
  Sparkles,
  TrendingUp,
  Warehouse,
  ShoppingCart,
  Trash2,
  Download
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
import { getAIAdvisory } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const { business, inventory } = useBusiness();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Filter & Pagination Logic
  const filteredInventory = inventory.filter(i => 
    (i.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredInventory.length;
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDownloadCSV = () => {
    if (filteredInventory.length === 0) return;
    
    const headers = ['Product Name', 'Quantity', 'Buy Price', 'Sell Price', 'Threshold'];
    const rows = filteredInventory.map(i => [
      i.name,
      i.quantity,
      i.buyPrice || 0,
      i.sellPrice,
      i.lowStockThreshold || 5
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        lowStockThreshold: Number(lowStockThreshold) || 5,
        userId: user?.uid,
        createdAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setName(''); setQuantity(''); setBuyPrice(''); setSellPrice('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `businesses/${business.id}/inventory`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!business?.id || !window.confirm('Delete this item?')) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/inventory`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `businesses/${business.id}/inventory/${id}`);
    }
  };

  const generateRestockAdvice = async () => {
    setLoadingAI(true);
    try {
      const lowStockItems = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5));
      const itemsList = lowStockItems.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ');
      const prompt = `Based on these low stock items: ${itemsList}, provide a quick 2-sentence restock strategy. Return only advice.`;
      const advice = await getAIAdvisory(prompt, {});
      setAiSuggestions(advice);
    } catch (e) {
      setAiSuggestions("Keep records updated for AI advice.");
    } finally {
      setLoadingAI(false);
    }
  };

  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5)).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Stock Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium italic">Track levels, profitability, and smart restocking.</p>
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
          <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-14 px-8 shadow-xl shadow-emerald-100 flex items-center gap-3 font-bold text-lg text-white">
            <Plus className="w-6 h-6" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                     <Warehouse className="w-6 h-6" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Valuation</h4>
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">
                 KES {inventory.reduce((acc, item) => acc + (item.quantity * (item.buyPrice || 0)), 0).toLocaleString()}
               </h3>
               <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">Capital locked in stock</p>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Alert</h4>
               </div>
               <h3 className="text-3xl font-black text-red-600 tracking-tight italic">{lowStockCount} Items</h3>
               <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest italic">Needs replenishment</p>
            </Card>
         </div>

         <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/30 transition-all"></div>
            <div>
               <div className="flex items-center gap-2 mb-6 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="font-bold text-lg uppercase tracking-tighter italic">Stock AI</h4>
               </div>
               {aiSuggestions ? (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] leading-relaxed text-slate-300 font-bold italic">
                    {aiSuggestions}
                 </motion.p>
               ) : (
                 <p className="text-[11px] text-slate-400 font-bold italic">Click below for AI restock strategies based on your data.</p>
               )}
            </div>
            <Button 
               className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-[10px] h-12 uppercase tracking-widest gap-2 shadow-lg shadow-emerald-900/40 text-white italic"
               onClick={generateRestockAdvice}
               disabled={loadingAI}
            >
               {loadingAI ? "Analyzing..." : "Restock Strategy"}
            </Button>
         </Card>
      </div>

      <Card className="rounded-[3rem] border-slate-100 overflow-hidden shadow-sm">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between bg-white gap-4">
           <div className="flex items-center gap-6 flex-1 w-full">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Warehouse Inventory</CardTitle>
              <div className="relative w-full max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input 
                  placeholder="Search products..." 
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
                    <th className="px-4 py-5">Product Details</th>
                    <th className="px-4 py-5 text-center">In Stock</th>
                    <th className="px-4 py-5 text-right">Value</th>
                    <th className="px-4 py-5 text-right">Potential Profit</th>
                    <th className="px-4 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedInventory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-3">
                            <ShoppingCart className="text-emerald-100 w-12 h-12" />
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Inventory empty</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item) => {
                      const isLow = item.quantity <= (item.lowStockThreshold || 5);
                      const profit = (item.sellPrice - (item.buyPrice || 0)) * item.quantity;
                      return (
                        <motion.tr layout key={item.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Package className="w-5 h-5" />
                                 </div>
                                 <div>
                                   <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                                   <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{item.category || 'Stock'}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <span className={cn(
                                 "text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border",
                                 isLow ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                              )}>
                                 {item.quantity} units
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right">
                             <div className="text-xs text-slate-400 font-bold">KES {(item.buyPrice || 0).toLocaleString()} <span className="opacity-40">buy</span></div>
                             <div className="text-sm font-black text-slate-900 italic">KES {item.sellPrice.toLocaleString()} <span className="text-[8px] opacity-40 uppercase">sell</span></div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="font-black text-emerald-600 text-lg tracking-tight italic">+KES {profit.toLocaleString()}</div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </td>
                        </motion.tr>
                      );
                    })
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
                       <Package className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Stock Entry</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 italic">Register new product</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full h-10 w-10">
                   <X className="w-6 h-6 text-slate-400" />
                 </Button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                   <Input placeholder="e.g. Sugar 1kg" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold text-sm" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Stock</label>
                      <Input type="number" placeholder="0" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold text-sm" value={quantity} onChange={e => setQuantity(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Low Alert At</label>
                      <Input type="number" placeholder="5" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold text-sm" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buying Price</label>
                      <Input type="number" placeholder="0" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold text-sm" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price</label>
                      <Input type="number" placeholder="0" className="h-14 rounded-xl bg-slate-50 border-none px-6 font-bold text-sm" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                   </div>
                </div>
                <Button type="submit" className="w-full h-20 rounded-[1.75rem] text-xl font-black shadow-2xl shadow-emerald-100 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white tracking-tight transform transition-all active:scale-[0.98] italic uppercase"> Finalize Entry </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
