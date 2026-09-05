"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, Loader2, Send, FileText, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { uploadDocument, chatWithDocument, Document } from "@/lib/api";
import { saveChatSession, getChatSession, Message } from "@/lib/chatHistory";
import { getMyDocuments, saveMyDocument } from "@/lib/documentHistory";

const SUGGESTED_QUESTIONS = [
  "Summarize this document in 3 points",
  "What are the key details?",
  "Are there any dates or numbers I should know?",
];

function HomeContent() {
  const searchParams = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
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
    window.addEventListener("documentsUpdated", loadDocuments);
    return () => window.removeEventListener("documentsUpdated", loadDocuments);
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
      setSelectedDocId(docParam);
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
      const docs = getMyDocuments();
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
      saveMyDocument(doc);
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
    <div className="flex flex-col h-full relative">
      <div className="glass-panel border-x-0 border-t-0 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 shrink-0 z-10 sticky top-0">
        <div className="relative flex-1 min-w-[180px]">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-sm hover:border-[var(--accent)] transition-all duration-200 shadow-sm"
          >
            <span className="flex items-center gap-2 truncate">
              <FileText size={16} className="text-[var(--accent)] shrink-0" />
              <span className="truncate font-medium">
                {selectedDoc ? selectedDoc.filename : "Select a document..."}
              </span>
            </span>
            <ChevronDown size={16} className={`shrink-0 opacity-60 transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""}`} />
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm text-sm cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200 shrink-0 ${uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span className="hidden sm:inline font-medium">{uploading ? "Uploading..." : "Upload"}</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        {!selectedDocId ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--accent)]/10 via-transparent to-transparent opacity-60 blur-3xl"></div>
            <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.2)] border border-[var(--accent)]/20">
              <Sparkles size={36} className="text-[var(--accent)]" />
            </div>
            <h1 className="text-3xl font-extrabold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">Welcome to DocuMind AI</h1>
            <p className="text-gray-500 text-base mb-8 leading-relaxed max-w-sm">
              Upload a document and ask anything — I&apos;ll instantly find the answers for you.
            </p>
            <label
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium cursor-pointer transition-all duration-300 shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/40 hover:-translate-y-0.5 ${uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {uploading ? "Uploading..." : "Upload your first document"}
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -z-10"></div>
            <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mb-5 border border-[var(--accent)]/20 shadow-lg">
              <Bot size={30} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              Ask anything about &quot;{selectedDoc?.filename}&quot;
            </h2>
            {selectedDoc?.summary && (
              <p className="text-sm text-gray-500 mb-8 line-clamp-3 leading-relaxed max-w-md">{selectedDoc.summary}</p>
            )}
            <div className="grid gap-3 w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuestion(q)}
                  className="text-left px-5 py-3.5 rounded-xl glass-panel text-sm hover:border-[var(--accent)]/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <span className="group-hover:text-[var(--accent)] transition-colors">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-[var(--accent)]/20" : "glass-panel text-[var(--accent)]"
                    }`}
                >
                  {msg.role === "user" ? <User size={16} /> : <Bot size={18} />}
                </div>
                <div
                  className={`max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-tr-sm"
                      : "glass-panel rounded-tl-sm border-white/5"
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <p className="text-sm text-red-500 glass-panel border-red-500/20 px-5 py-2.5 rounded-full shadow-lg shadow-red-500/10 font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </p>
        </div>
      )}

      <div className="p-4 sm:p-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 p-1.5 glass-panel rounded-2xl focus-within:ring-2 ring-[var(--accent)]/50 transition-all duration-300 shadow-lg">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDocId ? "Ask a question about your document..." : "Select a document to start chatting"}
            disabled={!selectedDocId || asking}
            rows={1}
            className="flex-1 resize-none px-4 py-3 bg-transparent text-sm disabled:opacity-50 focus:outline-none placeholder:text-gray-400"
          />
          <button
            onClick={() => sendQuestion(question)}
            disabled={!selectedDocId || !question.trim() || asking}
            className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white flex items-center justify-center disabled:opacity-40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] group"
          >
            <Send size={18} className={question.trim() && selectedDocId ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[var(--accent)]" size={28} /></div>}>
      <HomeContent />
    </Suspense>
  );
}