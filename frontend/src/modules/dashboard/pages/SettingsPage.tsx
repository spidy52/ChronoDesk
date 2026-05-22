import { useState } from 'react';
import {
  User,
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Lock,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useUIStore } from '../../../store/useUIStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useUIStore();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full"></div>

      <div className="flex-1 overflow-y-auto p-8 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* SIDEBAR */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            <h2 className="text-2xl font-bold mb-6 px-4">Account Settings</h2>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium
                  ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-primary" size={24} />
                  Public Profile
                </h3>

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-3xl shadow-inner">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <button className="bg-secondary text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all border border-border">
                      Change Avatar
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name?.split(' ')[0]}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name?.split(' ')[1]}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Username</label>
                    <div className="flex bg-background border border-border rounded-xl overflow-hidden focus-within:border-primary transition-all">
                      <span className="bg-secondary px-4 py-3 text-sm text-muted-foreground border-r border-border">
                        chronodesk.app/
                      </span>
                      <input
                        type="text"
                        defaultValue={user?.username}
                        className="w-full bg-transparent px-4 py-3 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Bio</label>
                    <textarea
                      rows={4}
                      placeholder="Write a few sentences about yourself."
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Settings className="text-primary" size={24} />
                  Preferences
                </h3>

                <div className="space-y-8">
                  {/* Theme */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Palette size={18} className="text-muted-foreground" />
                      Appearance
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Customize how ChronoDesk looks on your device.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                          theme === 'dark' ? 'border-primary shadow-sm' : 'border-border hover:border-primary/50'
                        } bg-background`}
                      >
                        <div className="w-12 h-12 bg-zinc-950 rounded-full mb-2 border border-zinc-800"></div>
                        <span className={`text-sm ${theme === 'dark' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                          theme === 'light' ? 'border-primary shadow-sm' : 'border-border hover:border-primary/50'
                        } bg-background`}
                      >
                        <div className="w-12 h-12 bg-zinc-100 rounded-full mb-2 border border-zinc-300"></div>
                        <span className={`text-sm ${theme === 'light' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                          theme === 'system' ? 'border-primary shadow-sm' : 'border-border hover:border-primary/50'
                        } bg-background`}
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-zinc-950 to-zinc-100 rounded-full mb-2 border border-border"></div>
                        <span className={`text-sm ${theme === 'system' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Globe size={18} className="text-muted-foreground" />
                      Language & Region
                    </h4>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Language</label>
                        <select className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm appearance-none">
                          <option>English (US)</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Timezone</label>
                        <select className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm appearance-none">
                          <option>Pacific Time (PT)</option>
                          <option>Eastern Time (ET)</option>
                          <option>UTC</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Bell className="text-primary" size={24} />
                  Notifications
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                        <Bell size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Push Notifications</h4>
                        <p className="text-xs text-muted-foreground">Receive push notifications on this device</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Email Notifications</h4>
                        <p className="text-xs text-muted-foreground">Receive daily summaries and mentions</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Shield className="text-primary" size={24} />
                  Security
                </h3>

                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Lock size={18} className="text-muted-foreground" />
                      Change Password
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Current Password</label>
                        <input
                          type="password"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground block mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground block mb-2">Confirm Password</label>
                          <input
                            type="password"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <button className="bg-background border border-border hover:bg-secondary text-foreground px-6 py-3 rounded-xl font-medium transition-all text-sm">
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold text-red-500 flex items-center gap-2 mb-3">
                      <LogOut size={18} />
                      Danger Zone
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data.
                    </p>
                    <button className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-6 py-3 rounded-xl font-medium transition-all text-sm border border-red-500/20">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
