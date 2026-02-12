import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useWalletStore, CHAINS } from '../store/walletStore';
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
          {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xrp-blue font-semibold text-lg mt-1">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { wallets, getActiveWallet, balances, prices, updateBalances, updatePrices } = useWalletStore();
  const activeWallet = getActiveWallet();

  // Fetch prices
  const { data: priceData, isLoading: pricesLoading, refetch: refetchPrices } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const response = await axios.get(`${API}/prices`);
      return response.data;
    },
    refetchInterval: 60000,
  });

  // Fetch XRP price history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['priceHistory', 'xrp'],
    queryFn: async () => {
      const response = await axios.get(`${API}/prices/history/xrp?days=7`);
      return response.data;
    },
  });

  // Fetch balances when wallet is active
  const { data: balanceData, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', activeWallet?.id],
    queryFn: async () => {
      if (!activeWallet) return null;
      const response = await axios.post(`${API}/balances/all`, activeWallet.addresses);
      return response.data;
    },
    enabled: !!activeWallet,
  });

  // Update store when data changes
  useEffect(() => {
    if (priceData?.prices) {
      updatePrices(priceData.prices);
    }
  }, [priceData, updatePrices]);

  useEffect(() => {
    if (balanceData?.balances) {
      updateBalances(balanceData.balances);
    }
  }, [balanceData, updateBalances]);

  // Calculate total portfolio value
  const totalValue = Object.entries(balances).reduce((total, [symbol, balance]) => {
    const price = priceData?.prices?.[symbol.toLowerCase()] || 0;
    return total + (balance * price);
  }, 0);

  // Get XRP specific data
  const xrpPrice = priceData?.prices?.xrp || 0;
  const xrpChange = priceData?.changes?.xrp || 0;
  const xrpBalance = balances.XRP || 0;
  const xrpValue = xrpBalance * xrpPrice;

  // Format chart data
  const chartData = historyData?.prices?.map(p => ({
    timestamp: p.timestamp,
    price: p.price
  })) || [];

  // Asset distribution for cards
  const assets = Object.entries(CHAINS).map(([key, chain]) => ({
    symbol: key,
    name: chain.name,
    logo: chain.logo,
    color: chain.color,
    balance: balances[key] || 0,
    price: priceData?.prices?.[key.toLowerCase()] || 0,
    change: priceData?.changes?.[key.toLowerCase()] || 0,
  })).filter(a => a.balance > 0 || ['XRP', 'ETH', 'BTC', 'SOL'].includes(a.symbol));

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
            Create or import a wallet to get started with your multi-chain portfolio
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
          <p className="text-slate-400 mt-1">Portfolio overview</p>
        </div>
        <Button
          data-testid="refresh-prices-btn"
          onClick={() => refetchPrices()}
          variant="outline"
          className="border-dark-border hover:bg-white/5"
        >
          <RefreshCw size={18} className="mr-2" />
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
              {pricesLoading || balancesLoading ? (
                <Skeleton className="h-12 w-48 bg-dark-border" />
              ) : (
                <>
                  <span className="font-rajdhani text-5xl font-bold text-white balance-number">
                    {formatCurrency(totalValue)}
                  </span>
                  <span className={`flex items-center text-sm ${xrpChange >= 0 ? 'text-success' : 'text-error'}`}>
                    {xrpChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                    {Math.abs(xrpChange).toFixed(2)}%
                  </span>
                </>
              )}
            </div>

            {/* XRP Price Chart */}
            <div className="h-48">
              {historyLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full bg-dark-border rounded-lg" />
                </div>
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
                <div className={`flex items-center px-3 py-1 rounded-full ${xrpChange >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                  {xrpChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span className="text-sm font-medium ml-1">{Math.abs(xrpChange).toFixed(2)}%</span>
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
          {assets.map((asset, idx) => (
            <motion.div
              key={asset.symbol}
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
                    <div className={`text-xs font-medium ${asset.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white font-semibold">{formatNumber(asset.balance)}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(asset.balance * asset.price)}</p>
                    </div>
                    <p className="text-slate-400 text-sm">{formatCurrency(asset.price)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card border-dark-border">
        <CardHeader>
          <CardTitle className="font-rajdhani text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <p>No recent transactions</p>
            <p className="text-sm mt-1">Your transaction history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
