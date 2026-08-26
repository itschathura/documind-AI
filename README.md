# documind-AI
AI powered document intelligence and knowledge retrieval platform


DocuMind-AI/
│
├── backend/                        ← FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes_upload.py
│   │   │   ├── routes_chat.py
│   │   │   └── routes_documents.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── extraction.py
│   │   │   ├── chunking.py
│   │   │   ├── embeddings.py
│   │   │   ├── vector_store.py
│   │   │   └── rag_pipeline.py
│   │   ├── db/
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                       ← Next.js
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── data/                           ← 🆕
│   ├── uploads/                    # raw uploaded PDFs (dev/local only)
│   ├── processed/                  # extracted text / chunks (debug artifacts)
│   └── vector_store/               # local FAISS/Chroma index files, if not using external DB
│
├── docs/                           ← 🆕
│   ├── architecture.md             # RAG pipeline diagram, system design
│   ├── api-reference.md            # endpoint docs (or Postman collection)
│   └── setup.md                    # local dev setup instructions
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md