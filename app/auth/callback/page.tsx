"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    async function processLogin() {
      try {
        const url = new URL(window.location.href);
        const token = url.searchParams.get("token");

        if (!token) {
          alert("Login failed. No token received.");
          router.replace("/login");
          return;
        }

        // Save token for authenticated pages
        localStorage.setItem("auth_token", token);

        // Redirect to dashboard
        router.replace("/dashboard/house-price");
      } catch (err) {
        console.error(err);
        router.replace("/login");
      }
    }

    processLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center">
        <div className="text-lg">Signing you in...</div>
      </div>
    </div>
  );
}
