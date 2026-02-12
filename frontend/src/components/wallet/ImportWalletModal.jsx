import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Upload, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useWalletStore } from '../../store/walletStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ImportWalletModal({ open, onClose }) {
  const navigate = useNavigate();
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importType, setImportType] = useState('seed');
  const { importWallet } = useWalletStore();

  const resetState = () => {
    setWalletName('');
    setMnemonic('');
    setPrivateKey('');
    setPassword('');
    setConfirmPassword('');
    setImportType('seed');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImport = () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      if (importType === 'seed') {
        if (!mnemonic.trim()) {
          toast.error('Please enter your seed phrase');
          return;
        }
        importWallet(mnemonic, walletName || 'Imported Wallet', password);
      } else {
        toast.error('Private key import coming soon. Please use seed phrase.');
        return;
      }
      
      toast.success('Wallet imported successfully!');
      handleClose();
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to import wallet');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-dark-card border-dark-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-rajdhani text-2xl text-white">
            Import Wallet
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          <Tabs value={importType} onValueChange={setImportType} className="w-full">
            <TabsList className="w-full bg-dark-bg border border-dark-border">
              <TabsTrigger 
                value="seed" 
                className="flex-1 data-[state=active]:bg-xrp-blue/20 data-[state=active]:text-xrp-blue"
              >
                <Upload size={16} className="mr-2" />
                Seed Phrase
              </TabsTrigger>
              <TabsTrigger 
                value="key" 
                className="flex-1 data-[state=active]:bg-xrp-blue/20 data-[state=active]:text-xrp-blue"
              >
                <Key size={16} className="mr-2" />
                Private Key
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seed" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Seed Phrase</label>
                <Textarea
                  data-testid="import-mnemonic-input"
                  placeholder="Enter your 12 or 24 word seed phrase"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue min-h-[100px] font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Separate words with spaces
                </p>
              </div>
            </TabsContent>

            <TabsContent value="key" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Private Key</label>
                <Input
                  data-testid="import-privatekey-input"
                  type="password"
                  placeholder="Enter your private key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 font-mono"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Wallet Name (Optional)</label>
            <Input
              data-testid="import-wallet-name"
              placeholder="Imported Wallet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">New Password</label>
            <div className="relative">
              <Input
                data-testid="import-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Confirm Password</label>
            <Input
              data-testid="import-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
            />
          </div>

          <Button
            data-testid="import-wallet-submit"
            onClick={handleImport}
            disabled={(!mnemonic && !privateKey) || !password || !confirmPassword}
            className="w-full h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold text-lg shadow-glow"
          >
            Import Wallet
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
