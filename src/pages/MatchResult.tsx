/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, addDoc, orderBy, limit, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MatchGroup, UserProfile, ChatMessage } from '../types';
import { Users, MapPin, Clock, Star, ChevronRight, CheckCircle2, MessageSquare, Send, X, LogOut, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function MatchResult() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchGroup | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = onSnapshot(doc(db, 'matchGroups', matchId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as MatchGroup;
        
        // If user is not in the group anymore, go home
        if (auth.currentUser && !data.userIds.includes(auth.currentUser.uid)) {
          navigate('/home');
          return;
        }

        setMatch(data);
        
        // Fetch member profiles
        const memberProfiles: UserProfile[] = [];
        for (const uid of data.userIds) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            memberProfiles.push(userDoc.data() as UserProfile);
          }
        }
        setMembers(memberProfiles);
      } else {
        toast.error('المجموعة تفرتكات حيت بقا فيها غير واحد.');
        navigate('/home');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, navigate]);

  useEffect(() => {
    if (!matchId || !showChat) return;

    const q = query(
      collection(db, `matchGroups/${matchId}/messages`),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [matchId, showChat]);

  const handleConfirm = async () => {
    if (!matchId || !match || !auth.currentUser) return;
    const confirmedIds = match.confirmedUserIds || [];
    if (confirmedIds.includes(auth.currentUser.uid)) return;

    try {
      await updateDoc(doc(db, 'matchGroups', matchId), {
        confirmedUserIds: [...confirmedIds, auth.currentUser.uid]
      });
      toast.success('أكدتي الحضور ديالك!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matchGroups/${matchId}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId || !auth.currentUser) return;

    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'مجهول',
      text: newMessage,
      timestamp: Date.now(),
    };

    try {
      await addDoc(collection(db, `matchGroups/${matchId}/messages`), msg);
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `matchGroups/${matchId}/messages`);
    }
  };

  const handleLeave = async () => {
    if (!matchId || !match || !auth.currentUser) return;
    try {
      // 1. Remove from MatchGroup
      const newUserIds = match.userIds.filter(id => id !== auth.currentUser?.uid);
      const newConfirmedIds = (match.confirmedUserIds || []).filter(id => id !== auth.currentUser?.uid);

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
          await updateDoc(doc(db, 'matchGroups', matchId), { 
            userIds: newUserIds,
            confirmedUserIds: newConfirmedIds
          });
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

  const isConfirmed = auth.currentUser && match.confirmedUserIds?.includes(auth.currentUser.uid);

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter italic">
            صفحة <span className="text-orange-500">المجموعة</span>
          </h2>
          <p className="text-neutral-500 text-sm font-medium">مجموعة {match.suggestedPlace.type}</p>
        </div>
        <button onClick={handleLeave} className="p-3 bg-neutral-900 text-red-500 rounded-2xl border border-neutral-800">
          <LogOut size={20} />
        </button>
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
              <h3 className="text-2xl font-black italic tracking-tighter text-white">{match.suggestedPlace.name}</h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <MapPin size={10} /> {match.suggestedPlace.location}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1 rounded-lg text-orange-500">
              <Clock size={14} />
              <span className="text-xs font-bold">{match.startTime}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500">أعضاء المجموعة ({members.length})</h4>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                {match.confirmedUserIds?.length || 0} أكدوا الحضور
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {members.map((member) => (
                <div key={member.uid} className="flex items-center gap-4 bg-neutral-950/50 p-3 rounded-2xl border border-neutral-800/50">
                  <div className="relative">
                    <img
                      src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`}
                      alt={member.displayName}
                      className="w-12 h-12 rounded-full border border-neutral-800"
                    />
                    {match.confirmedUserIds?.includes(member.uid) && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-neutral-950">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm truncate">{member.displayName.split(' ')[0]}</h5>
                    <div className="flex gap-1 mt-1">
                      {member.interests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="text-[9px] bg-neutral-900 text-neutral-500 px-1.5 py-0.5 rounded-md">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black italic text-orange-500/70 uppercase">
                      {member.vibe || 'Cool'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-6 left-6 right-6 flex gap-3">
        {!isConfirmed ? (
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 bg-orange-500 text-neutral-950 font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95 text-lg flex items-center justify-center gap-2"
          >
            أكد الحضور
            <CheckCircle2 size={20} />
          </button>
        ) : (
          <div className="flex-1 py-4 bg-green-500/10 border border-green-500/20 text-green-500 font-black rounded-2xl flex items-center justify-center gap-2">
            تم التأكيد <CheckCircle2 size={20} />
          </div>
        )}
        <button
          onClick={() => setShowChat(true)}
          className="w-16 h-16 bg-neutral-900 border border-neutral-800 text-white rounded-2xl flex items-center justify-center shadow-xl relative"
        >
          <MessageSquare size={24} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-neutral-950" />
        </button>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-neutral-950 flex flex-col"
          >
            <div className="p-4 border-b border-neutral-900 flex items-center justify-between bg-neutral-950/80 backdrop-blur-xl sticky top-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowChat(false)} className="p-2 text-neutral-400">
                  <X size={24} />
                </button>
                <div>
                  <h3 className="font-black italic text-lg tracking-tighter">شات المجموعة</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    {members.length} أعضاء متصلين
                  </p>
                </div>
              </div>
              <div className="flex -space-x-2">
                {members.slice(0, 3).map(m => (
                  <img key={m.uid} src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.uid}`} className="w-8 h-8 rounded-full border-2 border-neutral-950" />
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex gap-3 text-orange-500 text-xs">
                <Info size={16} className="shrink-0" />
                <p>هذا الشات خاص بالمجموعة ديالكم. تلاقاو في الوقت والمكان المحدد!</p>
              </div>
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.userId === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-neutral-500 mb-1 px-2">{msg.userName.split(' ')[0]}</span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium ${
                      msg.userId === auth.currentUser?.uid
                        ? 'bg-orange-500 text-neutral-950 rounded-tr-none'
                        : 'bg-neutral-900 text-white rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-neutral-950 border-t border-neutral-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="كتب شي حاجة..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-orange-500 text-neutral-950 p-3 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
