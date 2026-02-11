import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

// Supported chains configuration
export const CHAINS = {
  XRP: {
    id: 'xrp',
    name: 'XRP Ledger',
    symbol: 'XRP',
    decimals: 6,
    derivationPath: "m/44'/144'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025',
    color: '#00AEEF',
    explorer: 'https://xrpscan.com',
  },
  SOL: {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    derivationPath: "m/44'/501'/0'/0'",
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025',
    color: '#9945FF',
    explorer: 'https://solscan.io',
  },
  ETH: {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    derivationPath: "m/44'/60'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025',
    color: '#627EEA',
    explorer: 'https://etherscan.io',
  },
  BNB: {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    derivationPath: "m/44'/60'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=025',
    color: '#F3BA2F',
    explorer: 'https://bscscan.com',
  },
  BTC: {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    derivationPath: "m/84'/0'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025',
    color: '#F7931A',
    explorer: 'https://blockstream.info',
  },
  LTC: {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    decimals: 8,
    derivationPath: "m/44'/2'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=025',
    color: '#345D9D',
    explorer: 'https://blockchair.com/litecoin',
  },
  DOGE: {
    id: 'doge',
    name: 'Dogecoin',
    symbol: 'DOGE',
    decimals: 8,
    derivationPath: "m/44'/3'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=025',
    color: '#C2A633',
    explorer: 'https://blockchair.com/dogecoin',
  },
  MATIC: {
    id: 'matic',
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    derivationPath: "m/44'/60'/0'/0/0",
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=025',
    color: '#8247E5',
    explorer: 'https://polygonscan.com',
  },
};

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

// BIP39 wordlist (first 100 words for demo - in production use full list)
const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest',
  'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
  'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge',
  'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
  'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit',
  'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology',
  'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless',
  'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss',
  'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread',
  'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze',
  'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
  'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy',
];

// Generate a random mnemonic
const generateMnemonic = (wordCount = 12) => {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * BIP39_WORDLIST.length);
    words.push(BIP39_WORDLIST[randomIndex]);
  }
  return words.join(' ');
};

// Generate demo addresses (in production, use proper derivation)
const generateAddresses = (mnemonic) => {
  const seed = CryptoJS.SHA256(mnemonic).toString();
  const addresses = {};
  
  Object.keys(CHAINS).forEach((chainKey) => {
    const chain = CHAINS[chainKey];
    const chainSeed = CryptoJS.SHA256(seed + chain.derivationPath).toString();
    
    if (chainKey === 'XRP') {
      addresses[chainKey] = 'r' + chainSeed.substring(0, 33);
    } else if (chainKey === 'SOL') {
      addresses[chainKey] = chainSeed.substring(0, 44);
    } else if (['ETH', 'BNB', 'MATIC'].includes(chainKey)) {
      addresses[chainKey] = '0x' + chainSeed.substring(0, 40);
    } else if (['BTC', 'LTC', 'DOGE'].includes(chainKey)) {
      const prefix = chainKey === 'BTC' ? 'bc1' : chainKey === 'LTC' ? 'ltc1' : 'D';
      addresses[chainKey] = prefix + chainSeed.substring(0, 39);
    }
  });
  
  return addresses;
};

// Wallet store
export const useWalletStore = create(
  persist(
    (set, get) => ({
      // State
      wallets: [],
      activeWalletId: null,
      isLocked: true,
      password: null,
      balances: {},
      prices: {},
      isLoading: false,
      
      // Actions
      createWallet: (name, password) => {
        const mnemonic = generateMnemonic(12);
        const addresses = generateAddresses(mnemonic);
        const encryptedMnemonic = encrypt(mnemonic, password);
        
        const wallet = {
          id: Date.now().toString(),
          name: name || `Wallet ${get().wallets.length + 1}`,
          encryptedMnemonic,
          addresses,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          wallets: [...state.wallets, wallet],
          activeWalletId: wallet.id,
          isLocked: false,
          password,
        }));
        
        return { wallet, mnemonic };
      },
      
      importWallet: (mnemonic, name, password) => {
        const trimmedMnemonic = mnemonic.trim().toLowerCase();
        const words = trimmedMnemonic.split(/\s+/);
        
        if (words.length !== 12 && words.length !== 24) {
          throw new Error('Invalid mnemonic: must be 12 or 24 words');
        }
        
        const addresses = generateAddresses(trimmedMnemonic);
        const encryptedMnemonic = encrypt(trimmedMnemonic, password);
        
        const wallet = {
          id: Date.now().toString(),
          name: name || `Wallet ${get().wallets.length + 1}`,
          encryptedMnemonic,
          addresses,
          createdAt: new Date().toISOString(),
          imported: true,
        };
        
        set((state) => ({
          wallets: [...state.wallets, wallet],
          activeWalletId: wallet.id,
          isLocked: false,
          password,
        }));
        
        return wallet;
      },
      
      unlockWallet: (walletId, password) => {
        const wallet = get().wallets.find(w => w.id === walletId);
        if (!wallet) throw new Error('Wallet not found');
        
        const mnemonic = decrypt(wallet.encryptedMnemonic, password);
        if (!mnemonic) throw new Error('Invalid password');
        
        set({ isLocked: false, password, activeWalletId: walletId });
        return true;
      },
      
      lockWallet: () => {
        set({ isLocked: true, password: null });
      },
      
      getMnemonic: (walletId, password) => {
        const wallet = get().wallets.find(w => w.id === walletId);
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
          const newWallets = state.wallets.filter(w => w.id !== walletId);
          return {
            wallets: newWallets,
            activeWalletId: newWallets.length > 0 ? newWallets[0].id : null,
          };
        });
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
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      getActiveWallet: () => {
        const { wallets, activeWalletId } = get();
        return wallets.find(w => w.id === activeWalletId) || null;
      },
      
      getTotalBalance: () => {
        const { balances, prices } = get();
        let total = 0;
        
        Object.entries(balances).forEach(([symbol, balance]) => {
          const price = prices[symbol.toLowerCase()] || 0;
          total += balance * price;
        });
        
        return total;
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
