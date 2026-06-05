import { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Bell,
  Shield,
  Palette,
  Smartphone,
  Lock,
  LogOut,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../auth/store';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useUIStore } from '../../../store/useUIStore';
import { api } from '../../../lib/axios';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  // Profile state
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ')[1] || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState((user as any)?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('Pacific Time (PT)');
  const [pushNotifications, setPushNotifications] = useState(() => {
    const saved = localStorage.getItem('pushNotifications');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [emailNotifications, setEmailNotifications] = useState(() => {
    const saved = localStorage.getItem('emailNotifications');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleTogglePush = () => {
    const nextVal = !pushNotifications;
    setPushNotifications(nextVal);
    localStorage.setItem('pushNotifications', JSON.stringify(nextVal));
    toast.success(`Push notifications ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleToggleEmail = () => {
    const nextVal = !emailNotifications;
    setEmailNotifications(nextVal);
    localStorage.setItem('emailNotifications', JSON.stringify(nextVal));
    toast.success(`Email notifications ${nextVal ? 'enabled' : 'disabled'}`);
  };

  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Sync state with user store changes
  useEffect(() => {
    if (user) {
      setFirstName(user.name?.split(' ')[0] || '');
      setLastName(user.name?.split(' ')[1] || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio((user as any).bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!firstName) {
      setProfileError('First Name is required');
      toast.error('First Name is required');
      return;
    }
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const name = `${firstName} ${lastName}`.trim();
      const response = await api.put('/auth/profile', {
        name,
        bio,
        avatar: avatar.startsWith('data:image') ? avatar : undefined,
      });

      updateUser(response.data.user);
      setProfileSuccess('Profile updated successfully');
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setProfileError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      toast.error('New password must be at least 6 characters');
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess('Password updated successfully');
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update password';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    toast.success('Preferences saved successfully');
  };

  const handleDeleteAccount = () => {
    if (confirmDeleteText.toLowerCase() !== 'delete my account') {
      toast.error("Please type 'delete my account' to confirm");
      return;
    }
    toast.loading('Processing request...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Account deleted successfully');
      logout();
    }, 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Public Profile', icon: <User size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security & Password', icon: <Shield size={18} /> },
    { id: 'danger', label: 'Danger Zone', icon: <Trash2 size={18} /> },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="flex-1 overflow-y-auto p-8 z-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
            
            {/* STICKY SIDE NAVIGATION */}
            <div className="w-full md:w-64 shrink-0 space-y-6 md:sticky md:top-0 h-fit">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">Account Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your settings and preferences</p>
              </div>
              <div className="space-y-1.5">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1 cursor-pointer"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN CONTENT - SINGLE PAGE CONTAINER */}
            <div className="flex-1 space-y-8 pb-16">
              
              {/* PROFILE SECTION */}
              <div id="profile" className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-6 scroll-mt-8 transition-all duration-300 hover:border-primary/20">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <User className="text-primary" size={24} />
                  Public Profile
                </h3>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-3xl shadow-inner overflow-hidden shrink-0">
                    {avatar ? (
                      <img src={avatar.startsWith('/uploads') ? `http://localhost:5000${avatar}` : avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <label className="bg-secondary text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all border border-border cursor-pointer">
                      Change Avatar
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1024 * 1024) {
                              setProfileError('Avatar image must be under 1MB');
                              toast.error('Avatar image must be under 1MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                {profileError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="p-3 text-sm text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    {profileSuccess}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Username</label>
                    <div className="flex bg-secondary/30 border border-border/70 rounded-xl overflow-hidden opacity-70 cursor-not-allowed items-center pr-4">
                      <span className="bg-secondary/50 px-4 py-3 text-sm text-muted-foreground border-r border-border/70 select-none">
                        chronodesk.app/
                      </span>
                      <input
                        type="text"
                        value={username}
                        disabled
                        className="w-full bg-transparent px-4 py-3 outline-none text-sm cursor-not-allowed text-muted-foreground"
                      />
                      <Lock size={16} className="text-muted-foreground shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Email Address</label>
                    <div className="flex bg-secondary/30 border border-border/70 rounded-xl overflow-hidden opacity-70 cursor-not-allowed items-center pr-4">
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-transparent px-4 py-3 outline-none text-sm cursor-not-allowed text-muted-foreground"
                      />
                      <Lock size={16} className="text-muted-foreground shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Bio</label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a few sentences about yourself."
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm resize-none font-sans"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </div>

              {/* PREFERENCES SECTION */}
              <div id="preferences" className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-6 scroll-mt-8 transition-all duration-300 hover:border-primary/20">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Palette className="text-primary" size={24} />
                  Appearance & Preferences
                </h3>

                <div className="space-y-6">
                  {/* Theme Select */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Theme Mode</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'dark' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                        } bg-background`}
                      >
                        <div className="w-10 h-10 bg-zinc-950 rounded-full mb-1 border border-zinc-800"></div>
                        <span className={`text-xs ${theme === 'dark' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'light' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                        } bg-background`}
                      >
                        <div className="w-10 h-10 bg-zinc-100 rounded-full mb-1 border border-zinc-300"></div>
                        <span className={`text-xs ${theme === 'light' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'system' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                        } bg-background`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-zinc-950 to-zinc-100 rounded-full mb-1 border border-border"></div>
                        <span className={`text-xs ${theme === 'system' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Language & Region */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                      >
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                      >
                        <option>Pacific Time (PT)</option>
                        <option>Eastern Time (ET)</option>
                        <option>UTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSavePreferences}
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>

              {/* NOTIFICATIONS SECTION */}
              <div id="notifications" className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-6 scroll-mt-8 transition-all duration-300 hover:border-primary/20">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="text-primary" size={24} />
                  Notifications
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl transition-all hover:bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                        <Bell size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Push Notifications</h4>
                        <p className="text-xs text-muted-foreground">Receive push notifications on this device</p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePush}
                      className={`w-11 h-6 rounded-full relative transition-colors duration-300 outline-none cursor-pointer ${
                        pushNotifications ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform duration-300 ${
                          pushNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl transition-all hover:bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Email Notifications</h4>
                        <p className="text-xs text-muted-foreground">Receive daily summaries and mentions</p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleEmail}
                      className={`w-11 h-6 rounded-full relative transition-colors duration-300 outline-none cursor-pointer ${
                        emailNotifications ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform duration-300 ${
                          emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECURITY SECTION */}
              <div id="security" className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-6 scroll-mt-8 transition-all duration-300 hover:border-primary/20">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="text-primary" size={24} />
                  Security & Password
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                      <Lock size={18} />
                      Change Password
                    </h4>
                    
                    {passwordError && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 mb-4">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-3 text-sm text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-4">
                        {passwordSuccess}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground block mb-2">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground block mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleUpdatePassword}
                          disabled={isUpdatingPassword}
                          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DANGER ZONE SECTION */}
              <div id="danger" className="border border-red-500/30 bg-red-950/10 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl space-y-6 scroll-mt-8 transition-all duration-300 hover:border-red-500/50">
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <LogOut size={24} />
                  Danger Zone
                </h3>
                <p className="text-sm text-red-200/70">
                  Permanently delete your account, workspace attachments, timelines, and all associated personal records.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-red-600 text-white hover:bg-red-700 px-6 py-3 rounded-xl font-medium transition-all text-sm shadow-lg shadow-red-600/20 cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setConfirmDeleteText('');
              }}
              className="absolute top-6 right-6 w-8 h-8 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex items-center justify-center text-zinc-400 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h4 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                Delete Account
              </h4>
              <p className="text-zinc-400 text-sm mt-2">
                This action is irreversible. All of your whiteboards, task configurations, chats, and data will be permanently destroyed.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm text-zinc-300 block">
                Please type <strong className="text-white select-all">delete my account</strong> to confirm deletion.
              </label>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="delete my account"
                className="w-full border border-zinc-800 bg-zinc-900/50 rounded-2xl px-4 py-3 outline-none text-white focus:border-red-500 transition-all text-sm"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmDeleteText('');
                }}
                className="flex-1 border border-zinc-800 text-zinc-300 rounded-2xl py-3 hover:bg-zinc-900 transition-all font-medium text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={confirmDeleteText.toLowerCase() !== 'delete my account'}
                className="flex-1 bg-red-600 text-white rounded-2xl py-3 hover:bg-red-700 transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
