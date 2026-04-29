import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, MessageSquare, Sparkles, TrendingUp, Trash2, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { getAIAdvisory } from '../../services/geminiService';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { business, netBalance, sales, expenses, inventory, isSubscriptionActive } = useBusiness();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence & Real-time Sync
  useEffect(() => {
    if (!business?.id || !user) return;

    const q = query(
      collection(db, `businesses/${business.id}/chat_messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out messages older than 5 mins in the UI
      const filtered = msgs.filter((m: any) => {
        const created = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
        return (Date.now() - created.getTime()) < 5 * 60 * 1000;
      });

      setMessages(filtered);
    });

    // Cleanup Job: Delete truly expired messages every minute
    const interval = setInterval(async () => {
      const fiveMinsAgoTs = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
      const expiredQuery = query(
        collection(db, `businesses/${business.id}/chat_messages`),
        where('createdAt', '<', fiveMinsAgoTs)
      );
      const expiredSnap = await getDocs(expiredQuery);
      expiredSnap.forEach(async (expiredDoc) => {
        await deleteDoc(doc(db, `businesses/${business.id}/chat_messages`, expiredDoc.id));
      });
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [business?.id, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !business?.id || !user) return;
    if (!isSubscriptionActive) {
      alert('Your 7-day trial has expired. Please upgrade to Pro to continue using the AI Business Assistant.');
      return;
    }

    const userMessage = input;
    setInput('');
    setIsTyping(true);

    try {
      // 1. Add User Message to Firestore
      await addDoc(collection(db, `businesses/${business.id}/chat_messages`), {
        text: userMessage,
        sender: 'user',
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // 2. Get AI Response
      const bizContext = {
        businessName: business?.name,
        currency: 'KES',
        netBalance: netBalance,
        currentTimestamp: new Date().toISOString(),
        recentSales: sales.slice(0, 10).map(s => ({ amount: s.amount, method: s.paymentMethod, date: s.timestamp?.toDate?.()?.toISOString() || s.timestamp })),
        recentExpenses: expenses.slice(0, 10).map(e => ({ amount: e.amount, category: e.category, date: e.timestamp?.toDate?.()?.toISOString() || e.timestamp })),
        lowStockItems: inventory.filter(i => i.quantity <= (i.minStock || 5)).map(i => ({ name: i.name, stock: i.quantity })),
      };

      const aiResponse = await getAIAdvisory(userMessage, bizContext);

      // 3. Add AI Response to Firestore
      await addDoc(collection(db, `businesses/${business.id}/chat_messages`), {
        text: aiResponse,
        sender: 'ai',
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!business?.id) return;
    const q = query(collection(db, `businesses/${business.id}/chat_messages`));
    const snap = await getDocs(q);
    snap.forEach(async (d) => {
      await deleteDoc(doc(db, `businesses/${business.id}/chat_messages`, d.id));
    });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center text-white z-50 border-2 border-white"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[450px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-8rem)] bg-white rounded-[2.5rem] shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-100"
          >
            <div className="bg-emerald-600 p-6 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none tracking-tight italic uppercase">Business AI</h3>
                    <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80 flex items-center gap-1">
                      <Clock className="w-2 h-2" /> Auto-deletes every 5 mins
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearChat} className="hover:bg-white/20 p-2 rounded-full transition-colors text-white/70 hover:text-white">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {!isSubscriptionActive && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-orange-600 w-5 h-5 shrink-0" />
                  <p className="text-[11px] font-bold text-orange-800">Your trial has expired. AI responses are locked.</p>
                </div>
              )}
              {messages.length === 0 && !isTyping && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 italic uppercase">Secure Chat Active</h4>
                  <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mt-2">All messages are strictly private and automatically self-destruct after 5 minutes.</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    "max-w-[90%] p-5 rounded-3xl text-sm shadow-sm",
                    m.sender === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                  )}>
                    {m.sender === 'ai' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      m.text
                    )}
                    <div className={`text-[8px] mt-2 font-bold uppercase tracking-widest ${m.sender === 'user' ? 'text-white/40' : 'text-slate-300'}`}>
                      {m.createdAt?.toDate ? format(m.createdAt.toDate(), 'HH:mm') : 'Just now'}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none flex gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
               <div className="flex gap-2 items-center">
                  <input
                    value={input}
                    disabled={!isSubscriptionActive}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isSubscriptionActive ? "Ask about sales, stock, or growth..." : "Subscribe to unlock"}
                    className="flex-1 h-11 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold text-slate-600 outline-none disabled:opacity-50"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isTyping || !isSubscriptionActive} 
                    className="h-11 w-11 p-0 flex items-center justify-center shrink-0 rounded-2xl bg-emerald-600 shadow-emerald-100"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AlertCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
