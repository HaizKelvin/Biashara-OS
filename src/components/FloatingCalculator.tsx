import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator as CalculatorIcon, X, Delete, Divide, Minus, Plus, X as Multiply, Equal } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Note: In production use a safer math parser, but for this utility:
      // eslint-disable-next-line no-eval
      const result = eval(fullEquation.replace('×', '*').replace('÷', '/'));
      setDisplay(String(Number(result.toFixed(2))));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all md:bottom-10 md:right-10"
      >
        <CalculatorIcon className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-72 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 p-6 md:right-10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Calculator</span>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4 text-right overflow-hidden">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 h-4 font-bold uppercase tracking-wider">{equation}</div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 truncate">{display}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <CalcButton onClick={clear} className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 col-span-2">Clear</CalcButton>
              <CalcButton onClick={() => handleOperator('÷')} className="bg-slate-100 dark:bg-slate-800"><Divide className="w-4 h-4" /></CalcButton>
              <CalcButton onClick={() => handleOperator('×')} className="bg-slate-100 dark:bg-slate-800"><Multiply className="w-4 h-4" /></CalcButton>
              
              {[7, 8, 9].map(n => <CalcButton key={n} onClick={() => handleNumber(String(n))}>{n}</CalcButton>)}
              <CalcButton onClick={() => handleOperator('-')} className="bg-slate-100 dark:bg-slate-800"><Minus className="w-4 h-4" /></CalcButton>
              
              {[4, 5, 6].map(n => <CalcButton key={n} onClick={() => handleNumber(String(n))}>{n}</CalcButton>)}
              <CalcButton onClick={() => handleOperator('+')} className="bg-slate-100 dark:bg-slate-800"><Plus className="w-4 h-4" /></CalcButton>
              
              {[1, 2, 3].map(n => <CalcButton key={n} onClick={() => handleNumber(String(n))}>{n}</CalcButton>)}
              <CalcButton onClick={calculate} className="bg-emerald-600 text-white row-span-2"><Equal className="w-5 h-5" /></CalcButton>
              
              <CalcButton onClick={() => handleNumber('0')} className="col-span-2">0</CalcButton>
              <CalcButton onClick={() => handleNumber('.')}>.</CalcButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CalcButton({ onClick, children, className, colSpan }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:opacity-80 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
        className,
        colSpan && `col-span-${colSpan}`
      )}
    >
      {children}
    </button>
  );
}
