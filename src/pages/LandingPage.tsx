/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';
import { MapPin, Users, Zap } from 'lucide-react';

export default function LandingPage() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('مرحبا بك في فين نمشيو!');
    } catch (error) {
      console.error(error);
      toast.error('فشل تسجيل الدخول. عاود جرب مرة أخرى.');
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="w-full py-4 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-lg"
        >
          بدا دابا
        </motion.button>
        
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
          تصاوب بـ ❤️ للشباب المغربي
        </p>
      </motion.div>
    </div>
  );
}
