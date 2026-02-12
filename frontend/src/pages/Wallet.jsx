import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Copy, 
  Check, 
  QrCode, 
  Send, 
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWalletStore, CHAINS } from '../store/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value, decimals = 6) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

const truncateAddress = (address, start = 8, end = 6) => {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export default function Wallet() {
  const { wallets, getActiveWallet, balances, prices } = useWalletStore();
  const activeWallet = getActiveWallet();
  const [expandedChains, setExpandedChains] = useState(['XRP']);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Fetch balances
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['balances', activeWallet?.id],
    queryFn: async () => {
      if (!activeWallet) return null;
      const response = await axios.post(`${API}/balances/all`, activeWallet.addresses);
      return response.data;
    },
    enabled: !!activeWallet,
  });

  // Fetch prices
  const { data: priceData } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const response = await axios.get(`${API}/prices`);
      return response.data;
    },
  });

  const currentBalances = balanceData?.balances || balances;
  const currentPrices = priceData?.prices || prices;

  const copyToClipboard = async (address, chain) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(chain);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const toggleChain = (chainKey) => {
    setExpandedChains(prev => 
      prev.includes(chainKey) 
        ? prev.filter(c => c !== chainKey)
        : [...prev, chainKey]
    );
  };

  const openReceive = (chainKey) => {
    setSelectedAddress({ chain: chainKey, address: activeWallet?.addresses[chainKey] });
    setShowReceive(true);
  };

  const openSend = (chainKey) => {
    setSelectedAddress({ chain: chainKey, address: activeWallet?.addresses[chainKey] });
    setShowSend(true);
  };

  const totalValue = Object.entries(currentBalances).reduce((total, [symbol, balance]) => {
    const price = currentPrices[symbol.toLowerCase()] || 0;
    return total + (balance * price);
  }, 0);

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="glass-card p-12 max-w-md">
          <h2 className="font-rajdhani text-2xl font-bold text-white mb-3">No Wallet Found</h2>
          <p className="text-slate-400">Create or import a wallet to view your addresses</p>
        </div>
      </div>
    );
  }

  // Group chains by category
  const chainGroups = {
    primary: ['XRP'],
    evm: ['ETH', 'BNB', 'MATIC'],
    other: ['SOL', 'BTC', 'LTC', 'DOGE'],
  };

  return (
    <div className="space-y-6" data-testid="wallet-page">
      {/* Header */}
      <div>
        <h1 className="font-rajdhani text-4xl font-bold text-white">Wallet</h1>
        <p className="text-slate-400 mt-1">{activeWallet.name}</p>
      </div>

      {/* Total Balance Card */}
      <Card className="glass-card border-dark-border">
        <CardContent className="p-6">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Total Balance</p>
          <p className="font-rajdhani text-4xl font-bold text-white">{formatCurrency(totalValue)}</p>
        </CardContent>
      </Card>

      {/* XRP Section - Primary Focus */}
      <div>
        <h2 className="font-rajdhani text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <img src={CHAINS.XRP.logo} alt="XRP" className="w-6 h-6" />
          XRP Ledger
        </h2>
        <Card className="glass-card border-xrp-blue/30 card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-xrp-blue/20 flex items-center justify-center">
                  <img src={CHAINS.XRP.logo} alt="XRP" className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-white">XRP</p>
                  <p className="text-sm text-slate-400">XRP Ledger</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-rajdhani text-2xl font-bold text-white">
                  {formatNumber(currentBalances.XRP || 0)} XRP
                </p>
                <p className="text-sm text-slate-400">
                  {formatCurrency((currentBalances.XRP || 0) * (currentPrices.xrp || 0))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border mb-4">
              <code className="flex-1 text-sm text-slate-300 font-mono truncate">
                {activeWallet.addresses.XRP}
              </code>
              <button
                data-testid="copy-xrp-address"
                onClick={() => copyToClipboard(activeWallet.addresses.XRP, 'XRP')}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-xrp-blue transition-colors"
              >
                {copiedAddress === 'XRP' ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              </button>
              <a
                href={`${CHAINS.XRP.explorer}/account/${activeWallet.addresses.XRP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-xrp-blue transition-colors"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="flex gap-3">
              <Button
                data-testid="receive-xrp-btn"
                onClick={() => openReceive('XRP')}
                className="flex-1 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani"
              >
                <ArrowDownLeft size={18} className="mr-2" />
                Receive
              </Button>
              <Button
                data-testid="send-xrp-btn"
                onClick={() => openSend('XRP')}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-white/5 font-rajdhani"
              >
                <Send size={18} className="mr-2" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Other Chains */}
      <div>
        <h2 className="font-rajdhani text-xl font-semibold text-white mb-4">Other Chains</h2>
        <div className="space-y-3">
          {Object.entries(CHAINS).filter(([key]) => key !== 'XRP').map(([chainKey, chain]) => {
            const balance = currentBalances[chainKey] || 0;
            const price = currentPrices[chainKey.toLowerCase()] || 0;
            const isExpanded = expandedChains.includes(chainKey);
            
            return (
              <Card key={chainKey} className="glass-card border-dark-border card-hover overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleChain(chainKey)}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${chain.color}20` }}
                    >
                      <img src={chain.logo} alt={chain.symbol} className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{chain.symbol}</p>
                      <p className="text-xs text-slate-500">{chain.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatNumber(balance)}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(balance * price)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 border-t border-dark-border pt-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border mb-4">
                          <code className="flex-1 text-sm text-slate-300 font-mono truncate">
                            {activeWallet.addresses[chainKey]}
                          </code>
                          <button
                            data-testid={`copy-${chainKey.toLowerCase()}-address`}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(activeWallet.addresses[chainKey], chainKey);
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-xrp-blue transition-colors"
                          >
                            {copiedAddress === chainKey ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            data-testid={`receive-${chainKey.toLowerCase()}-btn`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openReceive(chainKey);
                            }}
                            size="sm"
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                          >
                            <ArrowDownLeft size={16} className="mr-2" />
                            Receive
                          </Button>
                          <Button
                            data-testid={`send-${chainKey.toLowerCase()}-btn`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openSend(chainKey);
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-700 text-slate-300 hover:bg-white/5"
                          >
                            <Send size={16} className="mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Receive Modal */}
      <Dialog open={showReceive} onOpenChange={setShowReceive}>
        <DialogContent className="bg-dark-card border-dark-border">
          <DialogHeader>
            <DialogTitle className="font-rajdhani text-xl text-white">
              Receive {selectedAddress?.chain}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="qr-container mb-6">
              <QRCodeSVG 
                value={selectedAddress?.address || ''} 
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="text-sm text-slate-400 mb-2">Your {selectedAddress?.chain} Address</p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-bg border border-dark-border w-full">
              <code className="flex-1 text-sm text-slate-300 font-mono break-all">
                {selectedAddress?.address}
              </code>
              <button
                onClick={() => copyToClipboard(selectedAddress?.address, 'modal')}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-xrp-blue"
              >
                {copiedAddress === 'modal' ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <SendModal 
        open={showSend} 
        onClose={() => setShowSend(false)} 
        chain={selectedAddress?.chain}
        fromAddress={selectedAddress?.address}
        balance={currentBalances[selectedAddress?.chain] || 0}
      />
    </div>
  );
}

function SendModal({ open, onClose, chain, fromAddress, balance }) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!toAddress || !amount) {
      toast.error('Please fill all fields');
      return;
    }
    
    setSending(true);
    // Simulate send - in production, sign and broadcast transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(`Transaction submitted! (Demo mode)`);
    setSending(false);
    onClose();
    setToAddress('');
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card border-dark-border">
        <DialogHeader>
          <DialogTitle className="font-rajdhani text-xl text-white">
            Send {chain}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">From</label>
            <div className="p-3 rounded-xl bg-dark-bg border border-dark-border">
              <code className="text-sm text-slate-300 font-mono">
                {truncateAddress(fromAddress, 12, 8)}
              </code>
              <p className="text-xs text-slate-500 mt-1">Balance: {formatNumber(balance)} {chain}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">To Address</label>
            <Input
              data-testid="send-to-address"
              placeholder={`Enter ${chain} address`}
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Amount</label>
            <div className="relative">
              <Input
                data-testid="send-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pr-20"
              />
              <button
                onClick={() => setAmount(balance.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-xrp-blue hover:text-xrp-blue-light"
              >
                MAX
              </button>
            </div>
          </div>

          <Button
            data-testid="send-confirm-btn"
            onClick={handleSend}
            disabled={sending || !toAddress || !amount}
            className="w-full h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold shadow-glow"
          >
            {sending ? 'Sending...' : `Send ${chain}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
