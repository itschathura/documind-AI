const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Document {
  id: string;
  filename: string;
  file_type: string;
  status: string;
  summary: string | null;
  created_at: string;
}

export interface ChatResponse {
  answer: string;
  sources: { snippet: string }[];
}

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || "Upload failed");
  }

  return res.json();
}

// Global list is disabled for privacy. We rely on localStorage now.
// export async function listDocuments(): Promise<Document[]> { ... }

export async function getDocument(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`);
  if (!res.ok) throw new Error("Document not found");
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function chatWithDocument(documentId: string, question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Chat failed" }));
    throw new Error(error.detail || "Chat failed");
  }

  return res.json();
}