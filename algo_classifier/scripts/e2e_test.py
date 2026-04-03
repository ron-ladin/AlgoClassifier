import requests
import uuid
import time

# Base URL of our local Backend server
BASE_URL = "http://127.0.0.1:8000"

def run_e2e_tests():
    print("--- Starting Enhanced End-to-End Tests for AlgoClassifier ---")
    
    # 1. Arrange: Generate unique user credentials
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
    res_register = requests.post(f"{BASE_URL}/auth/register", json=test_user)
    assert res_register.status_code == 201, f"Registration failed: {res_register.text}"
    print("✓ Registration successful.")

    # ---------------------------------------------------------
    # TEST 2: User Authentication (Login)
    # ---------------------------------------------------------
    print("\n[Test 2] Authenticating...")
    login_data = {"username": test_user["email"], "password": test_user["password"]}
    res_login = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    assert res_login.status_code == 200, "Login failed"
    token = res_login.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful. JWT Token obtained.")

    # ---------------------------------------------------------
    # TEST 3: AI Classification
    # ---------------------------------------------------------
    print("\n[Test 3] Sending Question for AI Classification...")
    question_text = "Given a directed graph without negative cycles, find the shortest path."
    res_classify = requests.post(f"{BASE_URL}/questions/classify", json={"text": question_text}, headers=headers)
    assert res_classify.status_code == 200, "Classification failed"
    print(f"✓ AI Response received: {res_classify.json().get('catchyTitle')}")

    # ---------------------------------------------------------
    # TEST 4: Fetch History List (Summary View)
    # ---------------------------------------------------------
    print("\n[Test 4] Fetching User History (Summary)...")
    res_list = requests.get(f"{BASE_URL}/questions/", headers=headers)
    assert res_list.status_code == 200, "Fetching history failed"
    
    questions = res_list.json()
    assert isinstance(questions, list), "Expected a list of questions"
    assert len(questions) > 0, "Question list is empty"
    
    # Verify summary structure
    first_q = questions[0]
    assert "id" in first_q, "Question ID missing in summary"
    assert "catchyTitle" in first_q, "Title missing in summary"
    # Ensure heavy fields are NOT in summary for efficiency
    assert "thePunchline" not in first_q, "Security/Efficiency Breach: Full details leaked in summary"
    
    print(f"✓ History list retrieved. Total items: {len(questions)}")
    target_id = first_q["id"]

    # ---------------------------------------------------------
    # TEST 5: Fetch Specific Question Detail (Deep View)
    # ---------------------------------------------------------
    print(f"\n[Test 5] Fetching Full Details for ID: {target_id}")
    res_detail = requests.get(f"{BASE_URL}/questions/{target_id}", headers=headers)
    assert res_detail.status_code == 200, f"Detail fetch failed for {target_id}"
    
    detail_data = res_detail.json()
    print("--------------------------------------------------")
    print(f"TITLE:      {detail_data.get('catchyTitle')}")
    print(f"COMPLEXITY: {detail_data.get('runtimeComplexity')}")
    print(f"💡 THE PUNCHLINE: {detail_data.get('thePunchline')[:80]}...")
    print("--------------------------------------------------")
    
    assert "thePunchline" in detail_data, "Full detail missing the punchline"
    print("✓ Full details successfully retrieved and verified.")

    print("\n✅ All End-to-End tests passed successfully!")

if __name__ == "__main__":
    try:
        run_e2e_tests()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")