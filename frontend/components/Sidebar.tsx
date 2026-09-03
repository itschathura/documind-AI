"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageSquarePlus, FileText, Home, X, Trash2, MessageCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getChatSessions, deleteChatSession, ChatSession } from "@/lib/chatHistory";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("chat");

  const [chats, setChats] = useState<ChatSession[]>([]);

  useEffect(() => {
    refreshChats();
    window.addEventListener("chatHistoryUpdated", refreshChats);
    return () => window.removeEventListener("chatHistoryUpdated", refreshChats);
  }, []);

  function refreshChats() {
    setChats(getChatSessions());
  }

  function handleDeleteChat(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    deleteChatSession(id);
  }

  const navItems = [
    { href: "/", label: "New Chat", icon: MessageSquarePlus },
    { href: "/documents", label: "My Documents", icon: FileText },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] z-50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] shrink-0">
          <a href="/" className="flex items-center gap-2 group transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 group-hover:bg-[var(--accent)]/20 transition-colors">
              <Home size={16} className="text-[var(--accent)]" />
            </div>
            <span className="font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">DocuMind AI</span>
          </a>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href && !activeChatId;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-md shadow-[var(--accent)]/20 translate-x-1"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "opacity-70"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Chat history list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {chats.length > 0 && (
            <p className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Recent Chats
            </p>
          )}
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/?chat=${chat.id}`}
                onClick={onClose}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  activeChatId === chat.id
                    ? "glass-panel border-[var(--accent)]/30 text-[var(--accent)] shadow-sm font-medium translate-x-1"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <MessageCircle size={15} className={`shrink-0 ${activeChatId === chat.id ? "opacity-100" : "opacity-50"}`} />
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className={`shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 ${
                    activeChatId === chat.id ? "hover:text-red-400" : "hover:text-red-500"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">Theme</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}