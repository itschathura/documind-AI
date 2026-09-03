# import requests
# import time
# import os

# BASE_URL = "http://localhost:8000"

# def test_pipeline():
#     print("Starting RAG Pipeline Test...")
    
#     # Create a dummy PDF for testing if one doesn't exist
#     dummy_pdf = "dummy_test.pdf"
#     if not os.path.exists(dummy_pdf):
#         print(f"Creating a dummy PDF '{dummy_pdf}' for testing...")
#         try:
#             import pymupdf as fitz
#             doc = fitz.open()
#             page = doc.new_page()
#             page.insert_text((50, 50), "This is a test document. DocuMind AI is an AI-powered document intelligence platform. It uses Gemini for generating summaries and answering questions. It also uses ChromaDB to store vector embeddings for fast retrieval.")
#             doc.save(dummy_pdf)
#             doc.close()
#         except ImportError:
#             print("Please ensure PyMuPDF is installed: pip install pymupdf")
#             return

#     # 1. Test Upload
#     print("\n--- 1. Testing Document Upload & Processing ---")
#     with open(dummy_pdf, "rb") as f:
#         files = {"file": (dummy_pdf, f, "application/pdf")}
#         response = requests.post(f"{BASE_URL}/documents/upload", files=files)
        
#     if response.status_code != 200:
#         print(f"[ERROR] Upload Failed: {response.text}")
#         return
        
#     data = response.json()
#     doc_id = data.get("id")
#     print(f"[SUCCESS] Upload Successful!")
#     print(f"Document ID: {doc_id}")
#     print(f"Status: {data.get('status')}")
#     print(f"Total Chunks: {data.get('total_chunks')}")
#     print(f"Summary: {data.get('summary')}")
    
#     # 2. Test Chat/RAG
#     print("\n--- 2. Testing Chat/RAG (Asking a question) ---")
#     question = "What does DocuMind AI use for generating summaries?"
#     print(f"Question: {question}")
    
#     chat_payload = {
#         "document_id": doc_id,
#         "question": question
#     }
    
#     # Assuming chat route is something like /chat/ask or /chat (need to verify exact route, guessing /chat based on main.py)
#     # Let's try /chat
#     chat_response = requests.post(f"{BASE_URL}/chat", json=chat_payload)
    
#     if chat_response.status_code == 200:
#         chat_data = chat_response.json()
#         print(f"[SUCCESS] Chat Successful!")
#         print(f"Answer: {chat_data.get('answer')}")
#     else:
#         # If /chat fails, maybe it's /chat/message or something else.
#         print(f"[WARNING] Chat request returned status {chat_response.status_code}. You might need to check your exact chat route in app/api/routes_chat.py")
#         print(f"Response: {chat_response.text}")
        
#     print("\nPipeline Test Completed!")

# if __name__ == "__main__":
#     try:
#         test_pipeline()
#     except requests.exceptions.ConnectionError:
#         print("❌ Error: Could not connect to the backend. Please ensure your FastAPI server is running (uvicorn app.main:app --reload)")
