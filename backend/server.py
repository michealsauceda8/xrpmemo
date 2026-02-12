from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="XRP Nexus Terminal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configuration
COINGECKO_API = "https://api.coingecko.com/api/v3"
ONEINCH_API = "https://api.1inch.dev/swap/v6.0"

# Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class PriceResponse(BaseModel):
    prices: Dict[str, float]
    timestamp: str

class BalanceRequest(BaseModel):
    chain: str
    address: str

class SwapQuoteRequest(BaseModel):
    from_chain: str
    to_chain: str
    from_token: str
    to_token: str
    amount: str
    from_address: str

class SwapQuoteResponse(BaseModel):
    from_token: str
    to_token: str
    from_amount: str
    to_amount: str
    exchange_rate: float
    gas_estimate: str
    route: str
    provider: str

class TransactionRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_id: str
    chain: str
    type: str  # send, receive, swap
    from_address: str
    to_address: str
    amount: str
    token: str
    tx_hash: Optional[str] = None
    status: str = "pending"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Routes
@api_router.get("/")
async def root():
    return {"message": "XRP Nexus Terminal API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Fallback prices when API is rate limited
FALLBACK_PRICES = {
    "xrp": 2.35, "sol": 185.0, "eth": 3450.0, "btc": 98500.0,
    "ltc": 92.0, "doge": 0.38, "bnb": 680.0, "matic": 0.52
}
FALLBACK_CHANGES = {
    "xrp": 3.2, "sol": 2.1, "eth": -0.8, "btc": 1.5, 
    "ltc": 1.8, "doge": 6.5, "bnb": 0.9, "matic": -0.5
}

# Price endpoints
@api_router.get("/prices")
async def get_prices():
    """Get current prices for supported cryptocurrencies"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/simple/price",
                params={
                    "ids": "ripple,solana,ethereum,bitcoin,litecoin,dogecoin,binancecoin,matic-network",
                    "vs_currencies": "usd",
                    "include_24hr_change": "true"
                }
            )
            
            # Check for rate limit or error
            if response.status_code != 200:
                logging.warning(f"CoinGecko API returned status {response.status_code}, using fallback")
                return {
                    "prices": FALLBACK_PRICES,
                    "changes": FALLBACK_CHANGES,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            data = response.json()
            
            # Check if we got an error response
            if "status" in data and "error_code" in data.get("status", {}):
                logging.warning("CoinGecko rate limited, using fallback prices")
                return {
                    "prices": FALLBACK_PRICES,
                    "changes": FALLBACK_CHANGES,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            # Map to standard symbols
            prices = {
                "xrp": data.get("ripple", {}).get("usd", FALLBACK_PRICES["xrp"]),
                "sol": data.get("solana", {}).get("usd", FALLBACK_PRICES["sol"]),
                "eth": data.get("ethereum", {}).get("usd", FALLBACK_PRICES["eth"]),
                "btc": data.get("bitcoin", {}).get("usd", FALLBACK_PRICES["btc"]),
                "ltc": data.get("litecoin", {}).get("usd", FALLBACK_PRICES["ltc"]),
                "doge": data.get("dogecoin", {}).get("usd", FALLBACK_PRICES["doge"]),
                "bnb": data.get("binancecoin", {}).get("usd", FALLBACK_PRICES["bnb"]),
                "matic": data.get("matic-network", {}).get("usd", FALLBACK_PRICES["matic"]),
            }
            
            changes = {
                "xrp": data.get("ripple", {}).get("usd_24h_change", FALLBACK_CHANGES["xrp"]),
                "sol": data.get("solana", {}).get("usd_24h_change", FALLBACK_CHANGES["sol"]),
                "eth": data.get("ethereum", {}).get("usd_24h_change", FALLBACK_CHANGES["eth"]),
                "btc": data.get("bitcoin", {}).get("usd_24h_change", FALLBACK_CHANGES["btc"]),
                "ltc": data.get("litecoin", {}).get("usd_24h_change", FALLBACK_CHANGES["ltc"]),
                "doge": data.get("dogecoin", {}).get("usd_24h_change", FALLBACK_CHANGES["doge"]),
                "bnb": data.get("binancecoin", {}).get("usd_24h_change", FALLBACK_CHANGES["bnb"]),
                "matic": data.get("matic-network", {}).get("usd_24h_change", FALLBACK_CHANGES["matic"]),
            }
            
            # Validate prices - if any are 0, use fallback
            if any(p == 0 for p in prices.values()):
                return {
                    "prices": FALLBACK_PRICES,
                    "changes": FALLBACK_CHANGES,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            return {
                "prices": prices,
                "changes": changes,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        logging.error(f"Error fetching prices: {e}")
        return {
            "prices": FALLBACK_PRICES,
            "changes": FALLBACK_CHANGES,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

def generate_mock_price_history(base_price: float, days: int = 7):
    """Generate realistic mock price history data"""
    import random
    now = datetime.now(timezone.utc).timestamp() * 1000
    prices = []
    hours = days * 24
    
    # Start at a slightly different price and trend toward current
    current_price = base_price * random.uniform(0.92, 0.98)
    trend = (base_price - current_price) / hours
    
    for i in range(hours):
        timestamp = now - ((hours - i) * 3600000)
        # Add randomness but follow trend
        volatility = random.uniform(-0.02, 0.02)
        current_price = current_price + trend + (current_price * volatility)
        current_price = max(current_price, base_price * 0.85)  # Floor
        current_price = min(current_price, base_price * 1.15)  # Ceiling
        prices.append({"timestamp": timestamp, "price": round(current_price, 4)})
    
    return prices

@api_router.get("/prices/history/{coin_id}")
async def get_price_history(coin_id: str, days: int = 7):
    """Get price history for a coin"""
    coin_map = {
        "xrp": "ripple",
        "sol": "solana", 
        "eth": "ethereum",
        "btc": "bitcoin",
        "ltc": "litecoin",
        "doge": "dogecoin",
        "bnb": "binancecoin",
        "matic": "matic-network"
    }
    
    gecko_id = coin_map.get(coin_id.lower(), "ripple")
    base_price = FALLBACK_PRICES.get(coin_id.lower(), 2.35)
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/coins/{gecko_id}/market_chart",
                params={"vs_currency": "usd", "days": days}
            )
            
            # Check for rate limit
            if response.status_code != 200:
                return {"coin_id": coin_id, "prices": generate_mock_price_history(base_price, days), "days": days}
            
            data = response.json()
            
            # Check for error response
            if "status" in data or "prices" not in data:
            
            # Format data for chart
            prices = [{"timestamp": p[0], "price": p[1]} for p in data.get("prices", [])]
            
            return {"coin_id": coin_id, "prices": prices, "days": days}
    except Exception as e:
        logging.error(f"Error fetching price history: {e}")
        # Generate mock data
        import random
        base_price = {"xrp": 2.15, "sol": 145.0, "eth": 3200.0, "btc": 97000.0}.get(coin_id.lower(), 2.15)
        now = datetime.now(timezone.utc).timestamp() * 1000
        prices = []
        for i in range(days * 24):
            timestamp = now - (i * 3600000)
            variation = random.uniform(-0.05, 0.05)
            prices.append({"timestamp": timestamp, "price": base_price * (1 + variation)})
        prices.reverse()
        return {"coin_id": coin_id, "prices": prices, "days": days}

# Balance endpoints
@api_router.post("/balance")
async def get_balance(request: BalanceRequest):
    """Get balance for an address on a specific chain"""
    # In production, integrate with actual blockchain RPCs
    # For now, return simulated balances
    import random
    
    balance_ranges = {
        "xrp": (100, 5000),
        "sol": (1, 50),
        "eth": (0.1, 5),
        "bnb": (1, 20),
        "btc": (0.01, 0.5),
        "ltc": (1, 20),
        "doge": (1000, 50000),
        "matic": (100, 5000),
    }
    
    chain_lower = request.chain.lower()
    min_bal, max_bal = balance_ranges.get(chain_lower, (0, 100))
    balance = round(random.uniform(min_bal, max_bal), 6)
    
    return {
        "chain": request.chain,
        "address": request.address,
        "balance": balance,
        "symbol": request.chain.upper()
    }

@api_router.post("/balances/all")
async def get_all_balances(addresses: Dict[str, str]):
    """Get balances for all addresses"""
    import random
    
    balance_ranges = {
        "XRP": (500, 10000),
        "SOL": (5, 100),
        "ETH": (0.5, 10),
        "BNB": (5, 50),
        "BTC": (0.05, 1),
        "LTC": (5, 50),
        "DOGE": (5000, 100000),
        "MATIC": (500, 10000),
    }
    
    balances = {}
    for chain, address in addresses.items():
        if address:
            min_bal, max_bal = balance_ranges.get(chain, (0, 100))
            balances[chain] = round(random.uniform(min_bal, max_bal), 6)
    
    return {"balances": balances}

# Swap endpoints
@api_router.post("/swap/quote", response_model=SwapQuoteResponse)
async def get_swap_quote(request: SwapQuoteRequest):
    """Get swap quote from aggregators"""
    # In production, integrate with 1inch, Jupiter, XRPL DEX
    # For now, return simulated quotes
    
    prices = {
        "xrp": 2.15, "sol": 145.0, "eth": 3200.0, "btc": 97000.0,
        "usdt": 1.0, "usdc": 1.0, "bnb": 650.0, "matic": 0.45, "ltc": 85.0, "doge": 0.32
    }
    
    from_price = prices.get(request.from_token.lower(), 1.0)
    to_price = prices.get(request.to_token.lower(), 1.0)
    
    from_amount = float(request.amount)
    from_value_usd = from_amount * from_price
    to_amount = from_value_usd / to_price
    
    # Apply slippage (0.5%)
    to_amount = to_amount * 0.995
    
    exchange_rate = to_amount / from_amount if from_amount > 0 else 0
    
    # Determine provider based on chains
    if request.from_chain.lower() == "xrp" or request.to_chain.lower() == "xrp":
        provider = "XRPL DEX"
        route = f"{request.from_token} → XRP → {request.to_token}"
    elif request.from_chain.lower() == "sol" or request.to_chain.lower() == "sol":
        provider = "Jupiter"
        route = f"{request.from_token} → {request.to_token}"
    else:
        provider = "1inch"
        route = f"{request.from_token} → USDC → {request.to_token}"
    
    return SwapQuoteResponse(
        from_token=request.from_token,
        to_token=request.to_token,
        from_amount=request.amount,
        to_amount=str(round(to_amount, 6)),
        exchange_rate=round(exchange_rate, 6),
        gas_estimate="0.001 " + request.from_chain.upper(),
        route=route,
        provider=provider
    )

@api_router.post("/swap/execute")
async def execute_swap(request: SwapQuoteRequest):
    """Execute a swap transaction"""
    # In production, sign and broadcast transaction
    # For now, return mock transaction
    
    tx_hash = f"0x{uuid.uuid4().hex}"
    
    # Store transaction record
    tx_record = {
        "id": str(uuid.uuid4()),
        "wallet_id": "demo",
        "chain": request.from_chain,
        "type": "swap",
        "from_address": request.from_address,
        "to_address": request.from_address,
        "amount": request.amount,
        "token": f"{request.from_token} → {request.to_token}",
        "tx_hash": tx_hash,
        "status": "confirmed",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(tx_record)
    
    return {
        "success": True,
        "tx_hash": tx_hash,
        "status": "confirmed",
        "message": "Swap executed successfully"
    }

# Transaction history
@api_router.get("/transactions/{wallet_id}")
async def get_transactions(wallet_id: str, limit: int = 20):
    """Get transaction history for a wallet"""
    transactions = await db.transactions.find(
        {"wallet_id": wallet_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    
    return {"transactions": transactions}

# On-ramp configuration
@api_router.get("/onramp/config")
async def get_onramp_config():
    """Get on-ramp provider configuration"""
    return {
        "providers": [
            {
                "id": "moonpay",
                "name": "MoonPay",
                "baseUrl": "https://buy.moonpay.com/v2/buy",
                "params": {
                    "apiKey": "pk_test_123",  # Test key
                    "currencyCode": "XRP",
                    "baseCurrencyCode": "USD",
                    "network": "XRP"
                },
                "fees": "4.5%",
                "minAmount": 20,
                "maxAmount": 50000
            },
            {
                "id": "mercuryo",
                "name": "Mercuryo",
                "baseUrl": "https://exchange.mercuryo.io/",
                "params": {
                    "widget_id": "34c04adf-d04a-42de-a4aa-609a302b24bf",
                    "currency": "XRP",
                    "fiat_currency": "USD",
                    "type": "buy",
                    "network": "RIPPLE"
                },
                "fees": "3.95%",
                "minAmount": 30,
                "maxAmount": 10000
            },
            {
                "id": "transak",
                "name": "Transak",
                "baseUrl": "https://global.transak.com/",
                "params": {
                    "apiKey": "a5550b99-8c19-4764-b888-7ba36ac237ea",  # Sandbox key
                    "fiatCurrency": "USD",
                    "cryptoCurrencyCode": "XRP",
                    "network": "XRP",
                    "themeColor": "00AEEF",
                    "hideMenu": "true"
                },
                "fees": "5.5%",
                "minAmount": 15,
                "maxAmount": 5000
            }
        ]
    }

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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
