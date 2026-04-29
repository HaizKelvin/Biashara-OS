import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, ShieldCheck, Clock, DollarSign, TrendingUp, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredUsers: 0,
    revenueEstimate: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === 'haizkelvin5@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const businessesSnap = await getDocs(collection(db, 'businesses'));
        
        const allUsers = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setUsers(allUsers);
        
        const bizs = businessesSnap.docs.map(doc => doc.data());
        
        setStats({
          totalUsers: allUsers.length,
          activeSubscriptions: bizs.filter(b => b.plan && b.plan !== 'free').length,
          expiredUsers: 0, // Logic for expiration
          revenueEstimate: bizs.reduce((acc, b) => acc + (b.plan === 'pro' ? 1500 : b.plan === 'enterprise' ? 3500 : 0), 0)
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-500 max-w-xs">You do not have administrative privileges to view this control center.</p>
          <Button onClick={() => window.location.href = '/app'}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Admin Command Center</h2>
        <p className="text-sm text-slate-500 font-medium">Global platform overview and user management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AdminStatCard title="Total Users" value={stats.totalUsers} icon={<Users />} theme="blue" />
        <AdminStatCard title="Premium Users" value={stats.activeSubscriptions} icon={<ShieldCheck />} theme="emerald" />
        <AdminStatCard title="Expired" value={stats.expiredUsers} icon={<Clock />} theme="orange" />
        <AdminStatCard title="Est. Revenue" value={`KES ${stats.revenueEstimate.toLocaleString()}`} icon={<DollarSign />} theme="purple" />
      </div>

      <Card className="rounded-[2.5rem] border-slate-100 overflow-hidden shadow-sm">
        <CardHeader className="p-8 border-b border-slate-50 flex items-center justify-between">
          <CardTitle>User Registry</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input placeholder="Search platform users..." className="pl-10 pr-4 h-10 bg-slate-50 border-none rounded-xl text-xs font-bold w-64 outline-none" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400 italic">
                    <th className="px-8 py-5">User / Business</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Joined</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {users.map(u => (
                     <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400">
                                {u.displayName?.[0] || 'U'}
                              </div>
                              <div>
                                 <div className="font-bold text-slate-900">{u.displayName || 'Unknown User'}</div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">BIZ ID: {u.businessId || 'N/A'}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500 font-medium">{u.email}</td>
                        <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                           {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM d, yyyy') : 'No Date'}
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                              {u.role}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <TrendingUp className="text-emerald-500 w-5 h-5 mx-auto" />
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminStatCard({ title, value, icon, theme }: any) {
  const themes: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <Card className="rounded-[2rem] border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${themes[theme]}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}
