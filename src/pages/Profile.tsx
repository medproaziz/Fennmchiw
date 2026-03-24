/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { User, LogOut, Settings, MapPin, Star, Zap, ChevronRight, Edit3 } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('خرجتي بنجاح.');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('فشل تسجيل الخروج.');
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-6 space-y-6">
        <div className="w-24 h-24 bg-neutral-900 rounded-full animate-pulse mx-auto" />
        <div className="h-8 bg-neutral-900 rounded-lg animate-pulse w-1/2 mx-auto" />
        <div className="h-48 bg-neutral-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-neutral-950 font-black text-4xl shadow-xl shadow-orange-500/20">
            {profile.name.charAt(0)}
          </div>
          <button 
            onClick={() => navigate('/edit-profile')}
            className="absolute bottom-0 right-0 p-2 bg-neutral-900 border border-neutral-800 rounded-full text-orange-500 shadow-lg"
          >
            <Edit3 size={14} />
          </button>
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter italic">{profile.name}</h2>
          <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm font-medium">
            <MapPin size={14} className="text-orange-500" />
            <span>{profile.city}</span>
            <span>•</span>
            <span>{profile.age} عام</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl text-center space-y-1">
          <div className="flex items-center justify-center text-orange-500">
            <Star size={16} fill="currentColor" />
          </div>
          <p className="text-lg font-black tracking-tighter italic">{(profile.rating || 0).toFixed(1)}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">التقييم</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl text-center space-y-1">
          <div className="flex items-center justify-center text-orange-500">
            <Zap size={16} fill="currentColor" />
          </div>
          <p className="text-lg font-black tracking-tighter italic">{profile.outingCount || 0}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">الخرجات</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl text-center space-y-1">
          <div className="flex items-center justify-center text-orange-500">
            <User size={16} fill="currentColor" />
          </div>
          <p className="text-lg font-black tracking-tighter italic">{profile.friendCount || 0}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">صحاب</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">الاهتمامات</h3>
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-xs font-bold capitalize text-neutral-300"
            >
              {interest}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <button 
          onClick={() => navigate('/settings')}
          className="w-full p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex items-center justify-between group transition-colors hover:border-orange-500/50"
        >
          <div className="flex items-center gap-4">
            <Settings size={20} className="text-neutral-500" />
            <span className="font-bold text-sm">إعدادات الحساب</span>
          </div>
          <ChevronRight size={16} className="text-neutral-700 group-hover:text-orange-500" />
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex items-center justify-between group transition-colors hover:border-red-500/50"
        >
          <div className="flex items-center gap-4">
            <LogOut size={20} className="text-red-500" />
            <span className="font-bold text-sm text-red-500">تسجيل الخروج</span>
          </div>
          <ChevronRight size={16} className="text-neutral-700 group-hover:text-red-500" />
        </button>
      </section>

      <footer className="text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
          فين نمشيو v1.0.0
        </p>
      </footer>
    </div>
  );
}
