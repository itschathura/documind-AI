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
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] z-50 flex flex-col transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] shrink-0">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home size={20} className="text-[var(--accent)]" />
            <span className="font-semibold">DocuMind AI</span>
          </a>
          <button onClick={onClose} className="md:hidden">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
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
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChatId === chat.id
                    ? "bg-[var(--accent)] text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <MessageCircle size={15} className="shrink-0 opacity-70" />
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    activeChatId === chat.id ? "hover:text-red-200" : "hover:text-red-500"
                  }`}
                >
                  <Trash2 size={13} />
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