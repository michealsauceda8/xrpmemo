import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  CreditCard, 
  ExternalLink, 
  Shield, 
  Clock,
  DollarSign,
  Info
} from 'lucide-react';
import { useWalletStore, CHAINS } from '../store/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PROVIDERS = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    logo: '🌙',
    color: '#7B61FF',
    fees: '4.5%',
    description: 'Fast & Reliable',
    paymentMethods: ['Card', 'Apple Pay', 'Bank'],
  },
  {
    id: 'mercuryo',
    name: 'Mercuryo',
    logo: '☿️',
    color: '#00D4AA',
    fees: '3.95%',
    description: 'Low Fees',
    paymentMethods: ['Card', 'Bank Transfer'],
  },
  {
    id: 'transak',
    name: 'Transak',
    logo: '🔷',
    color: '#0066FF',
    fees: '5.5%',
    description: 'Global Coverage',
    paymentMethods: ['Card', 'Bank', 'Apple Pay'],
  },
];

export default function Buy() {
  const { getActiveWallet } = useWalletStore();
  const activeWallet = getActiveWallet();
  const [amount, setAmount] = useState('100');
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Fetch on-ramp config
  const { data: configData } = useQuery({
    queryKey: ['onrampConfig'],
    queryFn: async () => {
      const response = await axios.get(`${API}/onramp/config`);
      return response.data;
    },
  });

  // Fetch XRP price
  const { data: priceData } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const response = await axios.get(`${API}/prices`);
      return response.data;
    },
  });

  const xrpPrice = priceData?.prices?.xrp || 2.15;
  const estimatedXrp = parseFloat(amount || 0) / xrpPrice;
  const xrpAddress = activeWallet?.addresses?.XRP || '';

  const openProviderPopup = (providerId) => {
    if (!activeWallet) {
      toast.error('Please create or import a wallet first');
      return;
    }

    if (!amount || parseFloat(amount) < 15) {
      toast.error('Minimum purchase amount is $15');
      return;
    }

    const providerConfig = configData?.providers?.find(p => p.id === providerId);
    let url = '';

    switch (providerId) {
      case 'moonpay':
        url = `https://buy.moonpay.com/?currencyCode=XRP&walletAddress=${encodeURIComponent(xrpAddress)}&baseCurrencyAmount=${amount}&baseCurrencyCode=USD`;
        break;
      case 'mercuryo':
        url = `https://exchange.mercuryo.io/?widget_id=34c04adf-d04a-42de-a4aa-609a302b24bf&currency=XRP&fiat_currency=USD&fiat_amount=${amount}&address=${encodeURIComponent(xrpAddress)}&type=buy&network=RIPPLE`;
        break;
      case 'transak':
        url = `https://global.transak.com/?apiKey=a5550b99-8c19-4764-b888-7ba36ac237ea&fiatCurrency=USD&defaultFiatAmount=${amount}&cryptoCurrencyCode=XRP&walletAddress=${encodeURIComponent(xrpAddress)}&network=XRP&themeColor=00AEEF&hideMenu=true`;
        break;
      default:
        return;
    }

    // Open centered popup
    const width = 450;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      url,
      `${providerId}_popup`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=no`
    );

    toast.success(`Opening ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}...`, {
      description: 'Complete your purchase in the popup window',
    });
  };

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="glass-card p-12 max-w-md">
          <CreditCard size={48} className="text-xrp-blue mx-auto mb-4" />
          <h2 className="font-rajdhani text-2xl font-bold text-white mb-3">Connect Wallet</h2>
          <p className="text-slate-400">Create or import a wallet to buy XRP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="buy-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-rajdhani text-4xl font-bold text-white">Buy XRP</h1>
        <p className="text-slate-400 mt-1">Purchase XRP with card or bank transfer</p>
      </div>

      {/* Amount Input Card */}
      <Card className="glass-card border-dark-border mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-xrp-blue/20 flex items-center justify-center">
              <img 
                src={CHAINS.XRP.logo} 
                alt="XRP" 
                className="w-8 h-8"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-rajdhani text-xl font-bold text-white">XRP</h3>
              <p className="text-slate-400 text-sm">XRP Ledger</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">${xrpPrice.toFixed(4)}</p>
              <p className="text-xs text-slate-500">Current Price</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Amount (USD)</label>
              <div className="relative">
                <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  data-testid="buy-amount-input"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-14 pl-10 text-xl font-semibold"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {['50', '100', '250', '500'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === val 
                        ? 'bg-xrp-blue text-white' 
                        : 'bg-dark-bg border border-dark-border text-slate-400 hover:border-xrp-blue/50'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-bg/50 border border-dark-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">You'll receive (approx.)</span>
                <span className="font-rajdhani text-xl font-bold text-xrp-blue">
                  {estimatedXrp.toFixed(2)} XRP
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Receiving Address</span>
                <code className="text-slate-400 font-mono">
                  {xrpAddress.slice(0, 8)}...{xrpAddress.slice(-6)}
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Selection */}
      <h2 className="font-rajdhani text-xl font-semibold text-white mb-4">Select Provider</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PROVIDERS.map((provider, idx) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <button
              data-testid={`provider-${provider.id}-btn`}
              onClick={() => openProviderPopup(provider.id)}
              className="provider-card w-full text-left group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${provider.color}20` }}
                >
                  {provider.logo}
                </div>
                <div>
                  <h3 className="font-rajdhani font-bold text-white group-hover:text-xrp-blue transition-colors">
                    {provider.name}
                  </h3>
                  <p className="text-xs text-slate-500">{provider.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Fees</span>
                  <span className="text-white font-medium">{provider.fees}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {provider.paymentMethods.map((method) => (
                    <span 
                      key={method}
                      className="px-2 py-0.5 rounded text-xs bg-dark-bg text-slate-400"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-border flex items-center justify-between">
                <span className="text-xs text-slate-500">Buy now</span>
                <ExternalLink size={16} className="text-slate-500 group-hover:text-xrp-blue transition-colors" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-dark-border">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield size={20} className="text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Secure Payments</p>
              <p className="text-xs text-slate-500 mt-1">
                All providers are regulated and support secure payment methods
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-dark-border">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Fast Delivery</p>
              <p className="text-xs text-slate-500 mt-1">
                XRP typically arrives within 5-30 minutes after purchase
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 rounded-xl bg-dark-bg/50 border border-dark-border">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">
            You will be redirected to an external provider to complete your purchase. 
            Fees and exchange rates are determined by the provider. 
            Please review all details before confirming your transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
