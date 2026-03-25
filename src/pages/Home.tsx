/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { UserProfile, Session } from '../types';
import { Zap, Clock, MapPin, Users, ChevronRight, LayoutDashboard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', auth.currentUser!.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        navigate('/onboarding');
      }
    };

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', auth.currentUser.uid),
      where('status', 'in', ['searching', 'matched', 'confirmed'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveSession(snapshot.docs[0].data() as Session);
      } else {
        setActiveSession(null);
      }
      setLoading(false);
    });

    fetchProfile();
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-neutral-900 rounded-lg animate-pulse w-1/2" />
        <div className="h-48 bg-neutral-900 rounded-3xl animate-pulse" />
        <div className="h-32 bg-neutral-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic">
            السلام، <span className="text-orange-500">{profile?.name}</span>
          </h2>
          <p className="text-neutral-500 text-sm font-medium">واجد لشي مغامرة جديدة؟</p>
        </div>
        
        {auth.currentUser?.email === 'elbadaouimohamedaziz49@gmail.com' && (
          <button 
            onClick={() => navigate('/admin')}
            className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl text-orange-500 hover:bg-neutral-800 transition-colors"
            title="لوحة التحكم"
          >
            <LayoutDashboard size={24} />
          </button>
        )}
      </header>

      {activeSession ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-500 p-6 rounded-[32px] text-neutral-950 space-y-6 relative overflow-hidden shadow-xl shadow-orange-500/20"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full" />
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">خرجة خدامة</span>
              <h3 className="text-2xl font-black italic tracking-tighter capitalize">
                {activeSession.status === 'searching' ? 'كنقلبو على مجموعتك...' : 'لقينا المجموعة!'}
              </h3>
            </div>
            <div className="bg-neutral-950/20 p-2 rounded-xl">
              <Zap size={20} className="animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-950/10 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="opacity-70" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">الوقت</span>
              </div>
              <p className="font-black text-sm">
                {activeSession.startTime} - {activeSession.endTime}
              </p>
            </div>
            <div className="bg-neutral-950/10 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="opacity-70" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">النشاط</span>
              </div>
              <p className="font-black text-sm capitalize">{activeSession.activityType}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(activeSession.status === 'searching' ? `/matching/${activeSession.id}` : `/match-result/${activeSession.matchGroupId}`)}
              className="flex-1 py-4 bg-neutral-950 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {activeSession.status === 'searching' ? 'شوف البحث' : 'شوف المجموعة'}
              <ChevronRight size={20} />
            </button>
            <button
              onClick={async () => {
                try {
                  const { deleteDoc, doc, getDoc, updateDoc, collection, query, where, getDocs } = await import('firebase/firestore');
                  
                  // If matched/confirmed, we should also handle the MatchGroup
                  if (activeSession.matchGroupId) {
                    const matchRef = doc(db, 'matchGroups', activeSession.matchGroupId);
                    let matchSnap;
                    try {
                      matchSnap = await getDoc(matchRef);
                    } catch (e) {
                      handleFirestoreError(e, OperationType.GET, `matchGroups/${activeSession.matchGroupId}`);
                      return;
                    }
                    
                    if (matchSnap.exists()) {
                      const matchData = matchSnap.data();
                      const newUserIds = matchData.userIds.filter((id: string) => id !== auth.currentUser?.uid);
                      
                      if (newUserIds.length < 2) {
                        // Reset remaining user's session if only 1 left
                        if (newUserIds.length === 1) {
                          const q = query(collection(db, 'sessions'), where('userId', '==', newUserIds[0]));
                          let snap;
                          try {
                            snap = await getDocs(q);
                          } catch (e) {
                            handleFirestoreError(e, OperationType.LIST, 'sessions');
                            return;
                          }
                          if (!snap.empty) {
                            try {
                              await updateDoc(snap.docs[0].ref, {
                                status: 'searching',
                                matchGroupId: null
                              });
                            } catch (e) {
                              handleFirestoreError(e, OperationType.UPDATE, `sessions/${snap.docs[0].id}`);
                            }
                          }
                        }
                        try {
                          await deleteDoc(matchRef);
                        } catch (e) {
                          handleFirestoreError(e, OperationType.DELETE, `matchGroups/${activeSession.matchGroupId}`);
                        }
                      } else {
                        try {
                          await updateDoc(matchRef, { userIds: newUserIds });
                        } catch (e) {
                          handleFirestoreError(e, OperationType.UPDATE, `matchGroups/${activeSession.matchGroupId}`);
                        }
                      }
                    }
                  }

                  try {
                    await deleteDoc(doc(db, 'sessions', activeSession.id));
                  } catch (e) {
                    handleFirestoreError(e, OperationType.DELETE, `sessions/${activeSession.id}`);
                  }
                  toast.success('تم إلغاء الخرجة.');
                } catch (error) {
                  console.error(error);
                  // Error is handled by ErrorBoundary or logged
                }
              }}
              className="px-4 bg-neutral-950/20 text-neutral-950 font-bold rounded-2xl border border-neutral-950/10"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 p-8 rounded-[32px] text-center space-y-6"
        >
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500">
            <Zap size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter italic">خرج دابا</h3>
            <p className="text-neutral-500 text-sm max-w-[200px] mx-auto">
              قول لينا فوقاش مسالي وحنا نلقاو ليك مجموعتك.
            </p>
          </div>
          <button
            onClick={() => navigate('/create-session')}
            className="w-full py-5 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/10 transition-transform active:scale-95 text-lg"
          >
            بغيت نخرج
          </button>
        </motion.div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">آخر المجموعات</h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-orange-500">شوف كولشي</button>
        </div>
        
        <div className="space-y-3">
          <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl flex items-center gap-4 opacity-50">
            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-600">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">ما كاين حتى مجموعة قديمة</h4>
              <p className="text-xs text-neutral-600 italic">تاريخ الخرجات ديالك غادي يبان هنا.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
