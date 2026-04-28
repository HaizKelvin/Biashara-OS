import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { getAIAdvisory } from '../../services/geminiService';
import { cn } from '../../lib/utils';

interface VoiceEntryProps {
  onEntry: (data: { amount: number; category: string; description: string }) => void;
  type: 'sale' | 'expense';
}

export default function VoiceEntry({ onEntry, type }: VoiceEntryProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support voice recognition.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processWithAI(text);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const processWithAI = async (text: string) => {
    setIsProcessing(true);
    try {
      const prompt = `Parse this voice note about a business ${type}: "${text}". 
      Extract the amount as a number, a 1-word category, and a short description. 
      Return only as a JSON object: {"amount": number, "category": "string", "description": "string"}`;
      
      const response = await getAIAdvisory(prompt, {});
      const data = JSON.parse(response);
      setParsedData(data);
    } catch (e) {
      console.error(e);
      alert("AI couldn't understand the voice note. Try saying something like 'Sold sugar for 200 shillings'.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      <Button 
        onClick={startRecording}
        variant={isRecording ? 'danger' : 'outline'}
        className={cn(
          "rounded-2xl gap-2 font-bold transition-all",
          isRecording && "animate-pulse"
        )}
      >
        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        {isRecording ? 'Listening...' : 'Voice Entry'}
      </Button>

      <AnimatePresence>
        {(transcript || isProcessing || parsedData) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-4 left-0 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[70] shadow-emerald-100/50"
          >
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-emerald-600" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Transcription</span>
               </div>
               <button onClick={() => { setTranscript(''); setParsedData(null); }} className="text-slate-300 hover:text-slate-600">
                  <X className="w-4 h-4" />
               </button>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                 <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI is thinking...</p>
              </div>
            ) : parsedData ? (
              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">"{transcript}"</p>
                    <div className="flex items-end justify-between mt-4">
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{parsedData.category}</p>
                          <p className="text-2xl font-black text-slate-900 tracking-tight">KES {parsedData.amount}</p>
                       </div>
                       <Button 
                        size="sm" 
                        className="rounded-xl h-10 px-4 gap-2 font-bold text-xs"
                        onClick={() => {
                          onEntry(parsedData);
                          setTranscript('');
                          setParsedData(null);
                        }}
                       >
                         <Save className="w-4 h-4" /> Save
                       </Button>
                    </div>
                 </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-600 italic">"{transcript}"</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
