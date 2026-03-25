/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, PlusCircle, MapPin, Bell, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { AppNotification } from '../types';
import { toast } from 'sonner';

export default function Layout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribeNotifs: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeNotifs) {
        unsubscribeNotifs();
      }

      if (!user) {
        setUnreadCount(0);
        return;
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );

      unsubscribeNotifs = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.docs.length);
        
        // Show toast for new notifications if not on the notifications page
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notif = change.doc.data() as AppNotification;
            // Don't show toast if it's an old notification just being loaded
            if (Date.now() - notif.createdAt < 15000) {
              
              const isNotifsPage = location.pathname === '/notifications';
              const isAppFocused = document.visibilityState === 'visible';

              if (!isNotifsPage) {
                toast(notif.title, {
                  description: notif.body,
                  action: {
                    label: 'شوف',
                    onClick: () => navigate('/notifications')
                  }
                });
              }

              // System Notification (OS Level)
              // Show if app is not focused OR if not on notifications page
              if ('Notification' in window && Notification.permission === 'granted' && (!isAppFocused || !isNotifsPage)) {
                try {
                  const systemNotif = new window.Notification(notif.title, {
                    body: notif.body,
                    icon: '/icon.svg',
                    dir: 'rtl',
                    lang: 'ar',
                    tag: notif.id, // Prevent duplicate notifications for same ID
                    renotify: true
                  } as any);
                  
                  // Vibrate if supported
                  if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                  }

                  systemNotif.onclick = () => {
                    window.focus();
                    if (notif.link) {
                      navigate(notif.link);
                    } else {
                      navigate('/notifications');
                    }
                    systemNotif.close();
                  };
                } catch (e) {
                  console.error("Failed to show system notification", e);
                }
              }
            }
          }
        });
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifs) {
        unsubscribeNotifs();
      }
    };
  }, [navigate, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={20} className="text-neutral-950 fill-current" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white italic">فين نمشيو</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <MapPin size={14} className="text-orange-500" />
            <span>الدار البيضاء</span>
          </div>
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-neutral-950" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-800 px-6 py-3 flex items-center justify-around">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors duration-200",
              isActive ? "text-orange-500" : "text-neutral-500 hover:text-neutral-300"
            )
          }
        >
          <Home size={24} />
          <span className="text-[10px] font-medium uppercase tracking-widest">الرئيسية</span>
        </NavLink>

        <NavLink
          to="/create-session"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors duration-200",
              isActive ? "text-orange-500" : "text-neutral-500 hover:text-neutral-300"
            )
          }
        >
          <PlusCircle size={24} />
          <span className="text-[10px] font-medium uppercase tracking-widest">نخرج</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors duration-200",
              isActive ? "text-orange-500" : "text-neutral-500 hover:text-neutral-300"
            )
          }
        >
          <User size={24} />
          <span className="text-[10px] font-medium uppercase tracking-widest">بروفايل</span>
        </NavLink>
      </nav>
    </div>
  );
}
