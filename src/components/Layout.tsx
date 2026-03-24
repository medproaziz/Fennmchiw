/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet, NavLink } from 'react-router-dom';
import { Home, User, PlusCircle, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tighter text-orange-500 italic">فين نمشيو</h1>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <MapPin size={14} className="text-orange-500" />
          <span>الدار البيضاء</span>
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
