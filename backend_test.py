#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class XRPWalletAPITester:
    def __init__(self, base_url="https://xrp-wallet-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.detailed_results = []

    def log_test_result(self, name, success, details=""):
        """Log test results for detailed reporting"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
            self.detailed_results.append({"test": name, "status": "PASSED", "details": details})
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.detailed_results.append({"test": name, "status": "FAILED", "details": details})

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            success = response.status_code == 200 and "XRP Nexus Terminal API" in response.text
            self.log_test_result("API Root Endpoint", success, 
                f"Status: {response.status_code}, Response: {response.text[:100]}")
            return success
        except Exception as e:
            self.log_test_result("API Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_prices_endpoint(self):
        """Test prices endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/prices")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["prices", "timestamp"]
                success = all(field in data for field in required_fields)
                
                if success and "prices" in data:
                    # Check for key cryptocurrencies
                    required_coins = ["xrp", "btc", "eth", "sol"]
                    prices = data.get("prices", {})
                    missing_coins = [coin for coin in required_coins if coin not in prices]
                    success = len(missing_coins) == 0
                    
                    details = f"Got {len(prices)} prices. Missing: {missing_coins}" if missing_coins else f"All {len(prices)} prices present"
                else:
                    details = f"Missing required fields: {[f for f in required_fields if f not in data]}"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("Prices Endpoint", success, details)
            return success, data if success else {}
        except Exception as e:
            self.log_test_result("Prices Endpoint", False, f"Exception: {str(e)}")
            return False, {}

    def test_price_history_endpoint(self):
        """Test price history endpoint for XRP"""
        try:
            response = self.session.get(f"{self.base_url}/prices/history/xrp?days=7")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["coin_id", "prices", "days"]
                success = all(field in data for field in required_fields)
                
                if success and "prices" in data:
                    prices = data.get("prices", [])
                    success = len(prices) > 0
                    
                    # Check price data structure
                    if success and len(prices) > 0:
                        first_price = prices[0]
                        success = "timestamp" in first_price and "price" in first_price
                        details = f"Got {len(prices)} price points" if success else "Invalid price data structure"
                    else:
                        details = "No price data returned"
                else:
                    details = f"Missing required fields: {[f for f in required_fields if f not in data]}"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("Price History Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test_result("Price History Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_balance_endpoints(self):
        """Test balance endpoints with mock addresses"""
        # Test single balance
        try:
            balance_request = {
                "chain": "XRP",
                "address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            }
            response = self.session.post(f"{self.base_url}/balance", json=balance_request)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["chain", "address", "balance", "symbol"]
                success = all(field in data for field in required_fields)
                details = f"Balance: {data.get('balance', 'N/A')} {data.get('symbol', 'N/A')}" if success else "Missing required fields"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("Single Balance Endpoint", success, details)
            single_balance_success = success
        except Exception as e:
            self.log_test_result("Single Balance Endpoint", False, f"Exception: {str(e)}")
            single_balance_success = False

        # Test all balances
        try:
            addresses_request = {
                "XRP": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
                "ETH": "0x742d35cc6488c532f4519bfabc5dbdfd6cd13d99",
                "SOL": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
            }
            response = self.session.post(f"{self.base_url}/balances/all", json=addresses_request)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "balances" in data
                
                if success:
                    balances = data.get("balances", {})
                    success = len(balances) > 0
                    details = f"Got balances for {len(balances)} chains: {list(balances.keys())}"
                else:
                    details = "No balances field in response"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("All Balances Endpoint", success, details)
            all_balances_success = success
        except Exception as e:
            self.log_test_result("All Balances Endpoint", False, f"Exception: {str(e)}")
            all_balances_success = False

        return single_balance_success and all_balances_success

    def test_swap_endpoints(self):
        """Test swap quote and execute endpoints"""
        # Test swap quote
        try:
            quote_request = {
                "from_chain": "XRP",
                "to_chain": "ETH", 
                "from_token": "XRP",
                "to_token": "ETH",
                "amount": "100",
                "from_address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            }
            response = self.session.post(f"{self.base_url}/swap/quote", json=quote_request)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["from_token", "to_token", "from_amount", "to_amount", "exchange_rate", "provider"]
                success = all(field in data for field in required_fields)
                
                if success:
                    details = f"Quote: {data['from_amount']} {data['from_token']} → {data['to_amount']} {data['to_token']} via {data['provider']}"
                else:
                    missing = [f for f in required_fields if f not in data]
                    details = f"Missing required fields: {missing}"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("Swap Quote Endpoint", success, details)
            quote_success = success
        except Exception as e:
            self.log_test_result("Swap Quote Endpoint", False, f"Exception: {str(e)}")
            quote_success = False

        # Test swap execute (will be mocked)
        try:
            execute_request = {
                "from_chain": "XRP",
                "to_chain": "ETH",
                "from_token": "XRP", 
                "to_token": "ETH",
                "amount": "10",
                "from_address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            }
            response = self.session.post(f"{self.base_url}/swap/execute", json=execute_request)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["success", "tx_hash", "status"]
                success = all(field in data for field in required_fields)
                details = f"TX Hash: {data.get('tx_hash', 'N/A')[:16]}..." if success else "Missing required response fields"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("Swap Execute Endpoint", success, details)
            execute_success = success
        except Exception as e:
            self.log_test_result("Swap Execute Endpoint", False, f"Exception: {str(e)}")
            execute_success = False

        return quote_success and execute_success

    def test_onramp_config(self):
        """Test on-ramp configuration endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/onramp/config")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "providers" in data
                
                if success:
                    providers = data.get("providers", [])
                    success = len(providers) >= 3  # Should have MoonPay, Mercuryo, Transak
                    
                    if success:
                        provider_names = [p.get("name", "") for p in providers]
                        expected_providers = ["MoonPay", "Mercuryo", "Transak"]
                        has_expected = all(p in provider_names for p in expected_providers)
                        success = has_expected
                        details = f"Found {len(providers)} providers: {provider_names}"
                    else:
                        details = f"Only {len(providers)} providers found, expected at least 3"
                else:
                    details = "No providers field in response"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                
            self.log_test_result("On-ramp Config Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test_result("On-ramp Config Endpoint", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting XRP Wallet Backend API Tests")
        print("=" * 50)
        
        # Run tests
        self.test_api_root()
        price_success, price_data = self.test_prices_endpoint()
        self.test_price_history_endpoint()
        self.test_balance_endpoints()
        self.test_swap_endpoints() 
        self.test_onramp_config()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Backend API Test Results:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend API tests passed!")
            return True, self.detailed_results
        else:
            print("⚠️  Some backend API tests failed. Check details above.")
            return False, self.detailed_results

def main():
    tester = XRPWalletAPITester()
    success, results = tester.run_all_tests()
    
    # Save detailed results
    with open('/tmp/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": tester.tests_passed/tester.tests_run if tester.tests_run > 0 else 0,
            "results": results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())