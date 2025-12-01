"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  // --------------------------------------------------
  // 👇 AUTH GUARD (Only job: ensure token exists)
  // --------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");

    // Allow public pages:
    const isPublic =
      pathname.startsWith("/login") ||
      pathname.startsWith("/auth");

    if (!token && !isPublic) {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  // --------------------------------------------------
  // Persist sidebar state
  // --------------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">
            Loading dashboard…
          </div>
          <div className="text-gray-300 text-sm">
            Verifying authentication
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN DASHBOARD UI
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white flex">

      {/* Sidebar (Desktop) */}
      <div className={`hidden md:block transition-all duration-200 ${collapsed ? "w-16" : "w-72"}`}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Sidebar (Mobile Drawer) */}
      <div
        className={`fixed inset-0 z-40 md:hidden transform ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer panel */}
        <div className="relative w-72 min-h-screen bg-black/40 p-4">
          <Sidebar
            collapsed={false}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Topbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onToggleDrawer={() => setDrawerOpen((s) => !s)}
        />

        <div className={`${collapsed ? "ml-0 md:ml-4" : "ml-0 md:ml-6"} transition-all duration-200`}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
