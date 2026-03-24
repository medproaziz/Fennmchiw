/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMatched, setIsMatched] = useState(false);
  const isMatchedRef = useRef(false);

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
        const data = { id: docSnap.id, ...docSnap.data() } as Session;
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
      setTimeElapsed((prev) => prev + 3);
    }, 3000);

    // REAL-TIME MATCHING LOGIC
    const startMatching = () => {
      if (!session || session.status !== 'searching' || isMatchedRef.current) return;

      const q = query(
        collection(db, 'sessions'),
        where('city', '==', session.city),
        where('activityType', '==', session.activityType),
        where('date', '==', session.date),
        where('status', '==', 'searching')
      );

      const unsubscribeOthers = onSnapshot(q, async (snapshot) => {
        if (isMatchedRef.current) return;

        const others = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Session))
          .filter(s => {
            const isDifferentUser = s.userId !== session.userId;
            const timesOverlap = s.startTime < session.endTime && session.startTime < s.endTime;
            return isDifferentUser && timesOverlap;
          });

        // We need at least 2 people total (current user + at least 1 other)
        if (others.length >= 1) {
          isMatchedRef.current = true;
          setIsMatched(true);
          
          // Deterministic match ID based on sorted user IDs to prevent duplicate groups
          const allUserIds = Array.from(new Set([session.userId, ...others.map(s => s.userId)])).sort();
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
            confirmedUserIds: [],
            createdAt: Date.now(),
          };

          try {
            // Play sound if enabled
            const userDoc = await getDoc(doc(db, 'users', session.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserProfile;
              if (userData?.soundEnabled !== false) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.warn("Audio play failed:", e));
              }
            }

            // Use setDoc with deterministic ID
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
            isMatchedRef.current = false;
            setIsMatched(false);
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

  const isTimeout = timeElapsed > 1800; // 30 minutes in seconds

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-12">
      <div className="relative">
        {/* Animated Rings */}
        <motion.div
          animate={isMatched ? { scale: [1, 2], opacity: [1, 0] } : { scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={isMatched ? { duration: 0.5 } : { duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-orange-500/20 rounded-full -z-10"
        />
        <motion.div
          animate={isMatched ? { scale: [1, 3], opacity: [1, 0] } : { scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
          transition={isMatched ? { duration: 0.7, delay: 0.1 } : { duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute inset-0 bg-orange-500/10 rounded-full -z-10"
        />
        
        <motion.div 
          animate={isMatched ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
          className="w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40"
        >
          <Zap size={60} className={`text-neutral-950 ${isMatched ? '' : 'animate-pulse'}`} />
        </motion.div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tighter italic text-orange-500">
          {isMatched ? 'لقينا المجموعة!' : isTimeout ? 'ما لقينا حتى مجموعة' : 'كنقلبو...'}
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={isMatched ? 'matched' : isTimeout ? 'timeout' : matchingStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-neutral-400 font-medium h-6"
          >
            {isMatched 
              ? 'ثواني وغادي ندخلوك للمجموعة...' 
              : isTimeout 
                ? 'جرب مرة أخرى في وقت آخر.' 
                : steps[matchingStep]}
          </motion.p>
        </AnimatePresence>
      </div>

      {isTimeout && !isMatched && (
        <button
          onClick={() => setTimeElapsed(0)}
          className="w-full max-w-xs py-4 bg-neutral-900 border border-neutral-800 rounded-2xl font-bold text-white hover:bg-neutral-800 transition-colors"
        >
          عاود جرب
        </button>
      )}

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
