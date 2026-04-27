import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Divide, Minus, Plus, X as Multiply, Equal, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CalculatorPage() {
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
      const parts = equation.split(' ');
      if (parts.length < 2) return;
      
      const num1 = parseFloat(parts[0]);
      const operator = parts[1];
      const num2 = parseFloat(display);
      
      let result = 0;
      switch (operator) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '×': result = num1 * num2; break;
        case '÷': result = num2 !== 0 ? num1 / num2 : 0; break;
        default: return;
      }
      
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
    <div className="max-w-md mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex flex-col">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Business Calculator</h2>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Quick Math & Reconciliations</p>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 flex flex-col">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 mb-8 text-right overflow-hidden border border-slate-100 dark:border-slate-800/50 min-h-[160px] flex flex-col justify-end">
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 h-6 uppercase tracking-[0.2em]">{equation}</div>
          <div className="text-6xl font-black text-slate-900 dark:text-slate-100 truncate mt-2">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-4 flex-1">
          <CalcButtonLarge onClick={clear} className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 col-span-2">C</CalcButtonLarge>
          <CalcButtonLarge onClick={() => handleOperator('÷')} className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"><Divide className="w-6 h-6" /></CalcButtonLarge>
          <CalcButtonLarge onClick={() => handleOperator('×')} className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"><Multiply className="w-6 h-6" /></CalcButtonLarge>
          
          {[7, 8, 9].map(n => <CalcButtonLarge key={n} onClick={() => handleNumber(String(n))}>{n}</CalcButtonLarge>)}
          <CalcButtonLarge onClick={() => handleOperator('-')} className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"><Minus className="w-6 h-6" /></CalcButtonLarge>
          
          {[4, 5, 6].map(n => <CalcButtonLarge key={n} onClick={() => handleNumber(String(n))}>{n}</CalcButtonLarge>)}
          <CalcButtonLarge onClick={() => handleOperator('+')} className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"><Plus className="w-6 h-6" /></CalcButtonLarge>
          
          {[1, 2, 3].map(n => <CalcButtonLarge key={n} onClick={() => handleNumber(String(n))}>{n}</CalcButtonLarge>)}
          <CalcButtonLarge onClick={calculate} className="bg-emerald-600 text-white row-span-2"><Equal className="w-8 h-8" /></CalcButtonLarge>
          
          <CalcButtonLarge onClick={() => handleNumber('0')} className="col-span-2">0</CalcButtonLarge>
          <CalcButtonLarge onClick={() => handleNumber('.')}>.</CalcButtonLarge>
        </div>
      </div>
    </div>
  );
}

function CalcButtonLarge({ onClick, children, className, colSpan }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-full rounded-2xl flex items-center justify-center font-black text-2xl transition-all active:scale-95 hover:bg-opacity-80 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/50 shadow-sm",
        className,
        colSpan && `col-span-${colSpan}`
      )}
    >
      {children}
    </button>
  );
}
