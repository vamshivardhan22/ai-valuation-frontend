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
      const raw = localStorage.getItem("sidebar_collapsed");
      return raw === "1";
    } catch {
      return false;
    }
  });

  // --------------------------------------------------
  // 🔹 STEP 1: Capture Google Login Token From URL
  // --------------------------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
      localStorage.setItem("auth_token", token);
      router.replace("/dashboard/house-price");
    }
  }, []);

  // --------------------------------------------------
  // 🔹 STEP 2: Protect Dashboard Routes
  // --------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    // allow login page to load
    if (!token && pathname !== "/login") {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  // persist collapsed sidebar state
  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  // --------------------------------------------------
  // 🔹 LOADING SCREEN
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white">
        <div className="text-center">
          <div className="mb-4">Loading…</div>
          <div className="text-gray-300">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 🔹 MAIN DASHBOARD LAYOUT
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white flex">
      
      {/* Sidebar (Desktop) */}
      <div className={`hidden md:block ${collapsed ? "w-16" : "w-72"}`}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Sidebar (Mobile Drawer) */}
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

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Topbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onToggleDrawer={() => setDrawerOpen((s) => !s)}
        />

        <div className={`transition-all duration-200 ${collapsed ? "ml-0 md:ml-4" : "ml-0 md:ml-6"}`}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
