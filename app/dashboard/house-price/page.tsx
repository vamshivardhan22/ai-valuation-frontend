"use client";

import React, { useEffect, useRef, useState } from "react";

type ResultType = {
  predicted_price?: number;
  min_price?: number;
  max_price?: number;
  confidence?: number;
  insights?: string;
};

const AMENITIES = [
  { id: "pool", label: "Pool", icon: "🏊" },
  { id: "gym", label: "Gym", icon: "🏋️" },
  { id: "lift", label: "Lift", icon: "🛗" },
  { id: "parking", label: "Parking", icon: "🚗" },
  { id: "security", label: "Security", icon: "🛡️" },
  { id: "power", label: "Power Backup", icon: "⚡" },
];

export default function HousePrice() {
  // form states
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [bhk, setBhk] = useState("2BHK");
  const [furnishing, setFurnishing] = useState("Semi-Furnished");
  const [buildYear, setBuildYear] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");

  // map & amenities
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // prediction
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize amenity selection default
  useEffect(() => {
    const init: Record<string, boolean> = {};
    AMENITIES.forEach((a) => (init[a.id] = false));
    setSelectedAmenities(init);
  }, []);

  // Map init (Leaflet)
  useEffect(() => {
    async function init() {
      try {
        const L = await import("leaflet");

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: (await import("leaflet/dist/images/marker-icon-2x.png")).default,
          iconUrl: (await import("leaflet/dist/images/marker-icon.png")).default,
          shadowUrl: (await import("leaflet/dist/images/marker-shadow.png")).default,
        });

        if (!mapRef.current) return;

        const map = L.map(mapRef.current, {
          center: [20.5937, 78.9629],
          zoom: 6,
        });

        leafletMapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setLatlng({ lat, lng });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          }
        });
      } catch (err) {
        console.error("Leaflet Error:", err);
      }
    }

    init();

    return () => {
      try {
        leafletMapRef.current?.remove();
      } catch {}
    };
  }, []);

  // Use current location
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatlng({ lat, lng });

        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 15);
        }

        const L = (window as any).L;
        if (leafletMapRef.current) {
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(leafletMapRef.current);
          }
        }
      },
      (err) => alert("Location error: " + err.message)
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!area || !bedrooms || !bathrooms || !city || !locality) {
      setError("Please fill all required fields.");
      return;
    }
    if (!latlng) {
      setError("Please select a location on the map.");
      return;
    }

    setLoading(true);

    const payload = {
      area: Number(area),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      property_type: propertyType,
      bhk,
      furnishing,
      build_year: buildYear ? Number(buildYear) : null,
      city,
      locality,
      amenities: Object.keys(selectedAmenities).filter((k) => selectedAmenities[k]),
      lat: latlng.lat,
      lng: latlng.lng,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://ai-valuation-backend-1.onrender.com"}/predict/house-price`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Server error: " + res.status);

      const data = await res.json();

      setResult({
        predicted_price: data.predicted_price ?? data.price,
        min_price: data.min_price,
        max_price: data.max_price,
        confidence: data.confidence,
        insights: data.insights ?? "Model insights unavailable",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n?: number | null) =>
    n == null
      ? "-"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(n);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Residential Price Estimator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left = Form */}
        <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="Area (sqft)" value={area} onChange={(e) => setArea(e.target.value)} />
              <input className="input" placeholder="Bedrooms" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              <input className="input" placeholder="Bathrooms" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />

              <select className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option>Apartment</option>
                <option>Independent House</option>
                <option>Villa</option>
                <option>Studio</option>
              </select>

              <select className="input" value={bhk} onChange={(e) => setBhk(e.target.value)}>
                <option>1BHK</option>
                <option>2BHK</option>
                <option>3BHK</option>
                <option>4BHK+</option>
              </select>

              <select className="input" value={furnishing} onChange={(e) => setFurnishing(e.target.value)}>
                <option>Unfurnished</option>
                <option>Semi-Furnished</option>
                <option>Furnished</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="Build Year" value={buildYear} onChange={(e) => setBuildYear(e.target.value)} />
              <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input col-span-2" placeholder="Locality" value={locality} onChange={(e) => setLocality(e.target.value)} />
            </div>

            {/* Amenities */}
            <div>
              <div className="font-medium mb-2">Amenities</div>
              <div className="flex flex-wrap gap-3">
                {AMENITIES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedAmenities[a.id]
                        ? "bg-white/20 border-white/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map */}
            <div>
              <div className="font-medium mb-2">Pick Location</div>
              <div ref={mapRef} className="h-56 rounded-xl overflow-hidden border border-white/10 mb-2" />
              <button type="button" onClick={useMyLocation} className="btn-secondary">
                Use My Location
              </button>
              <div className="text-xs text-gray-300 mt-2">
                {latlng ? `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : "No location selected"}
              </div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Predicting..." : "Predict Price"}
            </button>
          </form>
        </div>

        {/* Right = Result */}
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-2xl shadow-lg min-h-[220px]">
            <h3 className="text-xl font-semibold mb-4">Prediction Result</h3>

            {!result && !loading && (
              <p className="text-gray-400">Fill the form and click Predict to see results.</p>
            )}

            {loading && <p className="text-gray-300">Loading prediction...</p>}

            {result && (
              <div className="space-y-4">
                <div>
                  <div className="text-gray-300 text-sm">Estimated Value</div>
                  <div className="text-3xl font-bold">{fmt(result.predicted_price)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-300 mb-1">Price Range</div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{fmt(result.min_price)}</span>
                    <span>{fmt(result.max_price)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Model Insights</div>
                  <p className="text-xs text-gray-300 whitespace-pre-line">{result.insights}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/10 p-4 rounded-xl text-sm text-gray-300">
            <div className="font-semibold mb-2">How it works</div>
            <p>
              Our ML model uses location, property features, amenities, and historical pricing trends to
              estimate real-time market value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
