import { Document } from "./api";

const STORAGE_KEY = "documind_my_documents";

export function getMyDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveMyDocument(doc: Document) {
  if (typeof window === "undefined") return;
  const docs = getMyDocuments();
  // Avoid duplicates if re-uploaded or added twice
  if (!docs.find((d) => d.id === doc.id)) {
    docs.unshift(doc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    // Dispatch an event so other tabs/components can update
    window.dispatchEvent(new Event("documentsUpdated"));
  }
}

export function removeMyDocument(id: string) {
  if (typeof window === "undefined") return;
  const docs = getMyDocuments();
  const updated = docs.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("documentsUpdated"));
}
