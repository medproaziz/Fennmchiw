import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AppNotification } from '../types';
import { Bell, MessageCircle, Users, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      notifs.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), { read: true });
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'match': return <Users className="text-orange-500" size={20} />;
      case 'message': return <MessageCircle className="text-blue-500" size={20} />;
      default: return <Info className="text-neutral-400" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-neutral-900 rounded-lg animate-pulse w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-neutral-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter">الإشعارات</h2>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-orange-500 font-bold flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-full"
          >
            <CheckCircle2 size={14} />
            قرا كولشي
          </button>
        )}
      </header>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border flex items-start gap-4 cursor-pointer transition-colors ${
                notif.read 
                  ? 'bg-neutral-900/50 border-neutral-800/50' 
                  : 'bg-neutral-900 border-neutral-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notif.read ? 'bg-neutral-800/50' : 'bg-neutral-800'
              }`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`font-bold text-sm ${notif.read ? 'text-neutral-300' : 'text-white'}`}>
                    {notif.title}
                  </h4>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0" />
                  )}
                </div>
                <p className={`text-xs ${notif.read ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  {notif.body}
                </p>
                <p className="text-[10px] text-neutral-600 pt-1">
                  {new Date(notif.createdAt).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 space-y-3 opacity-50">
            <Bell size={48} className="mx-auto text-neutral-600" />
            <p className="text-sm font-bold">ما كاين حتى إشعار</p>
          </div>
        )}
      </div>
    </div>
  );
}
