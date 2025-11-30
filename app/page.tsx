"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePage from "./homepage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return <HomePage />;
}
