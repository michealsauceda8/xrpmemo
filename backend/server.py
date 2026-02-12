from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="XRP Nexus Terminal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configuration
ANKR_RPC = "https://rpc.ankr.com/multichain/0cfff9adf111f64126dd12eb6139946c3b67d7d06e30c8d65ff0e08fa5200997"
COINGECKO_API = "https://api.coingecko.com/api/v3"

# Supported chains configuration
SUPPORTED_CHAINS = {
    # EVM Chains
    "ethereum": {"chainId": 1, "name": "Ethereum", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/eth", "explorer": "https://etherscan.io"},
    "bsc": {"chainId": 56, "name": "BNB Chain", "symbol": "BNB", "decimals": 18, "rpc": f"{ANKR_RPC}/bsc", "explorer": "https://bscscan.com"},
    "polygon": {"chainId": 137, "name": "Polygon", "symbol": "MATIC", "decimals": 18, "rpc": f"{ANKR_RPC}/polygon", "explorer": "https://polygonscan.com"},
    "avalanche": {"chainId": 43114, "name": "Avalanche", "symbol": "AVAX", "decimals": 18, "rpc": f"{ANKR_RPC}/avalanche", "explorer": "https://snowtrace.io"},
    "arbitrum": {"chainId": 42161, "name": "Arbitrum", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/arbitrum", "explorer": "https://arbiscan.io"},
    "optimism": {"chainId": 10, "name": "Optimism", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/optimism", "explorer": "https://optimistic.etherscan.io"},
    "fantom": {"chainId": 250, "name": "Fantom", "symbol": "FTM", "decimals": 18, "rpc": f"{ANKR_RPC}/fantom", "explorer": "https://ftmscan.com"},
    "cronos": {"chainId": 25, "name": "Cronos", "symbol": "CRO", "decimals": 18, "rpc": "https://evm.cronos.org", "explorer": "https://cronoscan.com"},
    "gnosis": {"chainId": 100, "name": "Gnosis", "symbol": "xDAI", "decimals": 18, "rpc": f"{ANKR_RPC}/gnosis", "explorer": "https://gnosisscan.io"},
    "celo": {"chainId": 42220, "name": "Celo", "symbol": "CELO", "decimals": 18, "rpc": f"{ANKR_RPC}/celo", "explorer": "https://celoscan.io"},
    "moonbeam": {"chainId": 1284, "name": "Moonbeam", "symbol": "GLMR", "decimals": 18, "rpc": f"{ANKR_RPC}/moonbeam", "explorer": "https://moonscan.io"},
    "base": {"chainId": 8453, "name": "Base", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/base", "explorer": "https://basescan.org"},
    "linea": {"chainId": 59144, "name": "Linea", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/linea", "explorer": "https://lineascan.build"},
    "zksync": {"chainId": 324, "name": "zkSync Era", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/zksync_era", "explorer": "https://explorer.zksync.io"},
    "scroll": {"chainId": 534352, "name": "Scroll", "symbol": "ETH", "decimals": 18, "rpc": f"{ANKR_RPC}/scroll", "explorer": "https://scrollscan.com"},
    "mantle": {"chainId": 5000, "name": "Mantle", "symbol": "MNT", "decimals": 18, "rpc": "https://rpc.mantle.xyz", "explorer": "https://explorer.mantle.xyz"},
    "metis": {"chainId": 1088, "name": "Metis", "symbol": "METIS", "decimals": 18, "rpc": "https://andromeda.metis.io", "explorer": "https://andromeda-explorer.metis.io"},
    "aurora": {"chainId": 1313161554, "name": "Aurora", "symbol": "ETH", "decimals": 18, "rpc": "https://mainnet.aurora.dev", "explorer": "https://explorer.aurora.dev"},
    "klaytn": {"chainId": 8217, "name": "Klaytn", "symbol": "KLAY", "decimals": 18, "rpc": "https://public-en.node.kaia.io", "explorer": "https://klaytnscope.com"},
    "harmony": {"chainId": 1666600000, "name": "Harmony", "symbol": "ONE", "decimals": 18, "rpc": "https://api.harmony.one", "explorer": "https://explorer.harmony.one"},
    "kcc": {"chainId": 321, "name": "KCC", "symbol": "KCS", "decimals": 18, "rpc": "https://rpc-mainnet.kcc.network", "explorer": "https://explorer.kcc.io"},
    "okx": {"chainId": 66, "name": "OKX Chain", "symbol": "OKT", "decimals": 18, "rpc": "https://exchainrpc.okex.org", "explorer": "https://www.oklink.com/okc"},
    "boba": {"chainId": 288, "name": "Boba", "symbol": "ETH", "decimals": 18, "rpc": "https://mainnet.boba.network", "explorer": "https://bobascan.com"},
    "canto": {"chainId": 7700, "name": "Canto", "symbol": "CANTO", "decimals": 18, "rpc": "https://canto.gravitychain.io", "explorer": "https://cantoscan.com"},
    "zkfair": {"chainId": 42766, "name": "ZKFair", "symbol": "USDC", "decimals": 18, "rpc": "https://rpc.zkfair.io", "explorer": "https://scan.zkfair.io"},
    # Non-EVM
    "xrp": {"name": "XRP Ledger", "symbol": "XRP", "decimals": 6, "type": "xrpl", "rpc": "wss://xrplcluster.com", "explorer": "https://xrpscan.com"},
    "solana": {"name": "Solana", "symbol": "SOL", "decimals": 9, "type": "solana", "rpc": f"{ANKR_RPC}/solana", "explorer": "https://solscan.io"},
    "bitcoin": {"name": "Bitcoin", "symbol": "BTC", "decimals": 8, "type": "bitcoin", "rpc": "https://blockstream.info/api", "explorer": "https://blockstream.info"},
    "tron": {"name": "Tron", "symbol": "TRX", "decimals": 6, "type": "tron", "rpc": "https://api.trongrid.io", "explorer": "https://tronscan.org"},
}

# Fallback prices
FALLBACK_PRICES = {
    "xrp": 2.35, "eth": 3450.0, "btc": 98500.0, "sol": 185.0,
    "bnb": 680.0, "matic": 0.52, "avax": 35.0, "ftm": 0.45,
    "cro": 0.12, "trx": 0.25, "one": 0.015, "celo": 0.75
}

# ===================== MODELS =====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class WalletCreate(BaseModel):
    name: str
    mnemonic: Optional[str] = None  # If None, generate new

class WalletImport(BaseModel):
    name: str
    mnemonic: str

class WalletResponse(BaseModel):
    id: str
    name: str
    addresses: Dict[str, str]
    created_at: str
    is_imported: bool

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

# ===================== AUTH HELPERS =====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user is None:
        raise credentials_exception
    return user

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password": get_password_hash(user_data.password),
        "name": user_data.name or user_data.email.split("@")[0],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.users.insert_one(user)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user.get("name"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        created_at=current_user["created_at"]
    )

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    return {"success": True, "message": "Profile updated"}

@api_router.put("/auth/password")
async def update_password(data: PasswordUpdate, current_user: dict = Depends(get_current_user)):
    """Update user password"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not verify_password(data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": get_password_hash(data.new_password)}}
    )
    
    return {"success": True, "message": "Password updated"}

# ===================== WALLET ROUTES =====================

@api_router.post("/wallets", response_model=WalletResponse)
async def create_wallet(data: WalletCreate, current_user: dict = Depends(get_current_user)):
    """Create a new wallet - mnemonic generated on frontend, addresses derived on frontend"""
    wallet_id = str(uuid.uuid4())
    
    wallet = {
        "id": wallet_id,
        "user_id": current_user["id"],
        "name": data.name,
        "encrypted_mnemonic": data.mnemonic,  # Frontend encrypts before sending
        "addresses": {},  # Will be populated by frontend
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_imported": False,
    }
    
    await db.wallets.insert_one(wallet)
    
    return WalletResponse(
        id=wallet_id,
        name=data.name,
        addresses={},
        created_at=wallet["created_at"],
        is_imported=False
    )

@api_router.post("/wallets/save-addresses")
async def save_wallet_addresses(wallet_id: str, addresses: Dict[str, str], current_user: dict = Depends(get_current_user)):
    """Save derived addresses for a wallet"""
    result = await db.wallets.update_one(
        {"id": wallet_id, "user_id": current_user["id"]},
        {"$set": {"addresses": addresses}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return {"success": True}

@api_router.post("/wallets/import", response_model=WalletResponse)
async def import_wallet(data: WalletImport, current_user: dict = Depends(get_current_user)):
    """Import an existing wallet"""
    wallet_id = str(uuid.uuid4())
    
    wallet = {
        "id": wallet_id,
        "user_id": current_user["id"],
        "name": data.name,
        "encrypted_mnemonic": data.mnemonic,
        "addresses": {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_imported": True,
    }
    
    await db.wallets.insert_one(wallet)
    
    return WalletResponse(
        id=wallet_id,
        name=data.name,
        addresses={},
        created_at=wallet["created_at"],
        is_imported=True
    )

@api_router.get("/wallets", response_model=List[WalletResponse])
async def get_wallets(current_user: dict = Depends(get_current_user)):
    """Get all user's wallets"""
    wallets = await db.wallets.find(
        {"user_id": current_user["id"]},
        {"_id": 0, "encrypted_mnemonic": 0}
    ).to_list(100)
    
    return [WalletResponse(
        id=w["id"],
        name=w["name"],
        addresses=w.get("addresses", {}),
        created_at=w["created_at"],
        is_imported=w.get("is_imported", False)
    ) for w in wallets]

@api_router.delete("/wallets/{wallet_id}")
async def delete_wallet(wallet_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a wallet"""
    result = await db.wallets.delete_one({"id": wallet_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {"success": True}

# ===================== BLOCKCHAIN ROUTES =====================

@api_router.get("/chains")
async def get_supported_chains():
    """Get list of supported chains"""
    return {"chains": SUPPORTED_CHAINS}

@api_router.post("/balance/evm")
async def get_evm_balance(chain: str, address: str):
    """Get native balance for EVM chain"""
    if chain not in SUPPORTED_CHAINS:
        raise HTTPException(status_code=400, detail="Unsupported chain")
    
    chain_config = SUPPORTED_CHAINS[chain]
    if "chainId" not in chain_config:
        raise HTTPException(status_code=400, detail="Not an EVM chain")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                chain_config["rpc"],
                json={
                    "jsonrpc": "2.0",
                    "method": "eth_getBalance",
                    "params": [address, "latest"],
                    "id": 1
                }
            )
            data = response.json()
            
            if "result" in data:
                balance_wei = int(data["result"], 16)
                balance = balance_wei / (10 ** chain_config["decimals"])
                return {
                    "chain": chain,
                    "address": address,
                    "balance": balance,
                    "symbol": chain_config["symbol"]
                }
            else:
                return {"chain": chain, "address": address, "balance": 0, "symbol": chain_config["symbol"]}
    except Exception as e:
        logging.error(f"Error fetching {chain} balance: {e}")
        return {"chain": chain, "address": address, "balance": 0, "symbol": chain_config["symbol"], "error": str(e)}

@api_router.post("/balance/xrp")
async def get_xrp_balance(address: str):
    """Get XRP balance from XRPL"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://xrplcluster.com",
                json={
                    "method": "account_info",
                    "params": [{
                        "account": address,
                        "ledger_index": "validated"
                    }]
                }
            )
            data = response.json()
            
            if "result" in data and "account_data" in data["result"]:
                balance_drops = int(data["result"]["account_data"]["Balance"])
                balance = balance_drops / 1_000_000  # Convert drops to XRP
                return {"chain": "xrp", "address": address, "balance": balance, "symbol": "XRP"}
            else:
                return {"chain": "xrp", "address": address, "balance": 0, "symbol": "XRP"}
    except Exception as e:
        logging.error(f"Error fetching XRP balance: {e}")
        return {"chain": "xrp", "address": address, "balance": 0, "symbol": "XRP", "error": str(e)}

@api_router.post("/balance/solana")
async def get_solana_balance(address: str):
    """Get SOL balance"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{ANKR_RPC}/solana",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getBalance",
                    "params": [address]
                }
            )
            data = response.json()
            
            if "result" in data and "value" in data["result"]:
                balance_lamports = data["result"]["value"]
                balance = balance_lamports / 1_000_000_000  # Convert lamports to SOL
                return {"chain": "solana", "address": address, "balance": balance, "symbol": "SOL"}
            else:
                return {"chain": "solana", "address": address, "balance": 0, "symbol": "SOL"}
    except Exception as e:
        logging.error(f"Error fetching SOL balance: {e}")
        return {"chain": "solana", "address": address, "balance": 0, "symbol": "SOL", "error": str(e)}

@api_router.post("/balance/bitcoin")
async def get_bitcoin_balance(address: str):
    """Get BTC balance from Blockstream"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"https://blockstream.info/api/address/{address}")
            if response.status_code == 200:
                data = response.json()
                # Balance in satoshis
                funded = data.get("chain_stats", {}).get("funded_txo_sum", 0)
                spent = data.get("chain_stats", {}).get("spent_txo_sum", 0)
                balance_sats = funded - spent
                balance = balance_sats / 100_000_000  # Convert to BTC
                return {"chain": "bitcoin", "address": address, "balance": balance, "symbol": "BTC"}
            else:
                return {"chain": "bitcoin", "address": address, "balance": 0, "symbol": "BTC"}
    except Exception as e:
        logging.error(f"Error fetching BTC balance: {e}")
        return {"chain": "bitcoin", "address": address, "balance": 0, "symbol": "BTC", "error": str(e)}

@api_router.post("/balance/tron")
async def get_tron_balance(address: str):
    """Get TRX balance"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.trongrid.io/wallet/getaccount",
                json={"address": address, "visible": True}
            )
            if response.status_code == 200:
                data = response.json()
                balance_sun = data.get("balance", 0)
                balance = balance_sun / 1_000_000  # Convert sun to TRX
                return {"chain": "tron", "address": address, "balance": balance, "symbol": "TRX"}
            else:
                return {"chain": "tron", "address": address, "balance": 0, "symbol": "TRX"}
    except Exception as e:
        logging.error(f"Error fetching TRX balance: {e}")
        return {"chain": "tron", "address": address, "balance": 0, "symbol": "TRX", "error": str(e)}

@api_router.post("/balances/multi")
async def get_multi_chain_balances(addresses: Dict[str, str]):
    """Get balances for multiple chains at once"""
    results = {}
    
    for chain, address in addresses.items():
        if not address:
            continue
            
        try:
            if chain == "xrp":
                result = await get_xrp_balance(address)
            elif chain == "solana":
                result = await get_solana_balance(address)
            elif chain == "bitcoin":
                result = await get_bitcoin_balance(address)
            elif chain == "tron":
                result = await get_tron_balance(address)
            elif chain in SUPPORTED_CHAINS and "chainId" in SUPPORTED_CHAINS.get(chain, {}):
                result = await get_evm_balance(chain, address)
            else:
                result = {"chain": chain, "balance": 0}
            
            results[chain] = result
        except Exception as e:
            logging.error(f"Error fetching {chain} balance: {e}")
            results[chain] = {"chain": chain, "balance": 0, "error": str(e)}
    
    return {"balances": results}

# ===================== PRICE ROUTES =====================

@api_router.get("/prices")
async def get_prices():
    """Get current prices for supported cryptocurrencies"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/simple/price",
                params={
                    "ids": "ripple,ethereum,bitcoin,solana,binancecoin,matic-network,avalanche-2,fantom,tron,harmony",
                    "vs_currencies": "usd",
                    "include_24hr_change": "true"
                }
            )
            
            if response.status_code != 200:
                return {"prices": FALLBACK_PRICES, "changes": {}, "source": "fallback"}
            
            data = response.json()
            
            if "status" in data:
                return {"prices": FALLBACK_PRICES, "changes": {}, "source": "fallback"}
            
            prices = {
                "xrp": data.get("ripple", {}).get("usd", FALLBACK_PRICES["xrp"]),
                "eth": data.get("ethereum", {}).get("usd", FALLBACK_PRICES["eth"]),
                "btc": data.get("bitcoin", {}).get("usd", FALLBACK_PRICES["btc"]),
                "sol": data.get("solana", {}).get("usd", FALLBACK_PRICES["sol"]),
                "bnb": data.get("binancecoin", {}).get("usd", FALLBACK_PRICES["bnb"]),
                "matic": data.get("matic-network", {}).get("usd", FALLBACK_PRICES["matic"]),
                "avax": data.get("avalanche-2", {}).get("usd", FALLBACK_PRICES.get("avax", 35)),
                "ftm": data.get("fantom", {}).get("usd", FALLBACK_PRICES.get("ftm", 0.45)),
                "trx": data.get("tron", {}).get("usd", FALLBACK_PRICES.get("trx", 0.25)),
                "one": data.get("harmony", {}).get("usd", FALLBACK_PRICES.get("one", 0.015)),
            }
            
            changes = {
                "xrp": data.get("ripple", {}).get("usd_24h_change", 0),
                "eth": data.get("ethereum", {}).get("usd_24h_change", 0),
                "btc": data.get("bitcoin", {}).get("usd_24h_change", 0),
                "sol": data.get("solana", {}).get("usd_24h_change", 0),
                "bnb": data.get("binancecoin", {}).get("usd_24h_change", 0),
            }
            
            return {"prices": prices, "changes": changes, "source": "coingecko"}
    except Exception as e:
        logging.error(f"Error fetching prices: {e}")
        return {"prices": FALLBACK_PRICES, "changes": {}, "source": "fallback"}

@api_router.get("/prices/history/{coin_id}")
async def get_price_history(coin_id: str, days: int = 7):
    """Get price history for a coin"""
    coin_map = {
        "xrp": "ripple", "eth": "ethereum", "btc": "bitcoin",
        "sol": "solana", "bnb": "binancecoin", "matic": "matic-network"
    }
    
    gecko_id = coin_map.get(coin_id.lower(), "ripple")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/coins/{gecko_id}/market_chart",
                params={"vs_currency": "usd", "days": days}
            )
            
            if response.status_code != 200:
                return generate_mock_history(coin_id, days)
            
            data = response.json()
            
            if "status" in data or "prices" not in data:
                return generate_mock_history(coin_id, days)
            
            prices = [{"timestamp": p[0], "price": p[1]} for p in data.get("prices", [])]
            return {"coin_id": coin_id, "prices": prices, "days": days}
    except Exception as e:
        logging.error(f"Error fetching price history: {e}")
        return generate_mock_history(coin_id, days)

def generate_mock_history(coin_id: str, days: int):
    import random
    base_price = FALLBACK_PRICES.get(coin_id.lower(), 2.35)
    now = datetime.now(timezone.utc).timestamp() * 1000
    prices = []
    current = base_price * random.uniform(0.9, 0.95)
    
    for i in range(days * 24):
        timestamp = now - ((days * 24 - i) * 3600000)
        volatility = random.uniform(-0.02, 0.02)
        current = current * (1 + volatility)
        current = max(current, base_price * 0.8)
        current = min(current, base_price * 1.2)
        prices.append({"timestamp": timestamp, "price": round(current, 4)})
    
    return {"coin_id": coin_id, "prices": prices, "days": days}

# ===================== SWAP ROUTES =====================

@api_router.post("/swap/quote")
async def get_swap_quote(from_chain: str, to_chain: str, from_token: str, to_token: str, amount: str):
    """Get swap quote - simulated for now"""
    prices_data = await get_prices()
    prices = prices_data.get("prices", FALLBACK_PRICES)
    
    from_price = prices.get(from_token.lower(), 1.0)
    to_price = prices.get(to_token.lower(), 1.0)
    
    from_amount = float(amount)
    from_value = from_amount * from_price
    to_amount = from_value / to_price * 0.995  # 0.5% slippage
    
    return {
        "from_token": from_token,
        "to_token": to_token,
        "from_amount": amount,
        "to_amount": str(round(to_amount, 6)),
        "exchange_rate": round(to_amount / from_amount, 6) if from_amount > 0 else 0,
        "gas_estimate": "0.001 " + from_token.upper(),
        "provider": "XRP DEX" if "xrp" in [from_token.lower(), to_token.lower()] else "1inch",
    }

# ===================== STATUS =====================

@api_router.get("/")
async def root():
    return {"message": "XRP Nexus Terminal API v2", "version": "2.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
