export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#0a1430] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6">
        <h1 className="text-2xl font-bold mb-6">AI Valuation</h1>

        <nav className="space-y-2">
          <a
            href="/dashboard/house-price"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            🏠 House Price
          </a>

          <a
            href="/dashboard/house-rent"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            💰 House Rent
          </a>

          <a
            href="/dashboard/land-price"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            🌍 Land Price
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-end mb-6">
          <p className="text-gray-300 text-sm">
            Welcome to your AI Valuation Dashboard
          </p>
        </header>

        {children}
      </main>
    </div>
  );
}
