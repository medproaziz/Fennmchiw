/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { MatchGroup, UserProfile } from '../types';
import { Users, MapPin, Clock, Star, ChevronRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function MatchResult() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = onSnapshot(doc(db, 'matchGroups', matchId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as MatchGroup;
        
        // If user is not in the group anymore, go home
        if (auth.currentUser && !data.userIds.includes(auth.currentUser.uid)) {
          navigate('/home');
          return;
        }

        setMatch(data);
        if (data.status === 'confirmed') {
          setConfirmed(true);
        }
      } else {
        navigate('/home');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, navigate]);

  const handleJoin = async () => {
    if (!matchId || !match) return;
    try {
      try {
        await updateDoc(doc(db, 'matchGroups', matchId), {
          status: 'confirmed'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `matchGroups/${matchId}`);
      }
      toast.success('دخلتي للمجموعة! نشوفوك تما.');
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeave = async () => {
    if (!matchId || !match || !auth.currentUser) return;
    try {
      const { deleteDoc, doc, updateDoc, collection, query, where, getDocs } = await import('firebase/firestore');
      
      // 1. Remove from MatchGroup
      const newUserIds = match.userIds.filter(id => id !== auth.currentUser?.uid);
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
          await deleteDoc(doc(db, 'matchGroups', matchId));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `matchGroups/${matchId}`);
        }
      } else {
        try {
          await updateDoc(doc(db, 'matchGroups', matchId), { userIds: newUserIds });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `matchGroups/${matchId}`);
        }
      }

      // 2. Delete the session
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', auth.currentUser.uid),
        where('status', 'in', ['matched', 'confirmed'])
      );
      let snap;
      try {
        snap = await getDocs(q);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'sessions');
        return;
      }
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref).catch(e => handleFirestoreError(e, OperationType.DELETE, `sessions/${d.id}`)));
      await Promise.all(deletePromises);

      toast.success('خرجتي من المجموعة.');
      navigate('/home');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !match) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-neutral-900 rounded-lg animate-pulse w-1/2" />
        <div className="h-64 bg-neutral-900 rounded-3xl animate-pulse" />
        <div className="h-32 bg-neutral-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter italic">
          لقينا <span className="text-orange-500">المجموعة!</span>
        </h2>
        <p className="text-neutral-500 text-sm font-medium">لقينا {match.userIds.length} د الناس معاك.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="relative h-48">
          <img
            src={match.suggestedPlace.imageUrl}
            alt={match.suggestedPlace.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-neutral-950/80 px-2 py-1 rounded-md">
                {match.suggestedPlace.type}
              </span>
              <h3 className="text-2xl font-black italic tracking-tighter text-white">{match.suggestedPlace.name}</h3>
            </div>
            <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1 rounded-lg text-orange-500">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-bold">{match.suggestedPlace.rating}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-neutral-500">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">الوقت</span>
              </div>
              <p className="font-bold text-sm">{match.startTime} - {match.endTime}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-neutral-500">
                <Users size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">المجموعة</span>
              </div>
              <p className="font-bold text-sm">{match.userIds.length} د الناس</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-500">
              <MapPin size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">الموقع</span>
            </div>
            <p className="text-sm text-neutral-400">{match.suggestedPlace.location}</p>
          </div>

          <div className="flex -space-x-3">
            {match.userIds.map((uid, i) => (
              <div
                key={uid}
                className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <Users size={16} />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-orange-500 flex items-center justify-center text-neutral-950 font-black text-xs">
              +{match.userIds.length}
            </div>
          </div>
        </div>
      </motion.div>

      {confirmed ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-[32px] flex items-center gap-4 text-green-500">
            <CheckCircle2 size={32} />
            <div className="flex-1">
              <h4 className="font-bold text-lg">راك معانا!</h4>
              <p className="text-sm opacity-70">تلاقاو في {match.suggestedPlace.name} مع {match.startTime}.</p>
            </div>
          </div>
          <button
            onClick={() => toast.info('الشات غادي يكون واجد قريبا!')}
            className="w-full py-5 bg-neutral-900 border border-neutral-800 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg"
          >
            <MessageSquare size={24} />
            شات المجموعة
          </button>
          <button
            onClick={handleLeave}
            className="w-full py-5 bg-neutral-900 border border-neutral-800 text-red-500 font-black rounded-2xl transition-transform active:scale-95 text-lg"
          >
            خرج من المجموعة
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleJoin}
            className="w-full py-5 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95 text-lg flex items-center justify-center gap-2"
          >
            دخل للمجموعة
            <ChevronRight size={24} />
          </button>
          <button
            onClick={handleLeave}
            className="w-full py-5 bg-neutral-900 border border-neutral-800 text-neutral-400 font-black rounded-2xl transition-transform active:scale-95 text-lg"
          >
            ما بغيتش
          </button>
        </div>
      )}
    </div>
  );
}
