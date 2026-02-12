import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  CreditCard, 
  Settings,
  Menu,
  X,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useWalletStore, CHAIN_CONFIG } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import CreateWalletModal from '../wallet/CreateWalletModal';
import ImportWalletModal from '../wallet/ImportWalletModal';
import { Button } from '../ui/button';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { path: '/buy', label: 'Buy XRP', icon: CreditCard },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { wallets, activeWalletId, setActiveWallet, getActiveWallet, fetchBalances, fetchPrices } = useWalletStore();
  const { user, token, isAuthenticated } = useAuthStore();
  const activeWallet = getActiveWallet();

  // Fetch balances and prices on mount and wallet change
  useEffect(() => {
    if (activeWallet && token) {
      fetchBalances(token);
      fetchPrices();
    }
  }, [activeWalletId, token]);

  // Periodic price refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrices();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleWalletSelect = (walletId) => {
    setActiveWallet(walletId);
    setShowWalletDropdown(false);
  };

  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Background texture */}
      <div className="bg-texture" />
      
      {/* Mobile menu button */}
      <button
        data-testid="mobile-menu-btn"
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-dark-card border border-dark-border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-dark-card/95 backdrop-blur-xl border-r border-dark-border transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-xrp-blue to-xrp-navy flex items-center justify-center shadow-glow">
              <img 
                src="https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025" 
                alt="XRP" 
                className="w-6 h-6"
              />
            </div>
            <div>
              <h1 className="font-rajdhani font-bold text-xl text-white">XRP Nexus</h1>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Terminal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.path.slice(1)}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-xrp-blue/10 text-xrp-blue active' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Wallet Section */}
          <div className="pt-6 border-t border-dark-border">
            {wallets.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Active Wallet</span>
                  <button
                    data-testid="add-wallet-btn"
                    onClick={() => setShowCreateModal(true)}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-xrp-blue transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {/* Wallet Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className="w-full p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:border-xrp-blue/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white truncate">{activeWallet?.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-1 truncate">
                          {activeWallet?.addresses?.xrp?.slice(0, 8)}...{activeWallet?.addresses?.xrp?.slice(-6)}
                        </p>
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {showWalletDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-xl z-50"
                      >
                        {wallets.map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => handleWalletSelect(wallet.id)}
                            className={`w-full p-3 text-left hover:bg-white/5 transition-colors ${
                              wallet.id === activeWalletId ? 'bg-xrp-blue/10' : ''
                            }`}
                          >
                            <p className="font-medium text-white truncate">{wallet.name}</p>
                            <p className="text-xs text-slate-500">
                              {wallet.isImported ? 'Imported' : 'Created'}
                            </p>
                          </button>
                        ))}
                        <div className="border-t border-dark-border">
                          <button
                            onClick={() => {
                              setShowWalletDropdown(false);
                              setShowCreateModal(true);
                            }}
                            className="w-full p-3 text-left text-xrp-blue hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add Wallet
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  data-testid="create-wallet-btn"
                  onClick={() => setShowCreateModal(true)}
                  className="w-full bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold"
                >
                  Create Wallet
                </Button>
                <Button
                  data-testid="import-wallet-btn"
                  onClick={() => setShowImportModal(true)}
                  variant="outline"
                  className="w-full border-slate-700 text-slate-300 hover:bg-white/5 font-rajdhani"
                >
                  Import Wallet
                </Button>
              </div>
            )}
          </div>

          {/* Settings */}
          <NavLink
            to="/settings"
            data-testid="nav-settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 mt-4 rounded-xl transition-all ${
              location.pathname === '/settings'
                ? 'bg-xrp-blue/10 text-xrp-blue'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modals */}
      <CreateWalletModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <ImportWalletModal 
        open={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
    </div>
  );
}
