# import requests
# import os

# BASE_URL = "http://localhost:8000"

# def run_security_tests():
#     print("[INFO] Starting Security & Vulnerability Test...")

#     # --- Test 1: IDOR Vulnerability (Trying to guess Document IDs) ---
#     print("\n[Test 1] Attempting to guess document IDs (IDOR Test)...")
#     guessed_id = "33" # Old integer ID format
#     chat_payload = {
#         "document_id": guessed_id,
#         "question": "What is in this document?"
#     }
#     response = requests.post(f"{BASE_URL}/chat", json=chat_payload)
#     if response.status_code == 404 or response.status_code == 422:
#         print("[PASS] Server rejected the predictable ID (Status: {})".format(response.status_code))
#     else:
#         print(f"[FAIL] Server accepted a predictable ID! Status: {response.status_code}")

#     # --- Test 2: File Type Restriction ---
#     print("\n[Test 2] Attempting to upload a non-PDF file (.txt)...")
#     malicious_file = "hack.txt"
#     with open(malicious_file, "w") as f:
#         f.write("This is a malicious script")
        
#     with open(malicious_file, "rb") as f:
#         files = {"file": (malicious_file, f, "text/plain")}
#         upload_resp = requests.post(f"{BASE_URL}/documents/upload", files=files)
        
#     if upload_resp.status_code == 400:
#         print("[PASS] Server rejected the non-PDF file. (Status: 400)")
#     else:
#         print(f"[FAIL] Server allowed the non-PDF file! Status: {upload_resp.status_code}")
        
#     os.remove(malicious_file)
        
#     print("\n[INFO] Security Test Completed!")

# if __name__ == "__main__":
#     try:
#         run_security_tests()
#     except Exception as e:
#         print(f"Error connecting to server: {e}")
