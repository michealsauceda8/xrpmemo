import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useWalletStore, CHAIN_CONFIG } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value, decimals = 4) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-xs">
          {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' })}
        </p>
        <p className="text-xrp-blue font-semibold text-lg mt-1">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Primary chains to show
const PRIMARY_CHAINS = ['xrp', 'ethereum', 'bitcoin', 'solana', 'bsc', 'polygon', 'arbitrum', 'avalanche'];

export default function Dashboard() {
  const { getActiveWallet, balances, prices, fetchBalances, fetchPrices, isLoading } = useWalletStore();
  const { token } = useAuthStore();
  const activeWallet = getActiveWallet();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch XRP price history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['priceHistory', 'xrp'],
    queryFn: async () => {
      const response = await axios.get(`${API}/prices/history/xrp?days=7`);
      return response.data;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBalances(token), fetchPrices()]);
    setRefreshing(false);
  };

  // Calculate totals
  const calculateTotalValue = () => {
    let total = 0;
    Object.entries(balances).forEach(([chain, balance]) => {
      const config = CHAIN_CONFIG[chain];
      if (config) {
        const symbol = config.symbol.toLowerCase();
        const price = prices[symbol] || 0;
        total += balance * price;
      }
    });
    return total;
  };

  const totalValue = calculateTotalValue();
  const xrpBalance = balances.xrp || 0;
  const xrpPrice = prices.xrp || 0;
  const xrpValue = xrpBalance * xrpPrice;

  // Format chart data
  const chartData = historyData?.prices?.map(p => ({
    timestamp: p.timestamp,
    price: p.price
  })) || [];

  // Get assets for display
  const getAssets = () => {
    return PRIMARY_CHAINS
      .filter(chain => CHAIN_CONFIG[chain])
      .map(chain => {
        const config = CHAIN_CONFIG[chain];
        const balance = balances[chain] || 0;
        const symbol = config.symbol.toLowerCase();
        const price = prices[symbol] || 0;
        
        return {
          id: chain,
          name: config.name,
          symbol: config.symbol,
          logo: config.logo,
          color: config.color,
          balance,
          price,
          value: balance * price,
        };
      });
  };

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-xrp-blue to-xrp-navy flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Wallet size={40} className="text-white" />
          </div>
          <h2 className="font-rajdhani text-3xl font-bold text-white mb-3">Welcome to XRP Nexus</h2>
          <p className="text-slate-400 mb-6">
            Create or import a wallet to start managing your multi-chain portfolio
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-rajdhani text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time portfolio overview</p>
        </div>
        <Button
          data-testid="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-dark-border hover:bg-white/5"
        >
          {refreshing ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={18} className="mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Portfolio Value Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card className="lg:col-span-2 glass-card border-dark-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-normal uppercase tracking-wider">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 mb-6">
              {isLoading ? (
                <Skeleton className="h-12 w-48 bg-dark-border" />
              ) : (
                <span className="font-rajdhani text-5xl font-bold text-white balance-number">
                  {formatCurrency(totalValue)}
                </span>
              )}
            </div>

            {/* XRP Price Chart */}
            <div className="h-48">
              {historyLoading ? (
                <Skeleton className="h-full w-full bg-dark-border rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="xrpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00AEEF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(v) => `$${v.toFixed(2)}`}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#00AEEF" 
                      strokeWidth={2}
                      fill="url(#xrpGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* XRP Highlight Card */}
        <Card className="glass-card border-dark-border card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-xrp-blue/20 flex items-center justify-center">
                <img 
                  src="https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025" 
                  alt="XRP" 
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h3 className="font-rajdhani text-xl font-bold text-white">XRP</h3>
                <p className="text-slate-400 text-sm">XRP Ledger</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Balance</p>
                <p className="font-rajdhani text-2xl font-bold text-white">
                  {formatNumber(xrpBalance)} XRP
                </p>
                <p className="text-slate-400 text-sm">{formatCurrency(xrpValue)}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-dark-border">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Price</p>
                  <p className="text-white font-semibold">{formatCurrency(xrpPrice)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Assets Grid */}
      <div>
        <h2 className="font-rajdhani text-xl font-semibold text-white mb-4">Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getAssets().map((asset, idx) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card border-dark-border card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${asset.color}20` }}
                    >
                      <img src={asset.logo} alt={asset.symbol} className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{asset.symbol}</p>
                      <p className="text-xs text-slate-500 truncate">{asset.name}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white font-semibold">{formatNumber(asset.balance)}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(asset.value)}</p>
                    </div>
                    <p className="text-slate-400 text-sm">{formatCurrency(asset.price)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Wallet Address Info */}
      <Card className="glass-card border-dark-border">
        <CardHeader>
          <CardTitle className="font-rajdhani text-white">Wallet Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <span className="text-slate-400 text-sm">XRP Address</span>
              <code className="text-xs text-slate-300 font-mono">
                {activeWallet.addresses?.xrp || 'Not derived'}
              </code>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <span className="text-slate-400 text-sm">EVM Address</span>
              <code className="text-xs text-slate-300 font-mono">
                {activeWallet.addresses?.ethereum || 'Not derived'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
