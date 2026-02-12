import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowDownUp, 
  ChevronDown, 
  Settings2, 
  Loader2,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useWalletStore, CHAINS } from '../store/walletStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SWAP_TOKENS = [
  { symbol: 'XRP', name: 'XRP', chain: 'XRP', logo: CHAINS.XRP.logo },
  { symbol: 'ETH', name: 'Ethereum', chain: 'ETH', logo: CHAINS.ETH.logo },
  { symbol: 'SOL', name: 'Solana', chain: 'SOL', logo: CHAINS.SOL.logo },
  { symbol: 'BTC', name: 'Bitcoin', chain: 'BTC', logo: CHAINS.BTC.logo },
  { symbol: 'BNB', name: 'BNB', chain: 'BNB', logo: CHAINS.BNB.logo },
  { symbol: 'USDT', name: 'Tether USD', chain: 'ETH', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=025' },
  { symbol: 'USDC', name: 'USD Coin', chain: 'ETH', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=025' },
];

const formatNumber = (value, decimals = 6) => {
  if (!value) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

export default function Swap() {
  const { getActiveWallet, balances, prices } = useWalletStore();
  const activeWallet = getActiveWallet();
  
  const [fromToken, setFromToken] = useState('XRP');
  const [toToken, setToToken] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch prices
  const { data: priceData } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const response = await axios.get(`${API}/prices`);
      return response.data;
    },
  });

  // Get swap quote
  const { data: quoteData, isLoading: quoteLoading, refetch: fetchQuote } = useQuery({
    queryKey: ['swapQuote', fromToken, toToken, fromAmount],
    queryFn: async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) return null;
      const fromTokenData = SWAP_TOKENS.find(t => t.symbol === fromToken);
      const toTokenData = SWAP_TOKENS.find(t => t.symbol === toToken);
      
      const response = await axios.post(`${API}/swap/quote`, {
        from_chain: fromTokenData?.chain || 'XRP',
        to_chain: toTokenData?.chain || 'ETH',
        from_token: fromToken,
        to_token: toToken,
        amount: fromAmount,
        from_address: activeWallet?.addresses[fromTokenData?.chain] || '',
      });
      return response.data;
    },
    enabled: !!fromAmount && parseFloat(fromAmount) > 0 && !!activeWallet,
  });

  // Execute swap mutation
  const swapMutation = useMutation({
    mutationFn: async () => {
      const fromTokenData = SWAP_TOKENS.find(t => t.symbol === fromToken);
      const toTokenData = SWAP_TOKENS.find(t => t.symbol === toToken);
      
      const response = await axios.post(`${API}/swap/execute`, {
        from_chain: fromTokenData?.chain || 'XRP',
        to_chain: toTokenData?.chain || 'ETH',
        from_token: fromToken,
        to_token: toToken,
        amount: fromAmount,
        from_address: activeWallet?.addresses[fromTokenData?.chain] || '',
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Swap executed successfully!', {
        description: `TX: ${data.tx_hash.slice(0, 10)}...`,
      });
      setFromAmount('');
    },
    onError: (error) => {
      toast.error('Swap failed', {
        description: error.message,
      });
    },
  });

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
  };

  const fromTokenData = SWAP_TOKENS.find(t => t.symbol === fromToken);
  const toTokenData = SWAP_TOKENS.find(t => t.symbol === toToken);
  const fromBalance = balances[fromTokenData?.chain] || 0;
  const fromPrice = priceData?.prices?.[fromToken.toLowerCase()] || 0;
  const toPrice = priceData?.prices?.[toToken.toLowerCase()] || 0;

  const fromValueUsd = parseFloat(fromAmount || 0) * fromPrice;
  const toAmount = quoteData?.to_amount || '0';
  const toValueUsd = parseFloat(toAmount) * toPrice;

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="glass-card p-12 max-w-md">
          <h2 className="font-rajdhani text-2xl font-bold text-white mb-3">Connect Wallet</h2>
          <p className="text-slate-400">Create or import a wallet to start swapping</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto" data-testid="swap-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-rajdhani text-4xl font-bold text-white">Swap</h1>
          <p className="text-slate-400 mt-1">Cross-chain token swap</p>
        </div>
        <Button
          data-testid="swap-settings-btn"
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="text-slate-400 hover:text-white"
        >
          <Settings2 size={20} />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <Card className="glass-card border-dark-border">
            <CardContent className="p-4">
              <p className="text-sm text-slate-400 mb-3">Slippage Tolerance</p>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((val) => (
                  <Button
                    key={val}
                    variant={slippage === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSlippage(val)}
                    className={slippage === val 
                      ? 'bg-xrp-blue hover:bg-xrp-blue-dark' 
                      : 'border-slate-700 text-slate-400'
                    }
                  >
                    {val}%
                  </Button>
                ))}
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 bg-dark-bg border-dark-border h-9"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Swap Card */}
      <Card className="glass-card border-dark-border relative overflow-visible shadow-glow">
        <CardContent className="p-6 space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">From</span>
              <span className="text-xs text-slate-500">
                Balance: {formatNumber(fromBalance)} {fromToken}
              </span>
            </div>
            <div className="flex gap-3">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger 
                  data-testid="from-token-select"
                  className="w-40 bg-dark-bg border-dark-border"
                >
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <img src={fromTokenData?.logo} alt={fromToken} className="w-5 h-5" />
                      <span>{fromToken}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-border">
                  {SWAP_TOKENS.filter(t => t.symbol !== toToken).map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <img src={token.logo} alt={token.symbol} className="w-5 h-5" />
                        <span>{token.symbol}</span>
                        <span className="text-slate-500 text-xs">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Input
                  data-testid="from-amount-input"
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="bg-dark-bg border-dark-border h-12 text-right text-xl font-semibold pr-16"
                />
                <button
                  onClick={() => setFromAmount(fromBalance.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-xrp-blue hover:text-xrp-blue-light font-semibold"
                >
                  MAX
                </button>
              </div>
            </div>
            {fromAmount && (
              <p className="text-xs text-slate-500 text-right">≈ ${fromValueUsd.toFixed(2)}</p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              data-testid="swap-direction-btn"
              onClick={handleSwapTokens}
              className="swap-arrow shadow-lg"
            >
              <ArrowDownUp size={20} className="text-white" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">To</span>
            </div>
            <div className="flex gap-3">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger 
                  data-testid="to-token-select"
                  className="w-40 bg-dark-bg border-dark-border"
                >
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <img src={toTokenData?.logo} alt={toToken} className="w-5 h-5" />
                      <span>{toToken}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-border">
                  {SWAP_TOKENS.filter(t => t.symbol !== fromToken).map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <img src={token.logo} alt={token.symbol} className="w-5 h-5" />
                        <span>{token.symbol}</span>
                        <span className="text-slate-500 text-xs">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Input
                  data-testid="to-amount-display"
                  type="text"
                  placeholder="0.00"
                  value={quoteLoading ? '...' : formatNumber(parseFloat(toAmount))}
                  readOnly
                  className="bg-dark-bg border-dark-border h-12 text-right text-xl font-semibold"
                />
              </div>
            </div>
            {toAmount && parseFloat(toAmount) > 0 && (
              <p className="text-xs text-slate-500 text-right">≈ ${toValueUsd.toFixed(2)}</p>
            )}
          </div>

          {/* Quote Details */}
          {quoteData && fromAmount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-dark-bg/50 border border-dark-border space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Rate</span>
                <span className="text-white">
                  1 {fromToken} = {formatNumber(quoteData.exchange_rate)} {toToken}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Provider</span>
                <span className="text-xrp-blue">{quoteData.provider}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Route</span>
                <span className="text-slate-300 text-xs">{quoteData.route}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Est. Gas</span>
                <span className="text-slate-300">{quoteData.gas_estimate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Slippage</span>
                <span className="text-slate-300">{slippage}%</span>
              </div>
            </motion.div>
          )}

          {/* Swap Button */}
          <Button
            data-testid="execute-swap-btn"
            onClick={() => swapMutation.mutate()}
            disabled={!fromAmount || parseFloat(fromAmount) <= 0 || quoteLoading || swapMutation.isPending}
            className="w-full h-14 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-bold text-lg shadow-glow disabled:opacity-50"
          >
            {swapMutation.isPending ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Swapping...
              </>
            ) : quoteLoading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : !fromAmount ? (
              'Enter Amount'
            ) : (
              `Swap ${fromToken} for ${toToken}`
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="glass-card border-dark-border mt-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-xrp-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-300">Cross-Chain Swap</p>
              <p className="text-xs text-slate-500 mt-1">
                Swaps are routed through {quoteData?.provider || 'optimal DEX aggregators'} for the best rates. 
                Transaction may take 1-5 minutes depending on network conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
