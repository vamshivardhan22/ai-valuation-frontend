export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6">
      <h1 className="text-4xl font-bold mb-4">Welcome to AI Valuation</h1>

      <p className="text-gray-300 max-w-xl mb-8">
        Estimate property values using our AI-powered analysis covering houses,
        rentals, and land across India.
      </p>

      <a
        href="/dashboard/house-price"
        className="btn-primary text-lg px-6 py-3 rounded-xl"
      >
        Go to App →
      </a>
    </div>
  );
}
