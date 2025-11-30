"use client";

import { FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Topbar({
  collapsed,
  setCollapsed,
  onToggleDrawer,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onToggleDrawer: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Mobile menu */}
      <button
        onClick={onToggleDrawer}
        className="md:hidden bg-white/10 p-2 rounded-lg"
      >
        <FiMenu size={22} />
      </button>

      {/* Collapse toggle (desktop) */}
      <button
        className="hidden md:flex bg-white/10 p-2 rounded-lg transition hover:bg-white/20"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <FiChevronRight size={22} />
        ) : (
          <FiChevronLeft size={22} />
        )}
      </button>

      <div className="text-gray-300 text-sm">
        Welcome to your AI Valuation Dashboard
      </div>
    </div>
  );
}
