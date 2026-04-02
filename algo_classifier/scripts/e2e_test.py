import requests
import uuid

# Base URL of our local Backend server
BASE_URL = "http://127.0.0.1:8000"

def run_e2e_tests():
    print("--- Starting End-to-End Tests for AlgoClassifier ---")
    
    # 1. Arrange: Generate unique user credentials using UUID to bypass MongoDB Unique Index constraints
    unique_id = str(uuid.uuid4())[:8]
    test_user = {
        "username": f"test_user_{unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "SecurePassword123!"
    }
    
    # ---------------------------------------------------------
    # TEST 1: User Registration
    # ---------------------------------------------------------
    print(f"\n[Test 1] Registering user: {test_user['email']}")
    
    # Act
    res_register = requests.post(f"{BASE_URL}/auth/register", json=test_user)
    
    # Assert
    assert res_register.status_code == 201, f"Registration failed: {res_register.text}"
    print("✓ Registration successful. (Status: 201)")
    
    # ---------------------------------------------------------
    # TEST 2: User Authentication (Login)
    # ---------------------------------------------------------
    print("\n[Test 2] Authenticating via OAuth2 Form Data...")
    
    # Arrange: OAuth2 strictly requires Form Data (x-www-form-urlencoded), not JSON
    login_data = {
        "username": test_user["email"], # Or username, depending on how our login logic handles it (our form uses username field)
        "password": test_user["password"]
    }
    
    # Act
    res_login = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    # Assert
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    token = res_login.json().get("access_token")
    assert token is not None, "JWT Token missing from response"
    print("✓ Login successful. JWT Token obtained.")
    
    # ---------------------------------------------------------
    # TEST 3: AI Classification & Database Transaction
    # ---------------------------------------------------------
    print("\n[Test 3] Sending Algorithmic Question for AI Classification...")
    
    # Arrange
    question_payload = {
        "text": "Given a connected, undirected graph with weighted edges, find a subset of the edges that forms a tree that includes every vertex, where the total weight of all the edges in the tree is minimized. Note that processing the edges requires sorting them first."
    }
    
    # Crucial: Passing the JWT in the Authorization header as a Bearer token
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Act
    res_classify = requests.post(
        f"{BASE_URL}/questions/classify", 
        json=question_payload, 
        headers=headers
    )
    
    # Assert
    assert res_classify.status_code == 200, f"Classification failed: {res_classify.text}"
    
    result_data = res_classify.json()
    print("✓ Classification successful. AI Response received:")
    print("--------------------------------------------------")
    print(f"Title: {result_data.get('title')}")
    print(f"Category: {result_data.get('category')}")
    print(f"Complexity: Time {result_data.get('time_complexity')} | Space {result_data.get('space_complexity')}")
    print("--------------------------------------------------")
    print("\n✅ All End-to-End tests passed successfully!")

if __name__ == "__main__":
    try:
        run_e2e_tests()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
    except requests.exceptions.ConnectionError:
        print("\n❌ SERVER UNAVAILABLE: Make sure your FastAPI server is running on port 8000.")