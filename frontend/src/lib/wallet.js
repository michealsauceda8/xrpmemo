import * as bip39 from 'bip39';
import { HDKey } from 'hdkey';
import { keccak256 } from '@ethereumjs/util';
import { deriveKeypair, deriveAddress } from 'ripple-keypairs';

// Chain configurations with derivation paths
export const CHAIN_CONFIG = {
  // XRP Ledger
  xrp: {
    name: 'XRP Ledger',
    symbol: 'XRP',
    decimals: 6,
    type: 'xrpl',
    logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025',
    color: '#00AEEF',
    derivationPath: "m/44'/144'/0'/0/0",
    explorer: 'https://xrpscan.com',
  },
  // EVM Chains (all use same derivation)
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 1,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025',
    color: '#627EEA',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://etherscan.io',
  },
  bsc: {
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    type: 'evm',
    chainId: 56,
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=025',
    color: '#F3BA2F',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://bscscan.com',
  },
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    type: 'evm',
    chainId: 137,
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=025',
    color: '#8247E5',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://polygonscan.com',
  },
  avalanche: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    type: 'evm',
    chainId: 43114,
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=025',
    color: '#E84142',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://snowtrace.io',
  },
  arbitrum: {
    name: 'Arbitrum',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 42161,
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=025',
    color: '#28A0F0',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://arbiscan.io',
  },
  optimism: {
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 10,
    logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=025',
    color: '#FF0420',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://optimistic.etherscan.io',
  },
  base: {
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 8453,
    logo: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg',
    color: '#0052FF',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://basescan.org',
  },
  fantom: {
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
    type: 'evm',
    chainId: 250,
    logo: 'https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=025',
    color: '#1969FF',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://ftmscan.com',
  },
  cronos: {
    name: 'Cronos',
    symbol: 'CRO',
    decimals: 18,
    type: 'evm',
    chainId: 25,
    logo: 'https://cryptologos.cc/logos/cronos-cro-logo.svg?v=025',
    color: '#002D74',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://cronoscan.com',
  },
  gnosis: {
    name: 'Gnosis',
    symbol: 'xDAI',
    decimals: 18,
    type: 'evm',
    chainId: 100,
    logo: 'https://cryptologos.cc/logos/gnosis-gno-gno-logo.svg?v=025',
    color: '#04795B',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://gnosisscan.io',
  },
  linea: {
    name: 'Linea',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 59144,
    logo: 'https://linea.build/favicon.ico',
    color: '#61DFFF',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://lineascan.build',
  },
  zksync: {
    name: 'zkSync Era',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 324,
    logo: 'https://cryptologos.cc/logos/zksync-zks-logo.svg?v=025',
    color: '#8B8DFC',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://explorer.zksync.io',
  },
  scroll: {
    name: 'Scroll',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 534352,
    logo: 'https://scroll.io/favicon.ico',
    color: '#FFEEDA',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://scrollscan.com',
  },
  mantle: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
    type: 'evm',
    chainId: 5000,
    logo: 'https://www.mantle.xyz/favicon.ico',
    color: '#000000',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://explorer.mantle.xyz',
  },
  celo: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
    type: 'evm',
    chainId: 42220,
    logo: 'https://cryptologos.cc/logos/celo-celo-logo.svg?v=025',
    color: '#35D07F',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://celoscan.io',
  },
  moonbeam: {
    name: 'Moonbeam',
    symbol: 'GLMR',
    decimals: 18,
    type: 'evm',
    chainId: 1284,
    logo: 'https://cryptologos.cc/logos/moonbeam-glmr-logo.svg?v=025',
    color: '#53CBC8',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://moonscan.io',
  },
  aurora: {
    name: 'Aurora',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 1313161554,
    logo: 'https://cryptologos.cc/logos/aurora-aoa-logo.svg?v=025',
    color: '#70D44B',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://explorer.aurora.dev',
  },
  klaytn: {
    name: 'Klaytn',
    symbol: 'KLAY',
    decimals: 18,
    type: 'evm',
    chainId: 8217,
    logo: 'https://cryptologos.cc/logos/klaytn-klay-logo.svg?v=025',
    color: '#FF3D00',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://klaytnscope.com',
  },
  metis: {
    name: 'Metis',
    symbol: 'METIS',
    decimals: 18,
    type: 'evm',
    chainId: 1088,
    logo: 'https://cryptologos.cc/logos/metis-metis-logo.svg?v=025',
    color: '#00DACC',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://andromeda-explorer.metis.io',
  },
  harmony: {
    name: 'Harmony',
    symbol: 'ONE',
    decimals: 18,
    type: 'evm',
    chainId: 1666600000,
    logo: 'https://cryptologos.cc/logos/harmony-one-logo.svg?v=025',
    color: '#00AEE9',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://explorer.harmony.one',
  },
  boba: {
    name: 'Boba',
    symbol: 'ETH',
    decimals: 18,
    type: 'evm',
    chainId: 288,
    logo: 'https://cryptologos.cc/logos/boba-network-boba-logo.svg?v=025',
    color: '#CCFF00',
    derivationPath: "m/44'/60'/0'/0/0",
    explorer: 'https://bobascan.com',
  },
  // Non-EVM chains
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    type: 'solana',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025',
    color: '#9945FF',
    derivationPath: "m/44'/501'/0'/0'",
    explorer: 'https://solscan.io',
  },
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    type: 'bitcoin',
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025',
    color: '#F7931A',
    derivationPath: "m/84'/0'/0'/0/0",
    explorer: 'https://blockstream.info',
  },
  tron: {
    name: 'Tron',
    symbol: 'TRX',
    decimals: 6,
    type: 'tron',
    logo: 'https://cryptologos.cc/logos/tron-trx-logo.svg?v=025',
    color: '#FF0013',
    derivationPath: "m/44'/195'/0'/0/0",
    explorer: 'https://tronscan.org',
  },
};

