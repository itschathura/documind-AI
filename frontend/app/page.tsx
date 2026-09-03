"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, Loader2, Send, FileText, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { uploadDocument, listDocuments, chatWithDocument, Document } from "@/lib/api";
import { saveChatSession, getChatSession, Message } from "@/lib/chatHistory";

const SUGGESTED_QUESTIONS = [
  "Summarize this document in 3 points",
  "What are the key details?",
  "Are there any dates or numbers I should know?",
];

export default function Home() {
  const searchParams = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  // Load either a specific chat session (?chat=) or a fresh doc (?doc=)
  useEffect(() => {
    const chatParam = searchParams.get("chat");
    const docParam = searchParams.get("doc");

    if (chatParam) {
      const session = getChatSession(chatParam);
      if (session) {
        setChatId(session.id);
        setSelectedDocId(session.documentId);
        setMessages(session.messages);
        return;
      }
    }

    if (docParam) {
      setSelectedDocId(Number(docParam));
      setChatId(null);
      setMessages([]);
      return;
    }

    // No params at all — "New Chat" clicked → reset everything
    setSelectedDocId(null);
    setChatId(null);
    setMessages([]);
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function loadDocuments() {
    try {
      const docs = await listDocuments();
      setDocuments(docs.filter((d) => d.status === "ready"));
    } catch {
      // silent
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const doc = await uploadDocument(file);
      setDocuments((prev) => [doc, ...prev]);
      setSelectedDocId(doc.id);
      setChatId(null);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function sendQuestion(q: string) {
    if (!q.trim() || !selectedDocId) return;

    const selectedDoc = documents.find((d) => d.id === selectedDocId);
    const newMessages: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setQuestion("");
    setAsking(true);
    setError(null);

    // First message of a new chat → generate an id + title from the question
    const currentChatId = chatId ?? crypto.randomUUID();
    if (!chatId) setChatId(currentChatId);

    try {
      const res = await chatWithDocument(selectedDocId, q);
      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: res.answer }];
      setMessages(finalMessages);

      saveChatSession({
        id: currentChatId,
        documentId: selectedDocId,
        documentName: selectedDoc?.filename || "Document",
        title: newMessages[0].content.slice(0, 40),
        messages: finalMessages,
        updatedAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get answer");
    } finally {
      setAsking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(question);
    }
  }

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[var(--border-color)] px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-sm hover:border-[var(--accent)] transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <FileText size={16} className="text-[var(--accent)] shrink-0" />
              <span className="truncate">
                {selectedDoc ? selectedDoc.filename : "Select a document..."}
              </span>
            </span>
            <ChevronDown size={16} className="shrink-0 opacity-60" />
          </button>

          {pickerOpen && (
            <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg">
              {documents.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No documents yet — upload one.</p>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setChatId(null);
                      setMessages([]);
                      setPickerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--sidebar-bg)] transition-colors truncate ${doc.id === selectedDocId ? "text-[var(--accent)] font-medium" : ""
                      }`}
                  >
                    {doc.filename}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <label
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm cursor-pointer hover:bg-[var(--sidebar-bg)] transition-colors shrink-0 ${uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {!selectedDocId ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to DocuMind AI 👋</h1>
            <p className="text-gray-500 text-sm mb-6">
              Upload a document and ask anything — I&apos;ll find the answers for you.
            </p>
            <label
              className={`flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity ${uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? "Uploading..." : "Upload your first document"}
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
              <Bot size={26} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-semibold mb-1">
              Ask anything about &quot;{selectedDoc?.filename}&quot;
            </h2>
            {selectedDoc?.summary && (
              <p className="text-sm text-gray-500 mb-6 line-clamp-3">{selectedDoc.summary}</p>
            )}
            <div className="grid gap-2 w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuestion(q)}
                  className="text-left px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-sm hover:border-[var(--accent)] hover:bg-[var(--sidebar-bg)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-[var(--accent)] text-white" : "bg-[var(--sidebar-bg)] border border-[var(--border-color)]"
                    }`}
                >
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--sidebar-bg)] border border-[var(--border-color)]"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {asking && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-[var(--sidebar-bg)] border border-[var(--border-color)]">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="mx-4 sm:mx-6 mb-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="border-t border-[var(--border-color)] p-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDocId ? "Ask a question..." : "Select a document first"}
            disabled={!selectedDocId || asking}
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-sm disabled:opacity-50 focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={() => sendQuestion(question)}
            disabled={!selectedDocId || !question.trim() || asking}
            className="shrink-0 w-11 h-11 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}