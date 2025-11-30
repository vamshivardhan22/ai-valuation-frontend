"use client";

export default function LoginPage() {
  const GOOGLE_URL =
    `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://ai-valuation-backend-1.onrender.com"}/auth/google`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white px-4">
      <div className="bg-white/10 p-10 rounded-3xl backdrop-blur-xl shadow-xl max-w-md w-full text-center border border-white/10">

        <h1 className="text-3xl font-bold mb-4">Welcome Back</h1>
        <p className="text-gray-300 mb-8">
          Login to access your AI-powered property valuation dashboard
        </p>

        <a
          href={GOOGLE_URL}
          className="block bg-white text-black text-lg font-semibold py-3 rounded-xl shadow hover:bg-gray-200 transition"
        >
          Continue with Google
        </a>

        <p className="text-xs text-gray-400 mt-6">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
