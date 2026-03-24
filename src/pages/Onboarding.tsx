/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { CITIES, INTERESTS, PERSONALITIES } from '../constants';
import { City, Interest, Personality, BudgetLevel, UserProfile } from '../types';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: auth.currentUser?.displayName || '',
    age: 18,
    city: 'الدار البيضاء' as City,
    interests: [],
    personality: 'اجتماعي' as Personality,
    budget: 2,
  });

  useEffect(() => {
    const checkProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        navigate('/home');
      }
    };
    checkProfile();
  }, [navigate]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const profile: UserProfile = {
        ...(formData as UserProfile),
        uid: auth.currentUser.uid,
        createdAt: Date.now(),
        friendCount: 0,
        outingCount: 0,
        rating: 5.0,
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid), profile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`));
      toast.success('تم إنشاء الحساب!');
      navigate('/home');
    } catch (error) {
      console.error(error);
      toast.error('فشل حفظ المعلومات.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: Interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests?.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...(prev.interests || []), interest],
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 flex flex-col">
      <header className="py-8 text-center">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= step ? 'w-8 bg-orange-500' : 'w-4 bg-neutral-800'
              }`}
            />
          ))}
        </div>
        <h1 className="text-2xl font-black italic tracking-tighter text-orange-500">فين نمشيو</h1>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">شكون نتا؟</h2>
                <p className="text-neutral-500">بداو بالأساسيات.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">سميتك</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors"
                    placeholder="دخل سميتك"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">عمرك</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors"
                    min="18"
                    max="99"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">مدينتك</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value as City })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors appearance-none"
                  >
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">شنو كيعجبك؟</h2>
                <p className="text-neutral-500">ختار على الأقل 3 اهتمامات.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest as Interest)}
                    className={`p-4 rounded-2xl border transition-all text-sm font-bold capitalize ${
                      formData.interests?.includes(interest as Interest)
                        ? 'bg-orange-500 border-orange-500 text-neutral-950'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">كيفاش داير؟</h2>
                <p className="text-neutral-500">كيفاش كتوصف راسك؟</p>
              </div>
              <div className="space-y-3">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, personality: p as Personality })}
                    className={`w-full p-6 rounded-2xl border transition-all text-left flex items-center justify-between ${
                      formData.personality === p
                        ? 'bg-orange-500 border-orange-500 text-neutral-950'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="text-lg font-bold capitalize">{p}</span>
                    {formData.personality === p && <Check size={20} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">ميزانية؟</h2>
                <p className="text-neutral-500">شحال كتخسر عادة؟</p>
              </div>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4].map((b) => (
                  <button
                    key={b}
                    onClick={() => setFormData({ ...formData, budget: b as BudgetLevel })}
                    className={`flex-1 aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                      formData.budget === b
                        ? 'bg-orange-500 border-orange-500 text-neutral-950'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="text-xl font-black">{'$'.repeat(b)}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      {b === 1 ? 'رخيص' : b === 2 ? 'متوسط' : b === 3 ? 'غالي' : 'فخم'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="py-8 flex gap-4">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <button
          onClick={step === 4 ? handleSubmit : handleNext}
          disabled={loading}
          className="flex-1 bg-orange-500 text-neutral-950 font-black rounded-2xl p-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-orange-500/20"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {step === 4 ? 'سالي' : 'زيد'}
              <ChevronRight size={24} />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
