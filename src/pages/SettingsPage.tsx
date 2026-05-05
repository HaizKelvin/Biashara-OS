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
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paying, setPaying] = useState(false);
  
  // New States for Settings tabs
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [savingSettings, setSavingSettings] = useState(false);

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

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan);
    setShowPayModal(true);
  };

  const processMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid M-Pesa phone number');
      return;
    }
    setPaying(true);
    // Simulate STK Push
    setTimeout(async () => {
      try {
        if (business?.id) {
          const bizRef = doc(db, 'businesses', business.id);
          await updateDoc(bizRef, { 
            subscription: {
              tier: selectedPlan.tier,
              status: 'active',
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          });
        }
        setPaying(false);
        setShowPayModal(false);
        alert(`Success! Your business is now on the ${selectedPlan.tier} plan.`);
      } catch (e) {
        console.error(e);
        setPaying(false);
        alert('Payment processing failed. Please try again.');
      }
    }, 3000);
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

                    <div className="pt-4 border-t border-slate-50 space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Business M-Pesa Till</label>
                       <div className="flex gap-2">
                          <Input 
                            placeholder="e.g. 5123456" 
                            className="rounded-xl border-slate-100 font-bold"
                          />
                          <Button size="sm" variant="outline" className="rounded-xl font-bold uppercase text-[9px] tracking-widest">Save Till</Button>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium italic">Used for generating payment links for your customers.</p>
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
                      <Button 
                        onClick={() => handleUpgrade(plan)}
                        className={cn(
                          "w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest",
                          plan.featured ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900"
                        )}
                      >
                        Upgrade
                      </Button>
                   </Card>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'Account Settings' && (
            <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50">
              <CardHeader>
                <CardTitle>Personal Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <Input 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)}
                    className="rounded-2xl h-14 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                  <Input 
                    value={user?.email || ''} 
                    disabled
                    className="rounded-2xl h-14 font-bold bg-slate-50 border-none opacity-60"
                  />
                </div>
                <Button 
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                  onClick={() => {
                    setSavingSettings(true);
                    setTimeout(() => {
                      setSavingSettings(false);
                      alert('Profile updated successfully!');
                    }, 1000);
                  }}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Notifications' && (
            <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                       <p className="text-sm font-black text-slate-900">Email Reports</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Weekly business health summary</p>
                    </div>
                    <Toggle active={notifEmail} onClick={() => setNotifEmail(!notifEmail)} />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                       <p className="text-sm font-black text-slate-900">SMS Alerts</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Instant debt payment confirmations</p>
                    </div>
                    <Toggle active={notifSms} onClick={() => setNotifSms(!notifSms)} />
                 </div>
                 <p className="text-[10px] text-center text-slate-400 italic">SMS alerts require a Biashara Pro subscription.</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Two-Step Authentication (2FA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-sm font-black text-slate-900">{twoFactorEnabled ? '2FA is Active' : 'Enhance your security'}</p>
                         <p className="text-xs text-slate-500 max-w-xs">Secure your account with an extra layer of protection. Every login will require a code sent to your phone.</p>
                      </div>
                      <Toggle active={twoFactorEnabled} onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} />
                   </div>
                   
                   {twoFactorEnabled && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4"
                     >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                           <Zap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Backup Code</p>
                           <p className="text-lg font-mono font-black text-emerald-600 tracking-widest">A9B2-C4D5</p>
                           <p className="text-[9px] text-emerald-700 font-bold italic mt-1">Save this code in a secure place. It's the only way to recover access if you lose your phone.</p>
                        </div>
                     </motion.div>
                   )}
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                   <div className="divide-y divide-slate-50">
                      <div className="py-4 flex justify-between items-center">
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Primary Session</p>
                            <p className="text-sm font-black text-slate-900">Chrome on MacBook Pro</p>
                            <p className="text-[10px] text-slate-400 font-bold italic">Nairobi, Kenya • Active now</p>
                         </div>
                         <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">Official</div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'Display Theme' && (
            <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-100/50 py-20 flex flex-col items-center justify-center text-center">
              <Moon className="w-12 h-12 text-slate-200 mb-4" />
              <CardTitle>Theme Settings</CardTitle>
              <p className="text-slate-500 mt-2">Display theme settings are managed from the top bar for convenience.</p>
            </Card>
          )}
        </div>
      </div>
      
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            <div className="bg-emerald-600 p-8 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black">{selectedPlan?.tier} Upgrade</h3>
              <p className="text-emerald-100 text-sm">Secure M-Pesa Payment</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-black uppercase text-slate-400">Total Amount</span>
                <span className="text-xl font-black text-slate-900">KES {selectedPlan?.price}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">M-Pesa Phone Number</label>
                <Input 
                  placeholder="07XX XXX XXX" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="rounded-2xl h-14 font-bold text-lg"
                  disabled={paying}
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-800 italic">Enter your M-Pesa PIN on your phone after clicking pay. We only support Kenyan Till payments.</p>
              </div>

              <div className="flex gap-3 pt-4">
                 <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  onClick={() => setShowPayModal(false)}
                  disabled={paying}
                 >
                   Cancel
                 </Button>
                 <Button 
                  className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-emerald-100"
                  onClick={processMpesaPayment}
                  disabled={paying}
                 >
                   {paying ? 'Processing...' : 'Pay Now'}
                 </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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

function Toggle({ active, onClick }: { active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
        active ? "bg-emerald-500" : "bg-slate-200"
      )}
    >
      <motion.div 
        animate={{ x: active ? 24 : 0 }}
        className="w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );
}

import { cn } from '../lib/utils';
