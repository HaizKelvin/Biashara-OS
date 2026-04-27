import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Bell, 
  Shield, 
  Moon,
  ChevronRight,
  LogOut,
  Plus,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SettingsPage() {
  const { user, signOutUser } = useAuth();
  const { business } = useBusiness();
  const [bizName, setBizName] = useState(business?.name || '');
  const [editingBiz, setEditingBiz] = useState(false);
  const [activeTab, setActiveTab] = useState('Business Profile');

  const pricingPlans = [
    {
      tier: "Lite",
      price: "500",
      desc: "For micro merchants starting out.",
      features: ['Sales & Expenses tracking', 'Customer Debt management', 'Simple reports', '1 User access']
    },
    {
      tier: "Biashara Pro",
      price: "1,500",
      desc: "Perfect for growing retail shops.",
      featured: true,
      features: ['AI Business Advisor', 'WhatsApp Debt Reminders', 'Auto Inventory alerts', 'M-Pesa manual reconciliations']
    },
    {
      tier: "Enterprise",
      price: "3,500",
      desc: "Scale with multiple branches.",
      features: ['Multiple Branches', 'Real-time Daraja API Sync', 'Advanced Profit/Loss', 'Priority Support']
    }
  ];

  const handleUpdateBiz = async () => {
    if (!business?.id || !bizName) return;
    try {
      const bizRef = doc(db, 'businesses', business.id);
      await updateDoc(bizRef, { name: bizName });
      setEditingBiz(false);
      alert('Business name updated!');
    } catch (error) {
      console.error(error);
      alert('Failed to update business name.');
    }
  };

  const handleDeleteData = () => {
    if (confirm('Are you absolutely sure? This will delete all your transaction records. This action is irreversible.')) {
      alert('This feature is currently in maintenance mode for safety. Please contact support.');
    }
  };

  const handleAddStaff = () => {
    alert('Staff management is available in the Pro tier. Please upgrade to invite team members.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500">Manage your business profile and account preferences.</p>
        </div>
        <Button variant="outline" className="gap-2 text-red-600 border-red-100 hover:bg-red-50" onClick={signOutUser}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
           <SidebarLink icon={<Store />} label="Business Profile" active={activeTab === 'Business Profile'} onClick={() => setActiveTab('Business Profile')} />
           <SidebarLink icon={<ShieldCheck />} label="Subscription & Billing" active={activeTab === 'Subscription'} onClick={() => setActiveTab('Subscription')} />
           <SidebarLink icon={<User />} label="Account Settings" active={activeTab === 'Account Settings'} onClick={() => setActiveTab('Account Settings')} />
           <SidebarLink icon={<Bell />} label="Notifications" active={activeTab === 'Notifications'} onClick={() => setActiveTab('Notifications')} />
           <SidebarLink icon={<Shield />} label="Security" active={activeTab === 'Security'} onClick={() => setActiveTab('Security')} />
           <SidebarLink icon={<Moon />} label="Display Theme" active={activeTab === 'Display Theme'} onClick={() => setActiveTab('Display Theme')} />
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === 'Business Profile' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Business Name</label>
                      <div className="flex gap-2">
                          <Input 
                            value={bizName} 
                            onChange={e => setBizName(e.target.value)} 
                            disabled={!editingBiz}
                            className={!editingBiz ? "bg-slate-50 border-none px-0 font-bold text-lg" : ""}
                          />
                          {editingBiz ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateBiz}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingBiz(false)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setEditingBiz(true)}>Edit</Button>
                          )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Base Currency</div>
                        <p className="font-bold text-slate-900 mt-1">KES (Kenya Shilling)</p>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pricing Plan</div>
                        <p className="font-bold text-emerald-600 mt-1">Free Trial (7 days remaining)</p>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Renewal starts at KES 500/mo</p>
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Staff Management</CardTitle>
                    <Button size="sm" variant="outline" className="h-8 gap-2" onClick={handleAddStaff}><Plus className="w-4 h-4" /> Add Staff</Button>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-slate-50">
                      <div className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                {user?.displayName?.[0] || user?.email?.[0] || 'O'}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">{user?.displayName || 'Business Owner'} (You)</div>
                                <div className="text-xs text-slate-500">{user?.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Owner</span>
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card className="border-red-100">
                <CardHeader>
                    <CardTitle className="text-red-900">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-500">Once you delete your business data, there is no going back. Please be certain.</p>
                    <Button variant="danger" className="w-full" onClick={handleDeleteData}>Delete All Business Data</Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'Subscription' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card className="bg-emerald-600 border-none text-white p-8">
                    <div className="flex items-center gap-2 mb-4">
                       <Zap className="w-5 h-5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Active Plan</span>
                    </div>
                    <h3 className="text-3xl font-black mb-1">Free Trial</h3>
                    <p className="text-emerald-100 font-medium text-sm">7 Days remaining. Choose a plan below to avoid interruption.</p>
                 </Card>
                 <Card className="p-8 flex flex-col justify-center">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Next Billing Date</div>
                    <p className="text-xl font-bold text-slate-900">May 3rd, 2026</p>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-2 hover:underline cursor-pointer">Manage Payment Methods</p>
                 </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {pricingPlans.map(plan => (
                   <Card key={plan.tier} className={cn(
                     "relative overflow-hidden flex flex-col p-6 transition-all hover:scale-[1.02]",
                     plan.featured ? "border-emerald-500 shadow-xl shadow-emerald-50" : "border-slate-100"
                   )}>
                      {plan.featured && (
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl">Best Value</div>
                      )}
                      <div className="mb-6">
                        <h4 className="text-lg font-black text-slate-900">{plan.tier}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-tight">{plan.desc}</p>
                      </div>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-[10px] font-bold text-slate-400">KES</span>
                        <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                        <span className="text-[10px] font-bold text-slate-400">/mo</span>
                      </div>
                      <ul className="space-y-2 mb-8 flex-1">
                        {plan.features.map(f => (
                          <li key={f} className="text-[11px] font-bold text-slate-500 flex items-center gap-2 italic">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {f}
                          </li>
                        ))}
                      </ul>
                      <Button className={cn(
                        "w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest",
                        plan.featured ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900"
                      )}>
                        Upgrade
                      </Button>
                   </Card>
                 ))}
              </div>
            </div>
          )}

          {activeTab !== 'Business Profile' && activeTab !== 'Subscription' && (
            <Card className="py-20 flex flex-col items-center justify-center text-center">
              <SettingsIcon className="w-12 h-12 text-slate-200 mb-4" />
              <CardTitle>Coming Soon</CardTitle>
              <p className="text-slate-500 mt-2">The {activeTab} section is currently under development.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active ? "bg-white shadow-sm border border-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100/50"
      )}
    >
       <div className="flex items-center gap-3">
         <div className={cn("w-5 h-5", active ? "text-emerald-600" : "text-slate-400")}>{icon}</div>
         {label}
       </div>
       <ChevronRight className={cn("w-4 h-4 text-slate-300", active ? "opacity-100" : "opacity-0")} />
    </button>
  );
}

import { cn } from '../lib/utils';
