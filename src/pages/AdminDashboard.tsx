import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Activity, Layers, Calendar, Loader2 } from 'lucide-react';

interface MatchGroup {
  id: string;
  userIds: string[];
  suggestedPlace?: { name: string };
  placeId?: string;
  status: string;
  createdAt: number;
}

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  totalGroups: number;
  groupsToday: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSessions: 0,
    totalGroups: 0,
    groupsToday: 0,
  });
  const [groups, setGroups] = useState<MatchGroup[]>([]);

  useEffect(() => {
    let usersLoaded = false;
    let sessionsLoaded = false;
    let groupsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && sessionsLoaded && groupsLoaded) {
        setLoading(false);
      }
    };

    // Listen to Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
      usersLoaded = true;
      checkLoading();
    });

    // Listen to Active Sessions
    const unsubSessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
      setStats((prev) => ({ ...prev, activeSessions: snapshot.size }));
      sessionsLoaded = true;
      checkLoading();
    });

    // Listen to Match Groups
    const unsubGroups = onSnapshot(collection(db, 'matchGroups'), (snapshot) => {
      const groupsData: MatchGroup[] = [];
      let todayCount = 0;
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data = doc.data() as MatchGroup;
        groupsData.push({ ...data, id: doc.id });

        if (data.createdAt && data.createdAt >= startOfToday.getTime()) {
          todayCount++;
        }
      });

      // Sort groups by newest first
      groupsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setGroups(groupsData);
      setStats((prev) => ({
        ...prev,
        totalGroups: snapshot.size,
        groupsToday: todayCount,
      }));
      
      groupsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubUsers();
      unsubSessions();
      unsubGroups();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 md:p-8 font-sans text-neutral-100" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">لوحة تحكم الإدارة (Admin Dashboard)</h1>
          <p className="text-neutral-400 mt-2">نظرة عامة ومباشرة على إحصائيات التطبيق.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="إجمالي المستخدمين" 
            value={stats.totalUsers} 
            icon={<Users className="w-6 h-6 text-blue-400" />} 
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
          />
          <StatCard 
            title="الجلسات النشطة" 
            value={stats.activeSessions} 
            icon={<Activity className="w-6 h-6 text-green-400" />} 
            bgColor="bg-green-500/10"
            borderColor="border-green-500/20"
          />
          <StatCard 
            title="إجمالي المجموعات" 
            value={stats.totalGroups} 
            icon={<Layers className="w-6 h-6 text-purple-400" />} 
            bgColor="bg-purple-500/10"
            borderColor="border-purple-500/20"
          />
          <StatCard 
            title="مجموعات اليوم" 
            value={stats.groupsToday} 
            icon={<Calendar className="w-6 h-6 text-orange-400" />} 
            bgColor="bg-orange-500/10"
            borderColor="border-orange-500/20"
          />
        </div>

        {/* Match Groups Table */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800">
            <h2 className="text-lg font-semibold text-white">أحدث المجموعات</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-neutral-950/50 text-neutral-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">معرف المجموعة (ID)</th>
                  <th className="px-6 py-4 font-medium">المستخدمين</th>
                  <th className="px-6 py-4 font-medium">المكان</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                      لا توجد مجموعات حالياً.
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-200" dir="ltr">
                        {group.id.length > 15 ? `${group.id.substring(0, 15)}...` : group.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-400">
                        <div className="flex items-center gap-2 justify-end">
                          {group.userIds?.length || 0}
                          <Users className="w-4 h-4 text-neutral-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-300">
                        {group.suggestedPlace?.name || group.placeId || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          group.status === 'matched' || group.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : group.status === 'pending' || group.status === 'searching'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}>
                          {group.status || 'غير معروف'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-400" dir="ltr">
                        {group.createdAt 
                          ? new Date(group.createdAt).toLocaleString('ar-MA') 
                          : 'غير متوفر'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, borderColor }: { title: string, value: number, icon: React.ReactNode, bgColor: string, borderColor: string }) {
  return (
    <div className={`bg-neutral-900 p-6 rounded-xl shadow-sm border ${borderColor} flex items-center gap-4`}>
      <div className={`p-4 rounded-lg ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-400">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}
