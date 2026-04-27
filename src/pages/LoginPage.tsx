import { motion } from 'motion/react';
import { TrendingUp, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/app');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Image with Clearer Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-50 dark:opacity-40" 
          alt="Modern Office Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
      </div>

      {/* Theme Toggle Overlay */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-xl"
        >
          {isDarkMode ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-slate-100" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] p-10 md:p-14 border border-white/40">
          <div className="flex flex-col items-center text-center mb-12">
            <Link to="/" className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30 transition-all hover:scale-110 hover:rotate-3">
              <TrendingUp className="text-white w-10 h-10" />
            </Link>
            <h1 className="text-4xl font-black text-slate-950 tracking-tight mb-4">Biashara OS</h1>
            <p className="text-slate-600 font-semibold leading-relaxed">
              Ingia kusimamia biashara yako <br />
              kwa urahisi na haraka.
            </p>
          </div>

          <div className="space-y-8">
            <Button 
              className="w-full h-16 rounded-2xl flex items-center justify-center gap-4 bg-slate-950 text-white font-black text-lg transition-all hover:translate-y-[-2px] active:scale-[0.98] shadow-2xl shadow-slate-900/40"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Ingia na Google</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-14 text-center">
            <p className="text-slate-500 font-medium">
              Hauna akaunti? 
              <Link to="/register" className="text-emerald-600 font-black hover:text-emerald-700 transition-colors ml-2 uppercase text-xs tracking-widest">
                Anza Sasa
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
