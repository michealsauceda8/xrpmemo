import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  Wallet,
  TrendingUp,
  Lock,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Non-Custodial',
    description: 'Your keys, your crypto. We never store your private keys.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'XRP transactions settle in 3-5 seconds with minimal fees.',
  },
  {
    icon: Globe,
    title: '25+ Chains',
    description: 'Support for XRP, ETH, BTC, SOL, TRON & 20+ EVM chains.',
  },
  {
    icon: TrendingUp,
    title: 'Swap to XRP',
    description: 'Convert any supported token to XRP instantly.',
  },
];

const chains = [
  { name: 'XRP', logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025' },
  { name: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025' },
  { name: 'BTC', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025' },
  { name: 'SOL', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025' },
  { name: 'BNB', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=025' },
  { name: 'MATIC', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=025' },
  { name: 'AVAX', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=025' },
  { name: 'ARB', logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=025' },
];

const stats = [
  { value: '25+', label: 'Supported Chains' },
  { value: '3-5s', label: 'XRP Speed' },
  { value: '$0.0001', label: 'Avg. XRP Fee' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-bg overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-xrp-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-xrp-navy/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-xrp-blue/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-xrp-blue to-xrp-navy flex items-center justify-center shadow-glow">
              <img 
                src="https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025" 
                alt="XRP" 
                className="w-7 h-7"
              />
            </div>
            <div>
              <h1 className="font-rajdhani font-bold text-2xl text-white tracking-tight">XRP Nexus</h1>
              <span className="text-xs text-xrp-blue uppercase tracking-widest">Terminal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                data-testid="header-login-btn"
                variant="ghost"
                className="text-slate-400 hover:text-white font-rajdhani"
              >
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button
                data-testid="header-register-btn"
                className="bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold px-6 shadow-glow"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-xrp-blue/10 border border-xrp-blue/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-xrp-blue animate-pulse" />
              <span className="text-xrp-blue text-sm font-medium">Real Blockchain Data</span>
            </div>

            <h1 className="font-rajdhani font-bold text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6">
              The Future of
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-xrp-blue to-xrp-blue-light">
                XRP Trading
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-xl leading-relaxed">
              Your premium gateway to the XRP ecosystem. Create a non-custodial wallet with 
              real addresses, swap any token to XRP, and manage 25+ blockchain networks.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/register">
                <Button
                  data-testid="hero-register-btn"
                  size="lg"
                  className="bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-bold text-lg px-8 h-14 shadow-glow hover:shadow-glow-lg transition-all"
                >
                  Create Account
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  data-testid="hero-login-btn"
                  size="lg"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-white/5 font-rajdhani font-semibold text-lg px-8 h-14"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <p className="font-rajdhani font-bold text-3xl text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-xrp-blue/30 to-xrp-navy/30 rounded-3xl blur-2xl transform scale-95" />
              
              <div className="relative glass-card rounded-3xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-xrp-blue/20 flex items-center justify-center">
                      <img 
                        src="https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025" 
                        alt="XRP" 
                        className="w-8 h-8"
                      />
                    </div>
                    <div>
                      <p className="font-rajdhani font-bold text-xl text-white">XRP</p>
                      <p className="text-sm text-slate-500">XRP Ledger</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-rajdhani font-bold text-2xl text-white">$2.35</p>
                    <p className="text-sm text-success">+3.2%</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-dark-bg/50 border border-dark-border">
                    <span className="text-slate-400">Balance</span>
                    <span className="font-rajdhani font-bold text-white">10,000 XRP</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-dark-bg/50 border border-dark-border">
                    <span className="text-slate-400">Value</span>
                    <span className="font-rajdhani font-bold text-xrp-blue">$23,500.00</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-xrp-blue text-white font-rajdhani font-semibold text-center">
                    Receive
                  </div>
                  <div className="p-4 rounded-xl bg-dark-bg border border-dark-border text-white font-rajdhani font-semibold text-center">
                    Send
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/20 flex items-center justify-center"
              >
                <TrendingUp className="text-success" size={24} />
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-14 h-14 rounded-xl bg-gradient-to-br from-xrp-blue/20 to-xrp-blue/5 border border-xrp-blue/20 flex items-center justify-center"
              >
                <Lock className="text-xrp-blue" size={20} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Supported Chains */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24"
        >
          <div className="text-center mb-8">
            <p className="text-slate-500 text-sm uppercase tracking-wider">Supported Networks</p>
          </div>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {chains.map((chain, idx) => (
              <motion.div
                key={chain.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-card/50 border border-dark-border"
              >
                <img src={chain.logo} alt={chain.name} className="w-6 h-6" />
                <span className="text-sm text-slate-400 font-medium">{chain.name}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-xrp-blue/10 border border-xrp-blue/20">
              <Layers size={18} className="text-xrp-blue" />
              <span className="text-sm text-xrp-blue font-medium">+17 more</span>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-32"
        >
          <div className="text-center mb-16">
            <h2 className="font-rajdhani font-bold text-4xl text-white mb-4">
              Why Choose XRP Nexus?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built for XRP enthusiasts who demand security, speed, and real blockchain data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="group glass-card p-6 rounded-2xl border border-dark-border hover:border-xrp-blue/30 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-xrp-blue/10 flex items-center justify-center mb-4 group-hover:bg-xrp-blue/20 transition-colors">
                    <Icon className="text-xrp-blue" size={24} />
                  </div>
                  <h3 className="font-rajdhani font-bold text-lg text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32"
        >
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-xrp-blue/20 to-xrp-navy/20" />
            <div className="relative glass-card border-dark-border p-12 text-center">
              <h2 className="font-rajdhani font-bold text-4xl text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Create your secure multi-chain wallet in seconds. Real addresses, real balances, real trading.
              </p>
              <Link to="/register">
                <Button
                  data-testid="cta-register-btn"
                  size="lg"
                  className="bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-bold text-lg px-10 h-14 shadow-glow"
                >
                  Create Your Account
                  <ChevronRight className="ml-2" size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 XRP Nexus Terminal. Non-custodial wallet.
          </p>
          <p className="text-xs text-slate-600">
            Not affiliated with Ripple Labs Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
