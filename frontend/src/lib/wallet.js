import * as bip39 from 'bip39';
import { Buffer } from 'buffer';

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
export async function deriveEvmAddress(mnemonic) {
  try {
    const { ethers } = await import('ethers');
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0");
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error('EVM derivation error:', error);
    throw error;
  }
}

// Derive XRP address from mnemonic using ripple-keypairs
export async function deriveXrpAddress(mnemonic) {
  try {
    const { deriveKeypair, deriveAddress, generateSeed } = await import('ripple-keypairs');
    const HDKey = (await import('hdkey')).default;
    
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(Buffer.from(seed));
    const childKey = hdkey.derive("m/44'/144'/0'/0/0");
    
    // Use first 16 bytes of private key as entropy for ripple seed generation
    const entropyArray = Array.from(childKey.privateKey).slice(0, 16);
    const xrpSeed = generateSeed({ entropy: entropyArray });
    const keypair = deriveKeypair(xrpSeed);
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

// Derive Bitcoin native SegWit (bech32) address using BIP84
export async function deriveBitcoinAddress(mnemonic) {
  try {
    const bitcoin = await import('bitcoinjs-lib');
    const ecc = await import('tiny-secp256k1');
    const { BIP32Factory } = await import('bip32');
    
    const bip32 = BIP32Factory(ecc);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);
    
    // BIP84 path for native SegWit: m/84'/0'/0'/0/0
    const child = root.derivePath("m/84'/0'/0'/0/0");
    
    // Generate native SegWit P2WPKH address
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin
    });
    
    return {
      address,
      privateKey: child.privateKey.toString('hex'),
    };
  } catch (error) {
    console.error('Bitcoin derivation error:', error);
    throw error;
  }
}

// Derive Solana address using ed25519
export async function deriveSolanaAddress(mnemonic) {
  try {
    const { Keypair } = await import('@solana/web3.js');
    const { derivePath } = await import('ed25519-hd-key');
    
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Solana BIP44 path: m/44'/501'/0'/0'
    const path = "m/44'/501'/0'/0'";
    const { key: derivedSeed } = derivePath(path, seed.toString('hex'));
    
    // Create Solana keypair from derived seed
    const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
    
    return {
      address: keypair.publicKey.toBase58(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    };
  } catch (error) {
    console.error('Solana derivation error:', error);
    throw error;
  }
}

// Derive Tron address using TronWeb
export async function deriveTronAddress(mnemonic) {
  try {
    const TronWeb = (await import('tronweb')).default;
    
    // TronWeb.fromMnemonic derives using BIP44 path m/44'/195'/0'/0/0
    const result = TronWeb.fromMnemonic(mnemonic, "m/44'/195'/0'/0/0");
    
    return {
      address: result.address.base58,
      privateKey: result.privateKey,
    };
  } catch (error) {
    console.error('Tron derivation error:', error);
    throw error;
  }
}

// Derive all addresses from mnemonic (async version)
export async function deriveAllAddresses(mnemonic) {
  const addresses = {};
  
  // Derive XRP address
  try {
    const xrp = await deriveXrpAddress(mnemonic);
    addresses.xrp = xrp.address;
  } catch (e) {
    console.error('Failed to derive XRP address:', e);
  }
  
  // Derive EVM address (used for all EVM chains)
  try {
    const evm = await deriveEvmAddress(mnemonic);
    
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
    const sol = await deriveSolanaAddress(mnemonic);
    addresses.solana = sol.address;
  } catch (e) {
    console.error('Failed to derive Solana address:', e);
  }
  
  // Derive Bitcoin address
  try {
    const btc = await deriveBitcoinAddress(mnemonic);
    addresses.bitcoin = btc.address;
  } catch (e) {
    console.error('Failed to derive Bitcoin address:', e);
  }
  
  // Derive Tron address
  try {
    const trx = await deriveTronAddress(mnemonic);
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
