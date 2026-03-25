/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';
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

        // NEW: Helper to calculate common interests
        const getCommonInterests = (userInterests: string[] = [], otherInterests: string[] = []) => {
          return otherInterests.filter(interest => userInterests.includes(interest));
        };

        // UPDATED: Filter results to include time overlap, different user, and shared interests
        let others = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Session))
          .map(s => {
            // NEW: Calculate common interests count
            const commonInterests = getCommonInterests(session.interests || [], s.interests || []);
            return { ...s, commonInterests, commonCount: commonInterests.length };
          })
          .filter(s => {
            const isDifferentUser = s.userId !== session.userId;
            // Time Overlap algorithm
            const timesOverlap = s.startTime < session.endTime && session.startTime < s.endTime;
            // NEW: Require at least 1 shared interest (or if interests are empty, just match anyway to avoid blocking)
            const hasSharedInterest = (!session.interests?.length || !s.interests?.length) ? true : s.commonCount >= 1;
            
            return isDifferentUser && timesOverlap && hasSharedInterest;
          });

        // NEW: Sort users by number of common interests (highest first)
        others.sort((a, b) => b.commonCount - a.commonCount);

        // NEW: Limit to 4 other people (so total is 5 with current user)
        others = others.slice(0, 4);

        // NEW: Find existing groups (Query outside, verify inside transaction)
        const groupsQuery = query(
          collection(db, 'matchGroups'),
          where('city', '==', session.city),
          where('activityType', '==', session.activityType),
          where('date', '==', session.date),
          where('status', '==', 'pending')
        );
        const pendingGroupsSnap = await getDocs(groupsQuery);
        const candidateGroupRefs = pendingGroupsSnap.docs.map(d => d.ref);

        // UPDATED: Priority logic - Proceed if we have candidate groups OR other searching users
        if (candidateGroupRefs.length > 0 || others.length >= 1) {
          let matchFound = false; // NEW: Flag for successful match event

          try {
            // FIXED: Use runTransaction to prevent Race Conditions
            await runTransaction(db, async (transaction) => {
              // 1. Ensure current user's session is still "searching"
              const mySessionRef = doc(db, 'sessions', session.id);
              const mySessionSnap = await transaction.get(mySessionRef);
              
              // SAFE EXIT: Return early instead of throwing error if user is no longer searching
              if (!mySessionSnap.exists() || mySessionSnap.data().status !== 'searching') {
                return;
              }

              let targetGroupId: string | null = null;
              let matchGroupRef = null;
              let matchGroupData: any = null;

              // NEW: 1. Try to JOIN existing group FIRST
              if (candidateGroupRefs.length > 0) {
                const groupSnaps = await Promise.all(candidateGroupRefs.map(ref => transaction.get(ref)));
                for (const snap of groupSnaps) {
                  if (snap.exists()) {
                    const data = snap.data();
                    const timesOverlap = data.startTime < session.endTime && session.startTime < data.endTime;
                    
                    // Verify group is still valid, has space, and times overlap
                    if (data.status === 'pending' && data.userIds.length < 5 && timesOverlap) {
                      targetGroupId = snap.id;
                      matchGroupRef = snap.ref;
                      matchGroupData = data;
                      break; // Found a valid group!
                    }
                  }
                }
              }

              let availableOthers: any[] = [];

              // UPDATED: 2. Fallback to CREATE new group if no existing group found
              if (!targetGroupId && others.length >= 1) {
                const otherRefs = others.map(o => doc(db, 'sessions', o.id));
                const otherSnaps = await Promise.all(otherRefs.map(ref => transaction.get(ref)));
                
                availableOthers = otherSnaps.filter(snap => snap.exists() && snap.data().status === 'searching');

                if (availableOthers.length > 0) {
                  const foundingIds = [session.userId, availableOthers[0].data().userId].sort();
                  targetGroupId = `match_${session.date}_${session.city}_${foundingIds.join('_')}`.replace(/\s+/g, '_');
                  matchGroupRef = doc(db, 'matchGroups', targetGroupId);
                  
                  const suggestedPlace = MOCK_PLACES.find(p => p.type === session.activityType) || MOCK_PLACES[0];
                  
                  matchGroupData = {
                    id: targetGroupId,
                    city: session.city,                 // NEW: Added for querying existing groups
                    activityType: session.activityType, // NEW: Added for querying existing groups
                    date: session.date,                 // NEW: Added for querying existing groups
                    userIds: [],
                    members: [], // NEW: Array containing member data
                    placeId: suggestedPlace.id,
                    suggestedPlace,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    status: 'pending',
                    confirmedUserIds: [],
                    createdAt: Date.now(),
                  };
                }
              }

              // SAFE EXIT: If no group to join and no available users to form a new one, exit safely
              if (!targetGroupId) {
                return;
              }

              // FIXED: Ensure no duplicate userIds or members in the group
              const existingUserIds = new Set(matchGroupData.userIds || []);
              
              if (!existingUserIds.has(session.userId)) {
                matchGroupData.userIds.push(session.userId);
                existingUserIds.add(session.userId);
                
                // Ensure member doesn't already exist before pushing
                if (!matchGroupData.members.some((m: any) => m.id === session.userId)) {
                  matchGroupData.members.push({
                    id: session.userId,
                    name: session.userName || "مستخدم",
                    avatar: session.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.userId}`,
                    interests: session.interests || []
                  });
                }
              }

              const sessionsToUpdate = [mySessionRef];
              
              // Add other available people (max 5 per group)
              for (const snap of availableOthers) {
                if (matchGroupData.userIds.length >= 5) break; 
                
                const data = snap.data();
                if (!existingUserIds.has(data.userId)) {
                  matchGroupData.userIds.push(data.userId);
                  existingUserIds.add(data.userId);
                  
                  if (!matchGroupData.members.some((m: any) => m.id === data.userId)) {
                    matchGroupData.members.push({
                      id: data.userId,
                      name: data.userName || "مستخدم",
                      avatar: data.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.userId}`,
                      interests: data.interests || []
                    });
                  }
                  sessionsToUpdate.push(snap.ref);
                }
              }

              // Execute all updates atomically
              transaction.set(matchGroupRef!, matchGroupData, { merge: true });
              
              sessionsToUpdate.forEach(ref => {
                transaction.update(ref, {
                  status: 'matched',
                  matchGroupId: targetGroupId
                });
              });
              
              matchFound = true; // NEW: Activate match flag
            });

            // FIXED: Only set isMatchedRef.current = true AFTER successful transaction
            if (matchFound) {
              isMatchedRef.current = true;
              setIsMatched(true);
              
              // Play sound if enabled
              const userDoc = await getDoc(doc(db, 'users', session.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                if (userData?.soundEnabled !== false) {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                  audio.play().catch(e => console.warn("Audio play failed:", e));
                }
              }
              
              toast.success("لقينا ليك مجموعة!");
            }

          } catch (error: any) {
            console.error("Transaction failed or aborted: ", error.message);
            // FIXED: Reset ref properly if transaction fails
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

  // WAITING POOL: Users wait for a short duration (5 minutes) before being considered for cancellation
  const isTimeout = timeElapsed > 300; 

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
