/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Shield, Eye, HelpCircle, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();

  const settingsGroups = [
    {
      title: 'الحساب والخصوصية',
      items: [
        { icon: <Shield size={20} />, label: 'الخصوصية والأمان', action: () => toast.info('قريبا...') },
        { icon: <Eye size={20} />, label: 'من يقدر يشوفني', action: () => toast.info('قريبا...') },
      ]
    },
    {
      title: 'التنبيهات',
      items: [
        { icon: <Bell size={20} />, label: 'تنبيهات المجموعات', action: () => toast.info('قريبا...') },
        { icon: <Bell size={20} />, label: 'تنبيهات الرسائل', action: () => toast.info('قريبا...') },
      ]
    },
    {
      title: 'الدعم والمعلومات',
      items: [
        { icon: <HelpCircle size={20} />, label: 'مركز المساعدة', action: () => toast.info('قريبا...') },
        { icon: <Info size={20} />, label: 'حول التطبيق', action: () => toast.info('فين نمشيو v1.0.0') },
      ]
    }
  ];

  const handleDeleteAccount = () => {
    toast.error('هاد الميزة مازال ما واجداش.');
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="text-neutral-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black tracking-tighter italic">الإعدادات</h1>
      </header>

      <div className="p-6 space-y-8 max-w-md mx-auto">
        {settingsGroups.map((group, i) => (
          <section key={i} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 px-2">
              {group.title}
            </h3>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden">
              {group.items.map((item, j) => (
                <button
                  key={j}
                  onClick={item.action}
                  className={`w-full p-4 flex items-center justify-between transition-colors hover:bg-neutral-800/50 ${
                    j !== group.items.length - 1 ? 'border-b border-neutral-800/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-neutral-500">{item.icon}</div>
                    <span className="font-bold text-sm">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="pt-4">
          <button
            onClick={handleDeleteAccount}
            className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500 transition-colors hover:bg-red-500/20"
          >
            <Trash2 size={20} />
            <span className="font-bold text-sm">مسح الحساب نهائيا</span>
          </button>
        </section>
      </div>
    </div>
  );
}
