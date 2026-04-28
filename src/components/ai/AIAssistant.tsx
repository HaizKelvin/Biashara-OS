import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, MessageSquare, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getAIAdvisory } from '../../services/geminiService';
import { useBusiness } from '../../context/BusinessContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: "Habari! Mimi ni AI Business Assistant wako. Naweza kukusaidia aje kuchanganua data yako au kukuza biashara leo? (I am your AI Business Assistant. How can I help you analyze your data or grow your business today?)" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { business, netBalance, sales, expenses, inventory } = useBusiness();
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    // Business data context for AI - providing richer context
    const bizContext = {
      businessName: business?.name,
      currency: 'KES',
      netBalance: netBalance,
      currentTimestamp: new Date().toISOString(),
      // Send summaries to avoid token limits but provide enough detail
      recentSales: sales.slice(0, 10).map(s => ({ amount: s.amount, method: s.paymentMethod, date: s.timestamp?.toDate?.()?.toISOString() || s.timestamp })),
      recentExpenses: expenses.slice(0, 10).map(e => ({ amount: e.amount, category: e.category, date: e.timestamp?.toDate?.()?.toISOString() || e.timestamp })),
      lowStockItems: inventory.filter(i => i.quantity <= i.minStock).map(i => ({ name: i.name, stock: i.quantity })),
      totalSalesCount: sales.length,
      totalExpensesCount: expenses.length,
      recentInteractionCount: messages.length
    };

    const response = await getAIAdvisory(userMessage, bizContext);
    setMessages(prev => [...prev, { role: 'bot', content: response }]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
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

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[450px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-8rem)] bg-white rounded-[2.5rem] shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-6 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none tracking-tight">Biashara Assistant</h3>
                    <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">AI Business Consultant</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    "max-w-[90%] p-5 rounded-3xl text-sm leading-relaxed",
                    m.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none shadow-lg' 
                      : 'bg-white border border-slate-100 shadow-sm text-slate-800 rounded-tl-none markdown-container'
                  )}>
                    {m.role === 'bot' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
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

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
               <div className="flex gap-2 items-center">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Uliza kuhusu mauzo, stock, au faida..."
                    className="flex-1 h-11 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isTyping} 
                    className="h-11 w-11 p-0 flex items-center justify-center shrink-0 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
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

// Simple helper for class names if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