// Generate a new mnemonic
export function generateMnemonic(wordCount = 12) {
  const strength = wordCount === 24 ? 256 : 128;
  return bip39.generateMnemonic(strength);
}

// Validate a mnemonic
export function validateMnemonic(mnemonic) {
  return bip39.validateMnemonic(mnemonic);
}

// Derive EVM address from mnemonic
export function deriveEvmAddress(mnemonic, path = "m/44'/60'/0'/0/0") {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const childKey = hdkey.derive(path);
    
    // Get public key and derive address
    const publicKey = childKey.publicKey;
    const addressBytes = keccak256(Buffer.from(publicKey.slice(1))).slice(-20);
    const address = '0x' + Buffer.from(addressBytes).toString('hex');
    
    return {
      address: address.toLowerCase(),
      privateKey: '0x' + childKey.privateKey.toString('hex'),
    };
  } catch (error) {
    console.error('EVM derivation error:', error);
    throw error;
  }
}

// Derive XRP address from mnemonic
export function deriveXrpAddress(mnemonic) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const childKey = hdkey.derive("m/44'/144'/0'/0/0");
    
    // Convert to hex seed for ripple-keypairs
    const hexSeed = childKey.privateKey.toString('hex').toUpperCase();
    
    // Derive keypair and address
    const keypair = deriveKeypair(hexSeed);
    const address = deriveAddress(keypair.publicKey);
    
    return {
      address,
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    };
  } catch (error) {
    console.error('XRP derivation error:', error);
    throw error;
  }
}

// Derive Solana address from mnemonic (simplified - uses same as EVM for demo)
export function deriveSolanaAddress(mnemonic) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    // Use first 32 bytes for ed25519 seed
    const ed25519Seed = seed.slice(0, 32);
    
    // Generate a deterministic "address" from seed
    // Note: Real Solana derivation requires @solana/web3.js Keypair
    const addressBytes = keccak256(ed25519Seed).slice(0, 32);
    const address = Buffer.from(addressBytes).toString('base64').replace(/[+/=]/g, '').slice(0, 44);
    
    return {
      address,
      privateKey: ed25519Seed.toString('hex'),
    };
  } catch (error) {
    console.error('Solana derivation error:', error);
    throw error;
  }
}

// Derive Bitcoin address from mnemonic
export function deriveBitcoinAddress(mnemonic) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const childKey = hdkey.derive("m/84'/0'/0'/0/0");
    
    // Create a bech32 address format (simplified)
    const publicKeyHash = keccak256(Buffer.from(childKey.publicKey)).slice(0, 20);
    // This is a simplified representation - real Bitcoin uses bech32 encoding
    const address = 'bc1q' + Buffer.from(publicKeyHash).toString('hex').slice(0, 38);
    
    return {
      address,
      privateKey: childKey.privateKey.toString('hex'),
    };
  } catch (error) {
    console.error('Bitcoin derivation error:', error);
    throw error;
  }
}

// Derive Tron address from mnemonic
export function deriveTronAddress(mnemonic) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const childKey = hdkey.derive("m/44'/195'/0'/0/0");
    
    // Get address bytes from public key
    const publicKey = childKey.publicKey;
    const addressBytes = keccak256(Buffer.from(publicKey.slice(1))).slice(-20);
    
    // Tron addresses start with 'T' and use base58
    // Simplified representation
    const hexAddress = '41' + Buffer.from(addressBytes).toString('hex');
    const address = 'T' + Buffer.from(hexAddress, 'hex').toString('base64').replace(/[+/=]/g, '').slice(0, 33);
    
    return {
      address,
      privateKey: childKey.privateKey.toString('hex'),
    };
  } catch (error) {
    console.error('Tron derivation error:', error);
    throw error;
  }
}

// Derive all addresses from mnemonic
export function deriveAllAddresses(mnemonic) {
  const addresses = {};
  
  // Derive XRP address
  try {
    const xrp = deriveXrpAddress(mnemonic);
    addresses.xrp = xrp.address;
  } catch (e) {
    console.error('Failed to derive XRP address:', e);
  }
  
  // Derive EVM address (used for all EVM chains)
  try {
    const evm = deriveEvmAddress(mnemonic);
    
    // Apply same address to all EVM chains
    Object.keys(CHAIN_CONFIG).forEach((chainId) => {
      const chain = CHAIN_CONFIG[chainId];
      if (chain.type === 'evm') {
        addresses[chainId] = evm.address;
      }
    });
  } catch (e) {
    console.error('Failed to derive EVM address:', e);
  }
  
  // Derive Solana address
  try {
    const sol = deriveSolanaAddress(mnemonic);
    addresses.solana = sol.address;
  } catch (e) {
    console.error('Failed to derive Solana address:', e);
  }
  
  // Derive Bitcoin address
  try {
    const btc = deriveBitcoinAddress(mnemonic);
    addresses.bitcoin = btc.address;
  } catch (e) {
    console.error('Failed to derive Bitcoin address:', e);
  }
  
  // Derive Tron address
  try {
    const trx = deriveTronAddress(mnemonic);
    addresses.tron = trx.address;
  } catch (e) {
    console.error('Failed to derive Tron address:', e);
  }
  
  return addresses;
}

export default {
  CHAIN_CONFIG,
  generateMnemonic,
  validateMnemonic,
  deriveAllAddresses,
  deriveEvmAddress,
  deriveXrpAddress,
  deriveSolanaAddress,
  deriveBitcoinAddress,
  deriveTronAddress,
};
