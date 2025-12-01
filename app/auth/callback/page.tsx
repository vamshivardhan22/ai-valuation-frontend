"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      // If no token, send back to login
      if (!token) {
        router.push("/login");
        return;
      }

      // Store JWT
      localStorage.setItem("token", token);

      // OPTIONAL: fetch user profile
      try {
        const API =
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "https://ai-valuation-backend-1.onrender.com";

        const res = await fetch(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const user = await res.json();
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (err) {
        console.warn("Could not fetch user profile:", err);
      }

      // Redirect to homepage
      router.push("/");
    }

    finishLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <p>Logging you in securely...</p>
    </div>
  );
}
