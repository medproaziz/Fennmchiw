/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Session, UserProfile, MatchGroup, Place } from '../types';
import { MOCK_PLACES } from '../constants';
import { Zap, Users, MapPin, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Matching() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchingStep, setMatchingStep] = useState(0);

  const steps = [
    "كنقلبو في مدينتك...",
    "كنشوفو ناس عندهم نفس الجو...",
    "كنشوفو الوقت واش مناسب...",
    "كنختارو أحسن بلاصة...",
    "قربنا نساليو..."
  ];

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Session;
        setSession(data);
        if (data.status === 'matched' && data.matchGroupId) {
          navigate(`/match-result/${data.matchGroupId}`);
        }
      } else {
        navigate('/home');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!session || session.status !== 'searching') return;

    const interval = setInterval(() => {
      setMatchingStep((s) => (s + 1) % steps.length);
    }, 3000);

    // REAL-TIME MATCHING LOGIC
    const startMatching = () => {
      if (!session || session.status !== 'searching') return;

      const q = query(
        collection(db, 'sessions'),
        where('city', '==', session.city),
        where('activityType', '==', session.activityType),
        where('date', '==', session.date),
        where('status', '==', 'searching')
      );

      const unsubscribeOthers = onSnapshot(q, async (snapshot) => {
        const others = snapshot.docs
          .map(d => d.data() as Session)
          .filter(s => {
            const isDifferentUser = s.userId !== session.userId;
            // Check for any time overlap
            const timesOverlap = s.startTime < session.endTime && session.startTime < s.endTime;
            // Match with any searching session, even if not currently active
            return isDifferentUser && timesOverlap;
          });

        if (others.length > 0) {
          // Deterministic match ID based on sorted user IDs to prevent duplicate groups
          const allUserIds = [session.userId, ...others.map(s => s.userId)].sort();
          const matchId = `match_${session.date}_${session.city}_${allUserIds.join('_')}`.replace(/\s+/g, '_');
          
          const suggestedPlace = MOCK_PLACES.find(p => p.type === session.activityType) || MOCK_PLACES[0];
          
          const matchGroup: MatchGroup = {
            id: matchId,
            userIds: allUserIds.slice(0, 5), // Limit to 5 people
            placeId: suggestedPlace.id,
            suggestedPlace,
            startTime: session.startTime,
            endTime: session.endTime,
            status: 'pending',
            createdAt: Date.now(),
          };

          try {
            // Use setDoc with deterministic ID - if two users try at once, they write the same data
            await setDoc(doc(db, 'matchGroups', matchId), matchGroup).catch(e => handleFirestoreError(e, OperationType.WRITE, `matchGroups/${matchId}`));
            
            // Update all involved sessions
            const sessionIds = [session.id, ...others.map(s => s.id)].slice(0, 5);
            const updatePromises = sessionIds.map(id => 
              updateDoc(doc(db, 'sessions', id), {
                status: 'matched',
                matchGroupId: matchId
              }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `sessions/${id}`))
            );
            
            await Promise.all(updatePromises);
            toast.success("لقينا ليك مجموعة!");
          } catch (error) {
            console.error("Error creating match:", error);
            // The error is already thrown by handleFirestoreError, but we catch it here to log the local context
          }
        }
      });

      return () => {
        unsubscribeOthers();
      };
    };

    const cleanup = startMatching();
    return () => {
      if (cleanup) cleanup();
      clearInterval(interval);
    };
  }, [session]);

  const handleCancel = async () => {
    if (!sessionId) return;
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      toast.success('تم إلغاء البحث.');
      navigate('/home');
    } catch (error) {
      console.error(error);
      toast.error('فشل إلغاء البحث.');
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-12">
      <div className="relative">
        {/* Animated Rings */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-orange-500/20 rounded-full -z-10"
        />
        <motion.div
          animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute inset-0 bg-orange-500/10 rounded-full -z-10"
        />
        
        <div className="w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40">
          <Zap size={60} className="text-neutral-950 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tighter italic text-orange-500">كنقلبو...</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={matchingStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-neutral-400 font-medium h-6"
          >
            {steps[matchingStep]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-center gap-2 text-neutral-500">
            <MapPin size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">المدينة</span>
          </div>
          <p className="font-bold text-sm">{session.city}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-center gap-2 text-neutral-500">
            <Clock size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">الوقت</span>
          </div>
          <p className="font-bold text-sm">{session.startTime}</p>
        </div>
      </div>

      <button
        onClick={handleCancel}
        className="text-neutral-600 text-xs font-bold uppercase tracking-widest hover:text-neutral-400 transition-colors"
      >
        حبس البحث
      </button>
    </div>
  );
}
