import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';
import { generateMnemonic, validateMnemonic, deriveAllAddresses, CHAIN_CONFIG } from '../lib/wallet';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Encryption utilities
const encrypt = (data, password) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();
};

const decrypt = (encryptedData, password) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
};

export { CHAIN_CONFIG };

export const useWalletStore = create(
  persist(
    (set, get) => ({
      // State
      wallets: [],
      activeWalletId: null,
      balances: {},
      prices: {},
      isLoading: false,
      lastBalanceUpdate: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      createWallet: async (name, password, token) => {
        set({ isLoading: true });
        
        try {
          // Generate mnemonic
          const mnemonic = generateMnemonic(12);
          
          // Derive all addresses (async)
          const addresses = await deriveAllAddresses(mnemonic);
          
          // Encrypt mnemonic
          const encryptedMnemonic = encrypt(mnemonic, password);
          
          // Create wallet locally
          const wallet = {
            id: Date.now().toString(),
            name: name || `Wallet ${get().wallets.length + 1}`,
            encryptedMnemonic,
            addresses,
            createdAt: new Date().toISOString(),
            isImported: false,
          };
          
          // Save to backend if authenticated
          if (token) {
            try {
              await fetch(`${API}/wallets`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: wallet.name, mnemonic: encryptedMnemonic }),
              });
              
              // Save addresses to backend
              await fetch(`${API}/wallets/save-addresses?wallet_id=${wallet.id}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(addresses),
              });
            } catch (e) {
              console.error('Failed to save wallet to backend:', e);
            }
          }
          
          set((state) => ({
            wallets: [...state.wallets, wallet],
            activeWalletId: wallet.id,
            isLoading: false,
          }));
          
          return { wallet, mnemonic };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      importWallet: async (mnemonic, name, password, token) => {
        set({ isLoading: true });
        
        try {
          // Validate mnemonic
          const trimmedMnemonic = mnemonic.trim().toLowerCase();
          if (!validateMnemonic(trimmedMnemonic)) {
            throw new Error('Invalid mnemonic phrase');
          }
          
          // Derive addresses
          const addresses = deriveAllAddresses(trimmedMnemonic);
          
          // Encrypt mnemonic
          const encryptedMnemonic = encrypt(trimmedMnemonic, password);
          
          const wallet = {
            id: Date.now().toString(),
            name: name || `Imported Wallet ${get().wallets.length + 1}`,
            encryptedMnemonic,
            addresses,
            createdAt: new Date().toISOString(),
            isImported: true,
          };
          
          // Save to backend if authenticated
          if (token) {
            try {
              await fetch(`${API}/wallets/import`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: wallet.name, mnemonic: encryptedMnemonic }),
              });
            } catch (e) {
              console.error('Failed to save wallet to backend:', e);
            }
          }
          
          set((state) => ({
            wallets: [...state.wallets, wallet],
            activeWalletId: wallet.id,
            isLoading: false,
          }));
          
          return wallet;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      getMnemonic: (walletId, password) => {
        const wallet = get().wallets.find((w) => w.id === walletId);
        if (!wallet) throw new Error('Wallet not found');
        
        const mnemonic = decrypt(wallet.encryptedMnemonic, password);
        if (!mnemonic) throw new Error('Invalid password');
        
        return mnemonic;
      },

      setActiveWallet: (walletId) => {
        set({ activeWalletId: walletId });
      },

      deleteWallet: (walletId) => {
        set((state) => {
          const newWallets = state.wallets.filter((w) => w.id !== walletId);
          return {
            wallets: newWallets,
            activeWalletId: newWallets.length > 0 ? newWallets[0].id : null,
          };
        });
      },

      getActiveWallet: () => {
        const { wallets, activeWalletId } = get();
        return wallets.find((w) => w.id === activeWalletId) || null;
      },

      // Fetch real balances from blockchain
      fetchBalances: async (token) => {
        const wallet = get().getActiveWallet();
        if (!wallet) return;
        
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API}/balances/multi`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(wallet.addresses),
          });
          
          const data = await response.json();
          
          if (data.balances) {
            const balances = {};
            Object.entries(data.balances).forEach(([chain, info]) => {
              balances[chain] = info.balance || 0;
            });
            
            set({
              balances,
              lastBalanceUpdate: new Date().toISOString(),
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to fetch balances:', error);
          set({ isLoading: false });
        }
      },

      // Fetch prices
      fetchPrices: async () => {
        try {
          const response = await fetch(`${API}/prices`);
          const data = await response.json();
          
          if (data.prices) {
            set({ prices: data.prices });
          }
        } catch (error) {
          console.error('Failed to fetch prices:', error);
        }
      },

      updateBalances: (balances) => {
        set((state) => ({
          balances: { ...state.balances, ...balances },
        }));
      },

      updatePrices: (prices) => {
        set((state) => ({
          prices: { ...state.prices, ...prices },
        }));
      },

      getTotalBalance: () => {
        const { balances, prices } = get();
        let total = 0;
        
        Object.entries(balances).forEach(([chain, balance]) => {
          const chainConfig = CHAIN_CONFIG[chain];
          if (chainConfig) {
            const symbol = chainConfig.symbol.toLowerCase();
            const price = prices[symbol] || 0;
            total += balance * price;
          }
        });
        
        return total;
      },

      clearWallets: () => {
        set({
          wallets: [],
          activeWalletId: null,
          balances: {},
        });
      },
    }),
    {
      name: 'xrp-wallet-storage',
      partialize: (state) => ({
        wallets: state.wallets,
        activeWalletId: state.activeWalletId,
      }),
    }
  )
);

export default useWalletStore;
