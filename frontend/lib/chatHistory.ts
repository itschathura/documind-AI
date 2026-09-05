export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  documentId: string;
  documentName: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY = "documind_chat_sessions";

export function getChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatSession(session: ChatSession) {
  const sessions = getChatSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event("chatHistoryUpdated"));
}

export function deleteChatSession(id: string) {
  const sessions = getChatSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event("chatHistoryUpdated"));
}

export function getChatSession(id: string): ChatSession | undefined {
  return getChatSessions().find((s) => s.id === id);
}