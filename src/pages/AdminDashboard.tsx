import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Activity, Layers, Calendar, Loader2, Eye, Trash2, X, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

interface MatchGroup {
  id: string;
  userIds?: string[];
  suggestedPlace?: { name: string };
  placeId?: string;
  status?: string;
  createdAt?: number;
  [key: string]: any;
}

interface UserData {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt?: number;
  [key: string]: any;
}

interface SessionData {
  id: string;
  userId?: string;
  status?: string;
  location?: any;
  createdAt?: number;
  [key: string]: any;
}

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  totalGroups: number;
  groupsToday: number;
}

type Tab = 'overview' | 'users' | 'sessions' | 'groups';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSessions: 0,
    totalGroups: 0,
    groupsToday: 0,
  });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [groups, setGroups] = useState<MatchGroup[]>([]);

  // Modal States
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UserData | null>(null);

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
      const usersData: UserData[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      // Sort newest first if createdAt exists
      usersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setUsers(usersData);
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
      usersLoaded = true;
      checkLoading();
    });

    // Listen to Active Sessions
    const unsubSessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
      const sessionsData: SessionData[] = [];
      snapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() });
      });
      sessionsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setSessions(sessionsData);
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

  const handleDeleteUser = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', itemToDelete.id));
      toast.success('تم حذف المستخدم بنجاح');
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error('حدث خطأ أثناء حذف المستخدم');
    }
  };

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
          <h1 className="text-3xl font-bold text-white">لوحة تحكم الإدارة</h1>
          <p className="text-neutral-400 mt-2">إدارة المستخدمين، الجلسات، والمجموعات.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 border-b border-neutral-800 pb-4">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={18} />} label="نظرة عامة" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="المستخدمين" count={stats.totalUsers} />
          <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={<Activity size={18} />} label="الجلسات" count={stats.activeSessions} />
          <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<Layers size={18} />} label="المجموعات" count={stats.totalGroups} />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-blue-400" />} bgColor="bg-blue-500/10" borderColor="border-blue-500/20" />
              <StatCard title="الجلسات النشطة" value={stats.activeSessions} icon={<Activity className="w-6 h-6 text-green-400" />} bgColor="bg-green-500/10" borderColor="border-green-500/20" />
              <StatCard title="إجمالي المجموعات" value={stats.totalGroups} icon={<Layers className="w-6 h-6 text-purple-400" />} bgColor="bg-purple-500/10" borderColor="border-purple-500/20" />
              <StatCard title="مجموعات اليوم" value={stats.groupsToday} icon={<Calendar className="w-6 h-6 text-orange-400" />} bgColor="bg-orange-500/10" borderColor="border-orange-500/20" />
            </div>
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">أحدث المجموعات</h2>
                <button onClick={() => setActiveTab('groups')} className="text-sm text-orange-500 hover:text-orange-400">عرض الكل</button>
              </div>
              <GroupsTable groups={groups.slice(0, 5)} onView={setSelectedItem} />
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-neutral-950/50 text-neutral-400 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">المستخدم</th>
                    <th className="px-6 py-4 font-medium">البريد الإلكتروني</th>
                    <th className="px-6 py-4 font-medium">تاريخ التسجيل</th>
                    <th className="px-6 py-4 font-medium text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-500">لا يوجد مستخدمين.</td></tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-200 flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center"><Users size={14} /></div>
                          )}
                          <span dir="ltr">{user.displayName || user.id.substring(0, 10)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-400" dir="ltr">{user.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-neutral-400" dir="ltr">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-MA') : 'غير متوفر'}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setSelectedItem({ type: 'مستخدم', data: user })} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors" title="التفاصيل">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => setItemToDelete(user)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="حذف">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-neutral-950/50 text-neutral-400 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">معرف الجلسة</th>
                    <th className="px-6 py-4 font-medium">المستخدم</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium">تاريخ الإنشاء</th>
                    <th className="px-6 py-4 font-medium text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {sessions.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">لا توجد جلسات.</td></tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-200" dir="ltr">{session.id.substring(0, 12)}...</td>
                        <td className="px-6 py-4 text-sm text-neutral-400" dir="ltr">{session.userId?.substring(0, 10)}...</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {session.status || 'غير معروف'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-400" dir="ltr">
                          {session.createdAt ? new Date(session.createdAt).toLocaleString('ar-MA') : 'غير متوفر'}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button onClick={() => setSelectedItem({ type: 'جلسة', data: session })} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
            <GroupsTable groups={groups} onView={(group) => setSelectedItem({ type: 'مجموعة', data: group })} />
          </div>
        )}

      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-neutral-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">تفاصيل الـ {selectedItem.type}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-neutral-400 hover:text-white transition-colors bg-neutral-800 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                <pre className="text-left text-sm text-green-400 font-mono whitespace-pre-wrap break-words" dir="ltr">
                  {JSON.stringify(selectedItem.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 rounded-2xl max-w-md w-full border border-neutral-800 shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-neutral-400 mb-6">
              هل أنت متأكد أنك تريد حذف المستخدم <span className="text-white font-bold" dir="ltr">{itemToDelete.displayName || itemToDelete.email || itemToDelete.id}</span>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 rounded-xl font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleDeleteUser}
                className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function TabButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
        active 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
          : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
          {count}
        </span>
      )}
    </button>
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

function GroupsTable({ groups, onView }: { groups: MatchGroup[], onView: (item: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-neutral-950/50 text-neutral-400 text-sm uppercase tracking-wider">
            <th className="px-6 py-4 font-medium">معرف المجموعة</th>
            <th className="px-6 py-4 font-medium">المستخدمين</th>
            <th className="px-6 py-4 font-medium">المكان</th>
            <th className="px-6 py-4 font-medium">الحالة</th>
            <th className="px-6 py-4 font-medium">تاريخ الإنشاء</th>
            <th className="px-6 py-4 font-medium text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {groups.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
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
                <td className="px-6 py-4 text-sm text-center">
                  <button onClick={() => onView({ type: 'مجموعة', data: group })} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors" title="التفاصيل">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
