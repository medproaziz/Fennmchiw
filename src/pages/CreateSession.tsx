/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ACTIVITIES } from '../constants';
import { ActivityType, Session, UserProfile } from '../types';
import { Clock, Calendar, ChevronRight, MapPin, Zap } from 'lucide-react';

export default function CreateSession() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    activityType: 'قهوة' as ActivityType,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        navigate('/onboarding');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!auth.currentUser || !profile) return;
    setLoading(true);
    try {
      // Check for existing active sessions
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', auth.currentUser.uid),
        where('status', 'in', ['searching', 'matched', 'confirmed'])
      );
      
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'sessions');
        return; // Should not reach here as handleFirestoreError throws
      }

      if (!snapshot.empty) {
        toast.error('عندك ديجا خرجة خدامة!');
        navigate('/home');
        return;
      }

      const sessionId = `session_${Date.now()}`;
      const session: Session = {
        id: sessionId,
        userId: auth.currentUser.uid,
        userName: profile.name,
        userAvatar: profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
        interests: profile.interests,
        city: profile.city,
        activityType: formData.activityType,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'searching',
        createdAt: Date.now(),
      };

      try {
        await setDoc(doc(db, 'sessions', sessionId), session);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `sessions/${sessionId}`);
      }
      
      toast.success('تم إنشاء الخرجة! كنقلبو على ناس...');
      navigate(`/matching/${sessionId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter italic">
          خرج <span className="text-orange-500">دابا</span>
        </h2>
        <p className="text-neutral-500 text-sm font-medium">فوقاش وشنو غادي نديرو؟</p>
      </header>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
              <Calendar size={12} /> التاريخ
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors font-bold"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Clock size={12} /> وقت البدية
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Clock size={12} /> وقت السالي
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 focus:border-orange-500 outline-none transition-colors font-bold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
            <Zap size={12} /> نوع النشاط
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITIES.map((activity) => (
              <button
                key={activity}
                onClick={() => setFormData({ ...formData, activityType: activity as ActivityType })}
                className={`p-4 rounded-2xl border transition-all text-sm font-bold capitalize text-left flex items-center justify-between ${
                  formData.activityType === activity
                    ? 'bg-orange-500 border-orange-500 text-neutral-950'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                {activity}
                {formData.activityType === activity && <div className="w-2 h-2 bg-neutral-950 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">الموقع</h4>
            <p className="text-xs text-neutral-500">كنقلبو في <span className="text-orange-500 font-bold">{profile?.city}</span></p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-5 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95 text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              لقى ليا مجموعتي
              <ChevronRight size={24} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
