"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sidebar_collapsed");
      setCollapsed(raw === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white flex">

      {/* Sidebar (Desktop) */}
      <div className={`hidden md:block ${collapsed ? "w-16" : "w-72"}`}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Sidebar Drawer (Mobile) */}
      <div
        className={`fixed inset-0 z-40 md:hidden transform ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
        <div className="relative w-72 min-h-screen bg-black/40 p-4">
          <Sidebar collapsed={false} onCloseDrawer={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Topbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onToggleDrawer={() => setDrawerOpen((s) => !s)}
        />

        <div className={`${collapsed ? "ml-0 md:ml-4" : "ml-0 md:ml-6"}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
