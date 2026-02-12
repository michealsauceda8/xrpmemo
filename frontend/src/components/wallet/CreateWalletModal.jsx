import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useWalletStore } from '../../store/walletStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CreateWalletModal({ open, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [walletName, setWalletName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [wordInputs, setWordInputs] = useState({});
  const [verifyIndices, setVerifyIndices] = useState([]);
  const { createWallet } = useWalletStore();

  const resetState = () => {
    setStep(1);
    setWalletName('');
    setPassword('');
    setConfirmPassword('');
    setMnemonic('');
    setWordInputs({});
    setVerifyIndices([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreateWallet = () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const { wallet, mnemonic: newMnemonic } = createWallet(walletName || 'My Wallet', password);
    setMnemonic(newMnemonic);
    
    // Select 3 random indices for verification
    const words = newMnemonic.split(' ');
    const indices = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * words.length);
      if (!indices.includes(idx)) indices.push(idx);
    }
    setVerifyIndices(indices.sort((a, b) => a - b));
    
    setStep(2);
  };

  const copyMnemonic = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      toast.success('Seed phrase copied to clipboard');
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = mnemonic;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      toast.success('Seed phrase copied to clipboard');
    }
  };

  const handleVerifyWords = () => {
    const words = mnemonic.split(' ');
    let allCorrect = true;
    
    verifyIndices.forEach((idx) => {
      if (wordInputs[idx]?.toLowerCase().trim() !== words[idx]) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      toast.success('Wallet created successfully!');
      handleClose();
      navigate('/dashboard');
    } else {
      toast.error('Words do not match. Please try again.');
    }
  };

  const skipVerification = () => {
    toast.success('Wallet created! Remember to backup your seed phrase.');
    handleClose();
    navigate('/dashboard');
  };

  const mnemonicWords = mnemonic.split(' ');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-dark-card border-dark-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-rajdhani text-2xl text-white">
            {step === 1 && 'Create New Wallet'}
            {step === 2 && 'Backup Seed Phrase'}
            {step === 3 && 'Verify Seed Phrase'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Wallet Name</label>
                <Input
                  data-testid="wallet-name-input"
                  placeholder="My Wallet"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Password</label>
                <div className="relative">
                  <Input
                    data-testid="password-input"
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
                  data-testid="confirm-password-input"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12"
                />
              </div>

              <Button
                data-testid="create-wallet-submit"
                onClick={handleCreateWallet}
                disabled={!password || !confirmPassword}
                className="w-full h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold text-lg shadow-glow"
              >
                Create Wallet
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
                <AlertTriangle className="text-warning shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-warning font-medium">Important</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Write down these 12 words in order and store them safely. Never share your seed phrase with anyone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-dark-bg/50 border border-dark-border">
                {mnemonicWords.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-dark-card">
                    <span className="text-xs text-slate-500 w-5">{idx + 1}.</span>
                    <span className="font-mono text-sm text-white">{word}</span>
                  </div>
                ))}
              </div>

              <Button
                data-testid="copy-mnemonic-btn"
                onClick={copyMnemonic}
                variant="outline"
                className="w-full h-12 border-slate-700 text-slate-300 hover:bg-white/5"
              >
                <Copy size={18} className="mr-2" />
                Copy Seed Phrase
              </Button>

              <div className="flex gap-3">
                <Button
                  data-testid="skip-verify-btn"
                  onClick={skipVerification}
                  variant="outline"
                  className="flex-1 h-12 border-slate-700 text-slate-400 hover:bg-white/5"
                >
                  Skip
                </Button>
                <Button
                  data-testid="continue-verify-btn"
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold shadow-glow"
                >
                  Verify Backup
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-xrp-blue/10 border border-xrp-blue/30">
                <Shield className="text-xrp-blue shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-xrp-blue font-medium">Verify Your Backup</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Enter the words at positions {verifyIndices.map(i => i + 1).join(', ')} to verify you've saved your seed phrase.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {verifyIndices.map((idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-sm text-slate-400">Word #{idx + 1}</label>
                    <Input
                      data-testid={`verify-word-${idx}`}
                      placeholder={`Enter word #${idx + 1}`}
                      value={wordInputs[idx] || ''}
                      onChange={(e) => setWordInputs({ ...wordInputs, [idx]: e.target.value })}
                      className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 h-12 border-slate-700 text-slate-400 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  data-testid="verify-mnemonic-btn"
                  onClick={handleVerifyWords}
                  className="flex-1 h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold shadow-glow"
                >
                  Verify & Complete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
