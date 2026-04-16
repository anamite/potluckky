import requests
import sys
import json
from datetime import datetime

class PotluckAPITester:
    def __init__(self, base_url="https://group-dining-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json() if response.text else {}
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response_data and isinstance(response_data, dict):
                    if 'success' in response_data:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response keys: {list(response_data.keys())}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response_data}")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": response_data
            })

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_basic_endpoints(self):
        """Test basic GET endpoints"""
        print("\n=== Testing Basic GET Endpoints ===")
        
        # Test root API endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test dishes endpoint
        success, dishes_data = self.run_test("Get Dishes", "GET", "dishes", 200)
        
        # Test enriched dishes endpoint
        success, enriched_data = self.run_test("Get Enriched Dishes", "GET", "dishes/enriched", 200)
        
        # Test participants endpoint
        success, participants_data = self.run_test("Get Participants", "GET", "participants", 200)
        
        # Test contributions endpoint
        success, contributions_data = self.run_test("Get All Contributions", "GET", "contributions/all", 200)
        
        return dishes_data, enriched_data, participants_data, contributions_data

    def test_contribution_submission(self):
        """Test contribution submission with existing dish"""
        print("\n=== Testing Contribution Submission ===")
        
        # First get available dishes
        success, dishes = self.run_test("Get Dishes for Submission", "GET", "dishes", 200)
        
        if not success or not dishes:
            print("❌ Cannot test contribution submission - no dishes available")
            return False
        
        # Use the first available dish
        dish_id = dishes[0]['id']
        dish_name = dishes[0]['name']
        print(f"   Using dish: {dish_name} (ID: {dish_id})")
        
        # Test contribution submission
        test_contribution = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "total_people": 5,
            "kids_above_6": 2,
            "dish_entries": [
                {
                    "dish_choice": "existing",
                    "selected_dish_id": dish_id,
                    "new_dish_name": "",
                    "new_dish_description": "",
                    "quantity_people": 10
                }
            ]
        }
        
        success, response = self.run_test(
            "Submit Contribution (Existing Dish)",
            "POST",
            "contributions/submit",
            200,
            data=test_contribution
        )
        
        return success

    def test_new_dish_submission(self):
        """Test contribution submission with new dish"""
        print("\n=== Testing New Dish Submission ===")
        
        timestamp = datetime.now().strftime('%H%M%S')
        new_dish_contribution = {
            "name": f"Test User New Dish {timestamp}",
            "total_people": 3,
            "kids_above_6": 1,
            "dish_entries": [
                {
                    "dish_choice": "new",
                    "selected_dish_id": "",
                    "new_dish_name": f"Test Dish {timestamp}",
                    "new_dish_description": "A test dish created during testing",
                    "quantity_people": 8
                }
            ]
        }
        
        success, response = self.run_test(
            "Submit Contribution (New Dish)",
            "POST",
            "contributions/submit",
            200,
            data=new_dish_contribution
        )
        
        return success

    def test_multi_dish_submission(self):
        """Test contribution submission with multiple dishes"""
        print("\n=== Testing Multi-Dish Submission ===")
        
        # Get available dishes first
        success, dishes = self.run_test("Get Dishes for Multi-Dish", "GET", "dishes", 200)
        
        if not success or len(dishes) < 1:
            print("❌ Cannot test multi-dish submission - insufficient dishes")
            return False
        
        timestamp = datetime.now().strftime('%H%M%S')
        multi_dish_contribution = {
            "name": f"Multi Dish User {timestamp}",
            "total_people": 8,
            "kids_above_6": 3,
            "dish_entries": [
                {
                    "dish_choice": "existing",
                    "selected_dish_id": dishes[0]['id'],
                    "new_dish_name": "",
                    "new_dish_description": "",
                    "quantity_people": 5
                },
                {
                    "dish_choice": "new",
                    "selected_dish_id": "",
                    "new_dish_name": f"Multi Test Dish {timestamp}",
                    "new_dish_description": "Second dish in multi-dish test",
                    "quantity_people": 7
                }
            ]
        }
        
        success, response = self.run_test(
            "Submit Multi-Dish Contribution",
            "POST",
            "contributions/submit",
            200,
            data=multi_dish_contribution
        )
        
        return success

    def test_error_cases(self):
        """Test error handling"""
        print("\n=== Testing Error Cases ===")
        
        # Test empty name
        empty_name_data = {
            "name": "",
            "total_people": 1,
            "kids_above_6": 0,
            "dish_entries": []
        }
        self.run_test("Empty Name Error", "POST", "contributions/submit", 400, data=empty_name_data)
        
        # Test no dish entries
        no_dishes_data = {
            "name": "Test User",
            "total_people": 1,
            "kids_above_6": 0,
            "dish_entries": []
        }
        self.run_test("No Dish Entries Error", "POST", "contributions/submit", 400, data=no_dishes_data)
        
        # Test invalid dish choice
        invalid_dish_data = {
            "name": "Test User",
            "total_people": 1,
            "kids_above_6": 0,
            "dish_entries": [
                {
                    "dish_choice": "existing",
                    "selected_dish_id": "",
                    "new_dish_name": "",
                    "new_dish_description": "",
                    "quantity_people": 1
                }
            ]
        }
        self.run_test("Invalid Dish Selection Error", "POST", "contributions/submit", 400, data=invalid_dish_data)

def main():
    print("🧪 Starting Potluck Planner API Tests")
    print("=" * 50)
    
    tester = PotluckAPITester()
    
    # Test basic endpoints
    dishes, enriched, participants, contributions = tester.test_basic_endpoints()
    
    # Test contribution submissions
    tester.test_contribution_submission()
    tester.test_new_dish_submission()
    tester.test_multi_dish_submission()
    
    # Test error cases
    tester.test_error_cases()
    
    # Print final results
    print(f"\n📊 Final Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if not t['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            error_msg = test.get('error', f'Status {test.get("actual_status", "unknown")}')
            print(f"   - {test['name']}: {error_msg}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())