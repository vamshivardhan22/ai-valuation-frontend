"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      // -----------------------------
      // NO TOKEN → GO TO LOGIN
      // -----------------------------
      if (!token) {
        console.warn("❌ No token present in URL — redirecting to login");
        router.replace("/login");
        return;
      }

      // -----------------------------
      // STORE TOKEN FOR AUTH
      // -----------------------------
      localStorage.setItem("auth_token", token);

      // OPTIONAL:
      // If old tokens remain, clear them
      localStorage.removeItem("user"); 

      console.log("✅ Token stored, redirecting to dashboard...");
      
      // -----------------------------
      // SEND USER TO MAIN DASHBOARD
      // -----------------------------
      router.replace("/dashboard/house-price");
    } catch (err) {
      console.error("Callback Processing Failed:", err);
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white">
      <p className="text-lg animate-pulse">
        Authenticating... please wait 🚀
      </p>
    </div>
  );
}
