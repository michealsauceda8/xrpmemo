"""
Backend API tests for XRP Nexus Terminal
Tests: Authentication, Wallet, Blockchain, and Price endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Health and root endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"PASS: Health endpoint - status: {data.get('status')}")
    
    def test_root_endpoint(self):
        """Test /api/ root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: Root endpoint - message: {data.get('message')}")


class TestAuthentication:
    """Authentication endpoint tests - Register, Login, Profile"""
    
    @pytest.fixture
    def unique_email(self):
        """Generate unique email for testing"""
        return f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    def test_register_new_user(self, unique_email):
        """Test user registration with unique email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "TestPass123",
                "name": "Test User"
            }
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == unique_email.lower()
        assert data["user"]["name"] == "Test User"
        assert "id" in data["user"]
        print(f"PASS: User registration - email: {unique_email}")
        
        return data["access_token"]
    
    def test_register_duplicate_email(self):
        """Test registration with existing email fails"""
        email = "duplicate_test@example.com"
        
        # First registration
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "TestPass123", "name": "First User"}
        )
        
        # Second registration should fail
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "TestPass456", "name": "Second User"}
        )
        assert response.status_code == 400
        print("PASS: Duplicate registration rejected")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        # First register a user
        email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "TestPass123"}
        )
        
        # Now login
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": "TestPass123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == email.lower()
        print(f"PASS: Login successful - email: {email}")
        
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("PASS: Invalid credentials rejected")
    
    def test_get_me_authenticated(self):
        """Test /auth/me with valid token"""
        # Register and get token
        email = f"me_test_{uuid.uuid4().hex[:8]}@example.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "TestPass123", "name": "Me Test"}
        )
        token = reg_response.json()["access_token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email.lower()
        print(f"PASS: Get user info - email: {data['email']}")
    
    def test_get_me_unauthenticated(self):
        """Test /auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("PASS: Unauthenticated request rejected")


class TestWallet:
    """Wallet CRUD endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for wallet tests"""
        email = f"wallet_test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "TestPass123"}
        )
        return response.json()["access_token"]
    
    def test_create_wallet(self, auth_token):
        """Test wallet creation"""
        response = requests.post(
            f"{BASE_URL}/api/wallets",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "Test Wallet"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Wallet"
        print(f"PASS: Wallet created - id: {data['id']}")
        
        return data["id"]
    
    def test_get_wallets(self, auth_token):
        """Test get all wallets"""
        # First create a wallet
        requests.post(
            f"{BASE_URL}/api/wallets",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "Listed Wallet"}
        )
        
        # Get wallets
        response = requests.get(
            f"{BASE_URL}/api/wallets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"PASS: Get wallets - count: {len(data)}")
    
    def test_delete_wallet(self, auth_token):
        """Test wallet deletion"""
        # Create wallet
        create_response = requests.post(
            f"{BASE_URL}/api/wallets",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "Wallet to Delete"}
        )
        wallet_id = create_response.json()["id"]
        
        # Delete wallet
        response = requests.delete(
            f"{BASE_URL}/api/wallets/{wallet_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print(f"PASS: Wallet deleted - id: {wallet_id}")
    
    def test_import_wallet(self, auth_token):
        """Test wallet import"""
        response = requests.post(
            f"{BASE_URL}/api/wallets/import",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Imported Wallet",
                "mnemonic": "test encrypted mnemonic data"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_imported"] == True
        print(f"PASS: Wallet imported - id: {data['id']}")


class TestBlockchain:
    """Blockchain balance endpoint tests"""
    
    def test_get_supported_chains(self):
        """Test /chains endpoint"""
        response = requests.get(f"{BASE_URL}/api/chains")
        assert response.status_code == 200
        data = response.json()
        assert "chains" in data
        chains = data["chains"]
        # Verify key chains are present
        assert "xrp" in chains
        assert "ethereum" in chains
        assert "bitcoin" in chains
        assert "solana" in chains
        print(f"PASS: Supported chains - count: {len(chains)}")
    
    def test_evm_balance(self):
        """Test EVM balance endpoint"""
        # Use a known ETH address (Vitalik's address)
        test_address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        response = requests.post(
            f"{BASE_URL}/api/balance/evm?chain=ethereum&address={test_address}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert data["chain"] == "ethereum"
        assert data["symbol"] == "ETH"
        print(f"PASS: EVM balance fetch - chain: ethereum")
    
    def test_xrp_balance(self):
        """Test XRP balance endpoint"""
        # Use a known XRP address
        test_address = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
        response = requests.post(
            f"{BASE_URL}/api/balance/xrp?address={test_address}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert data["chain"] == "xrp"
        assert data["symbol"] == "XRP"
        print(f"PASS: XRP balance fetch - balance: {data['balance']}")
    
    def test_solana_balance(self):
        """Test Solana balance endpoint"""
        # Use a test Solana address
        test_address = "9WzDXwBbmPdCBoccEfm6CpLDCEQnzPf8JC5NV3MFfZj8"
        response = requests.post(
            f"{BASE_URL}/api/balance/solana?address={test_address}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert data["chain"] == "solana"
        print(f"PASS: Solana balance fetch - chain: solana")
    
    def test_bitcoin_balance(self):
        """Test Bitcoin balance endpoint"""
        # Use a known BTC address
        test_address = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
        response = requests.post(
            f"{BASE_URL}/api/balance/bitcoin?address={test_address}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert data["chain"] == "bitcoin"
        print(f"PASS: Bitcoin balance fetch")
    
    def test_multi_chain_balances(self):
        """Test multi-chain balance endpoint"""
        addresses = {
            "ethereum": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            "xrp": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
        }
        response = requests.post(
            f"{BASE_URL}/api/balances/multi",
            json=addresses
        )
        assert response.status_code == 200
        data = response.json()
        assert "balances" in data
        print(f"PASS: Multi-chain balance fetch - chains: {list(data['balances'].keys())}")


class TestPrices:
    """Price endpoint tests"""
    
    def test_get_prices(self):
        """Test /prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/prices")
        assert response.status_code == 200
        data = response.json()
        assert "prices" in data
        prices = data["prices"]
        # Verify key prices are present
        assert "xrp" in prices
        assert "eth" in prices
        assert "btc" in prices
        print(f"PASS: Prices fetched - XRP: ${prices['xrp']}")
    
    def test_price_history(self):
        """Test /prices/history endpoint"""
        response = requests.get(f"{BASE_URL}/api/prices/history/xrp?days=7")
        assert response.status_code == 200
        data = response.json()
        assert "prices" in data
        assert len(data["prices"]) > 0
        print(f"PASS: Price history fetched - points: {len(data['prices'])}")


class TestSwap:
    """Swap endpoint tests"""
    
    def test_swap_quote(self):
        """Test swap quote endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/swap/quote",
            params={
                "from_chain": "ethereum",
                "to_chain": "xrp",
                "from_token": "eth",
                "to_token": "xrp",
                "amount": "1"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "to_amount" in data
        assert "exchange_rate" in data
        print(f"PASS: Swap quote - rate: {data['exchange_rate']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
