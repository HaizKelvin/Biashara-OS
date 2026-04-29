import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { QrCode, Download, Printer, Share2, Smartphone, MessageSquare, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useBusiness } from '../context/BusinessContext';

export default function MarketingQRPage() {
  const { business } = useBusiness();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Marketing & QR Engine</h2>
          <p className="text-sm text-slate-500 font-medium">Generate printable marketing materials for your storefront.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="rounded-2xl gap-2 font-bold h-12 shadow-sm">
            <Printer className="w-4 h-4" /> Print Shop Sign
          </Button>
          <Button className="rounded-2xl gap-2 font-bold h-12 bg-emerald-600 shadow-xl shadow-emerald-100">
            <Download className="w-4 h-4" /> Save as Image
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Printable Preview */}
        <div ref={printRef} className="print:m-0 print:p-8">
          <Card className="rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-2xl relative bg-white aspect-[3/4] flex flex-col items-center p-12 text-center">
            <div className="absolute top-0 inset-x-0 h-4 bg-emerald-600"></div>
            
            <div className="mt-8 mb-12">
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{business?.name || 'My Business'}</h1>
               <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-[1px] w-8 bg-slate-200"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Smart Business OS</p>
                  <div className="h-[1px] w-8 bg-slate-200"></div>
               </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
               <div className="p-8 bg-slate-50 rounded-[3rem] border-4 border-slate-100 shadow-inner mb-8">
                  <QrCode className="w-48 h-48 text-slate-900" strokeWidth={1} />
               </div>
               <p className="text-xl font-bold text-slate-900 mb-1">Scan to Pay via M-PESA</p>
               <p className="text-sm text-slate-400 font-medium italic">Buy Goods & Services Mode</p>
            </div>

            <div className="w-full mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-black text-slate-900">07XX XXX XXX</span>
               </div>
               <div className="flex items-center gap-2 text-emerald-600">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-black">WhatsApp Orders</span>
               </div>
            </div>
          </Card>
        </div>

        {/* Configuration */}
        <div className="space-y-6">
           <Card className="rounded-[2.5rem] border-slate-100 p-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Customize Target</CardTitle>
              <div className="space-y-4">
                 <QRTargetButton 
                    icon={<Smartphone />} 
                    title="M-Pesa Checkout" 
                    desc="Link directly to your Lipa na M-Pesa Till" 
                    active
                 />
                 <QRTargetButton 
                    icon={<MessageSquare />} 
                    title="WhatsApp Chat" 
                    desc="Start a conversation with your shop" 
                 />
                 <QRTargetButton 
                    icon={<ShoppingBag />} 
                    title="Online Menu/Catalog" 
                    desc="Showcase your inventory to customers" 
                 />
              </div>
           </Card>

           <Card className="rounded-[2.5rem] border-slate-100 p-8 bg-emerald-600 text-white border-none relative overflow-hidden shadow-2xl shadow-emerald-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h4 className="font-bold text-lg italic mb-2">Power Tip</h4>
              <p className="text-sm text-emerald-50 leading-relaxed font-medium">Place your printed QR code at your checkout counter to encourage digital payments and grow your customer database automatically.</p>
              <Button variant="ghost" className="mt-4 p-0 text-white font-black uppercase text-[10px] tracking-widest hover:bg-transparent flex items-center gap-2">
                Learn Marketing Strategy <Share2 className="w-3 h-3" />
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}

function QRTargetButton({ icon, title, desc, active = false }: any) {
  return (
    <button className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${active ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
       </div>
       <div className="flex-1">
          <h5 className={`font-bold text-sm ${active ? 'text-emerald-900' : 'text-slate-900'}`}>{title}</h5>
          <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
       </div>
       {active && <div className="w-2 h-2 rounded-full bg-emerald-600"></div>}
    </button>
  );
}
