"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar — hamburger button only visible on mobile */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)] z-30 sticky top-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Menu size={22} />
          </button>
          <span className="font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">DocuMind AI</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}