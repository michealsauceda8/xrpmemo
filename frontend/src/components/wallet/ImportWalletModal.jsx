import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Upload, Key, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import { validateMnemonic } from '../../lib/wallet';
import { toast } from 'sonner';

export default function ImportWalletModal({ open, onClose }) {
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importType, setImportType] = useState('seed');
  const [isImporting, setIsImporting] = useState(false);
  
  const { importWallet } = useWalletStore();
  const { token } = useAuthStore();

  const resetState = () => {
    setWalletName('');
    setMnemonic('');
    setPrivateKey('');
    setPassword('');
    setConfirmPassword('');
    setImportType('seed');
    setIsImporting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImport = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsImporting(true);

    try {
      if (importType === 'seed') {
        if (!mnemonic.trim()) {
          toast.error('Please enter your seed phrase');
          setIsImporting(false);
          return;
        }
        
        // Validate mnemonic
        const trimmed = mnemonic.trim().toLowerCase();
        if (!validateMnemonic(trimmed)) {
          toast.error('Invalid seed phrase. Please check and try again.');
          setIsImporting(false);
          return;
        }
        
        await importWallet(trimmed, walletName || 'Imported Wallet', password, token);
        toast.success('Wallet imported with real addresses!');
        handleClose();
      } else {
        toast.error('Private key import coming soon. Please use seed phrase.');
        setIsImporting(false);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to import wallet');
      setIsImporting(false);
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
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
            <AlertTriangle className="text-warning shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-warning font-medium text-sm">Security Notice</p>
              <p className="text-xs text-slate-400 mt-1">
                Never share your seed phrase. We will derive real blockchain addresses from it.
              </p>
            </div>
          </div>

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
                <label className="text-sm text-slate-400">Seed Phrase (12 or 24 words)</label>
                <Textarea
                  data-testid="import-mnemonic-input"
                  placeholder="Enter your seed phrase words separated by spaces"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue min-h-[100px] font-mono text-sm"
                />
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
                <p className="text-xs text-slate-500">Coming soon - use seed phrase for now</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Wallet Name</label>
            <Input
              data-testid="import-wallet-name"
              placeholder="Imported Wallet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Encryption Password</label>
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
            disabled={(!mnemonic && !privateKey) || !password || !confirmPassword || isImporting}
            className="w-full h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold text-lg shadow-glow"
          >
            {isImporting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Wallet'
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
