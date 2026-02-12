import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  LogOut, 
  Save, 
  Eye, 
  EyeOff,
  Shield,
  Wallet,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, updatePassword, logout } = useAuthStore();
  const { wallets, clearWallets } = useWalletStore();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ name });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    clearWallets();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="font-rajdhani text-4xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card border-dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-rajdhani text-white">
                <User size={20} className="text-xrp-blue" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Email</label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-dark-bg/50 border-dark-border h-12 text-slate-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Name</label>
                <Input
                  data-testid="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
                />
              </div>
              
              <Button
                data-testid="save-profile-btn"
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="bg-xrp-blue hover:bg-xrp-blue-dark text-white"
              >
                <Save size={18} className="mr-2" />
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-rajdhani text-white">
                <Lock size={20} className="text-xrp-blue" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Current Password</label>
                <div className="relative">
                  <Input
                    data-testid="current-password"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-400">New Password</label>
                <Input
                  data-testid="new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Confirm New Password</label>
                <Input
                  data-testid="confirm-new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
                />
              </div>
              
              <Button
                data-testid="update-password-btn"
                onClick={handleUpdatePassword}
                disabled={savingPassword || !currentPassword || !newPassword}
                className="bg-xrp-blue hover:bg-xrp-blue-dark text-white"
              >
                <Shield size={18} className="mr-2" />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-rajdhani text-white">
                <Wallet size={20} className="text-xrp-blue" />
                Wallets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-bg/50 border border-dark-border">
                <div>
                  <p className="text-white font-medium">{wallets.length} Wallet{wallets.length !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-slate-500">
                    {wallets.filter(w => w.isImported).length} imported, {wallets.filter(w => !w.isImported).length} created
                  </p>
                </div>
                <ChevronRight size={20} className="text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-dark-border border-error/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Sign Out</p>
                  <p className="text-sm text-slate-500">Log out of your account</p>
                </div>
                <Button
                  data-testid="logout-btn"
                  onClick={handleLogout}
                  variant="destructive"
                  className="bg-error/20 hover:bg-error/30 text-error border border-error/30"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
