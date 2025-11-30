"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#0D1B3D] to-[#281A63] text-white px-6 py-16">

      {/* Heading */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4 tracking-wide">
          Real Estate Pricing
        </h1>
        <p className="text-lg text-gray-300 max-w-xl mx-auto">
          Get instant AI-powered estimates for properties & land with 98% accuracy.
        </p>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl mx-auto">

        {/* House Price */}
        <Link href="/dashboard/house-price">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition">
            <Image
              src="/images/house-price.jpg"
              alt="House Price"
              width={400}
              height={250}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2">House Price</h2>
              <p className="text-gray-300 text-sm">
                Predict market value of residential houses instantly.
              </p>
            </div>
          </div>
        </Link>

        {/* House Rent */}
        <Link href="/dashboard/house-rent">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition">
            <Image
              src="/images/house-rent.jpg"
              alt="House Rent"
              width={400}
              height={250}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2">House Rent</h2>
              <p className="text-gray-300 text-sm">
                Estimate monthly rental values using AI prediction.
              </p>
            </div>
          </div>
        </Link>

        {/* Land Price */}
        <Link href="/dashboard/land-price">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition">
            <Image
              src="/images/land-price.jpg"
              alt="Land Price"
              width={400}
              height={250}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Land Price</h2>
              <p className="text-gray-300 text-sm">
                Predict plot/land valuation based on locality & zone type.
              </p>
            </div>
          </div>
        </Link>

      </div>
    </main>
  );
}
