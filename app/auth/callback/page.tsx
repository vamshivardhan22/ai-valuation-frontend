"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        router.push("/login");
        return;
      }

      // Backend URL
      const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-valuation-backend-1.onrender.com";

      // Call backend callback
      const res = await fetch(`${BACKEND}/auth/google/callback?code=${code}`);

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // 🚀 FIX: Redirect to HOME instead of Dashboard
        router.push("/");
      } else {
        router.push("/login");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <p>Finishing login...</p>
    </div>
  );
}
