"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { listDocuments, deleteDocument, Document } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Documents</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p>No documents uploaded yet.</p>
          <Link href="/" className="text-[var(--accent)] hover:underline text-sm">
            Upload your first document
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={18} className="text-[var(--accent)] shrink-0" />
                  <span className="font-medium text-sm truncate">{doc.filename}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    doc.status === "ready"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : doc.status === "failed"
                      ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-3">
                {doc.summary || "No summary available."}
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-color)]">
                <span className="text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/?doc=${doc.id}`}
                    className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                  >
                    <MessageSquare size={14} /> Chat
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}