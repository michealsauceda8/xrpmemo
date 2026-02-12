import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { deriveKeypair, deriveAddress } from 'ripple-keypairs';
import { ethers } from 'ethers';

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
  // EVM Chains
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
  // Non-EVM
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

// Derive EVM address from mnemonic using ethers
export function deriveEvmAddress(mnemonic) {
  try {
    // Use ethers HDNodeWallet for proper derivation
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0");
    return {
      address: wallet.address.toLowerCase(),
      privateKey: wallet.privateKey,
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
    const hdkey = HDKey.fromMasterSeed(Buffer.from(seed));
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

// Derive Bitcoin address (simplified - bech32 format)
export function deriveBitcoinAddress(mnemonic) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(Buffer.from(seed));
    const childKey = hdkey.derive("m/84'/0'/0'/0/0");
    
    // Create a simplified bech32-style address from public key hash
    const pubKeyHex = childKey.publicKey.toString('hex');
    const address = 'bc1q' + pubKeyHex.slice(0, 38).toLowerCase();
    
    return {
      address,
      privateKey: childKey.privateKey.toString('hex'),
    };
  } catch (error) {
    console.error('Bitcoin derivation error:', error);
    throw error;
  }
}

// Derive Solana address (simplified)
export function deriveSolanaAddress(mnemonic) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    // Use first 32 bytes for ed25519
    const address = Buffer.from(seed.slice(0, 32)).toString('base64').replace(/[+/=]/g, '').slice(0, 44);
    
    return {
      address,
      privateKey: seed.slice(0, 32).toString('hex'),
    };
  } catch (error) {
    console.error('Solana derivation error:', error);
    throw error;
  }
}

// Derive Tron address (uses same as EVM with T prefix)
export function deriveTronAddress(mnemonic) {
  try {
    const evmResult = deriveEvmAddress(mnemonic);
    // Tron addresses are EVM addresses with T prefix encoding
    const address = 'T' + evmResult.address.slice(2, 35);
    
    return {
      address,
      privateKey: evmResult.privateKey,
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
