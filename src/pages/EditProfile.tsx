/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion } from 'motion/react';
import { UserProfile, City, Interest, Personality, BudgetLevel } from '../types';
import { CITIES, INTERESTS, PERSONALITIES } from '../constants';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile || !auth.currentUser) return;
    if (profile.name.length < 2) {
      toast.error('السمية قصيرة بزاف');
      return;
    }
    if (profile.interests.length < 3) {
      toast.error('ختار على الأقل 3 اهتمامات');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...profile
      });
      toast.success('تم تحديث المعلومات!');
      navigate('/profile');
    } catch (error) {
      console.error(error);
      toast.error('فشل تحديث المعلومات.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: Interest) => {
    if (!profile) return;
    const newInterests = profile.interests.includes(interest)
      ? profile.interests.filter((i) => i !== interest)
      : [...profile.interests, interest];
    setProfile({ ...profile, interests: newInterests });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/profile')} className="text-neutral-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black tracking-tighter italic">تعديل البروفايل</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="text-orange-500 font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        </button>
      </header>

      <div className="p-6 space-y-8 max-w-md mx-auto">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">معلومات أساسية</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">السمية</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">العمر</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">المدينة</label>
              <select
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value as City })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors appearance-none"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">الاهتمامات</h3>
          <div className="grid grid-cols-2 gap-3">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest as Interest)}
                className={`p-3 rounded-2xl border text-sm font-bold transition-all ${
                  profile.interests.includes(interest as Interest)
                    ? 'bg-orange-500 border-orange-500 text-neutral-950'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Personality */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">الجو ديالك</h3>
          <div className="space-y-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p}
                onClick={() => setProfile({ ...profile, personality: p as Personality })}
                className={`w-full p-4 rounded-2xl border text-left font-bold transition-all ${
                  profile.personality === p
                    ? 'bg-orange-500 border-orange-500 text-neutral-950'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Budget */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">الميزانية</h3>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4].map((b) => (
              <button
                key={b}
                onClick={() => setProfile({ ...profile, budget: b as BudgetLevel })}
                className={`flex-1 aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                  profile.budget === b
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
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95 text-lg flex items-center justify-center gap-2 mt-8"
        >
          {saving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
