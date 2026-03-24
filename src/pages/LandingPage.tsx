/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';
import { MapPin, Users, Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('مرحبا بك في فين نمشيو!');
    } catch (error) {
      console.error(error);
      toast.error('فشل تسجيل الدخول. عاود جرب مرة أخرى.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('عمر كاع الخانات عافاك.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('تم إنشاء الحساب بنجاح!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('مرحبا بك مرة أخرى!');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('هاد الإيمايل ديجا مستعمل.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('الإيمايل أو الكلمة السرية غلط.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('الكلمة السرية ضعيفة بزاف.');
      } else {
        toast.error('وقع مشكل. عاود جرب مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="space-y-2">
          <motion.h1 
            className="text-6xl font-black tracking-tighter italic text-orange-500"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            فين نمشيو
          </motion.h1>
          <p className="text-neutral-400 text-lg font-medium">
            ما تخرجش بوحدك. <br />
            لقى مجموعتك دابا.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 py-8">
          <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
              <Zap size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">تطابق سريع</h3>
              <p className="text-xs text-neutral-500">لقى ناس مساليين دابا.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
              <MapPin size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">أجواء محلية</h3>
              <p className="text-xs text-neutral-500">أحسن البلايص في مدينتك.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
              <Users size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">مجموعات صغيرة</h3>
              <p className="text-xs text-neutral-500">مجموعات آمنة واجتماعية من 3 لـ 5 د الناس.</p>
            </div>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleEmailAuth}
          className="space-y-4 w-full"
        >
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                type="email"
                placeholder="الإيمايل (Email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 pr-12 focus:border-orange-500 outline-none transition-colors text-right"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                type="password"
                placeholder="الكلمة السرية (Password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 pr-12 focus:border-orange-500 outline-none transition-colors text-right"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? 'إنشاء حساب جديد' : 'دخول للحساب'}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-orange-500 font-bold text-sm underline underline-offset-4"
            >
              {isSignUp ? 'عندك حساب؟ دخل من هنا' : 'ماعندكش حساب؟ سجل من هنا'}
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-neutral-950 px-2 text-neutral-600 font-bold">أو</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 bg-neutral-900 text-white font-bold rounded-2xl border border-neutral-800 flex items-center justify-center gap-2 text-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              دخول بـ Google
            </button>
          </div>
        </motion.form>
        
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
          تصاوب بـ ❤️ للشباب المغربي
        </p>
      </motion.div>
    </div>
  );
}
