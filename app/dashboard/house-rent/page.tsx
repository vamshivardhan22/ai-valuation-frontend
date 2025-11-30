"use client";

import React, { useEffect, useRef, useState } from "react";

type ResultType = {
  predicted_rent?: number;
  min_rent?: number;
  max_rent?: number;
  confidence?: number;
  insights?: string;
};

const AMENITIES = [
  { id: "parking", label: "Parking", icon: "🚗" },
  { id: "power", label: "Power Backup", icon: "⚡" },
  { id: "security", label: "Security", icon: "🛡️" },
  { id: "lift", label: "Lift", icon: "🛗" },
  { id: "gym", label: "Gym", icon: "🏋️" },
  { id: "water", label: "24/7 Water", icon: "🚰" },
];

export default function HouseRent() {
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishing, setFurnishing] = useState("Semi-Furnished");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [floor, setFloor] = useState("");
  const [parking, setParking] = useState("Yes");

  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init: Record<string, boolean> = {};
    AMENITIES.forEach((a) => (init[a.id] = false));
    setSelectedAmenities(init);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const L = await import("leaflet");

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: (await import("leaflet/dist/images/marker-icon-2x.png")).default,
          iconUrl: (await import("leaflet/dist/images/marker-icon.png")).default,
          shadowUrl: (await import("leaflet/dist/images/marker-shadow.png")).default,
        });

        if (!mapRef.current) return;

        const map = L.map(mapRef.current, { center: [20.5937, 78.9629], zoom: 6 });
        leafletMapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setLatlng({ lat, lng });

          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = L.marker([lat, lng]).addTo(map);
        });
      } catch (err) {
        console.error("Leaflet error:", err);
      }
    }
    init();
    return () => leafletMapRef.current?.remove();
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatlng({ lat, lng });
        if (leafletMapRef.current) leafletMapRef.current.setView([lat, lng], 15);
        const L = (window as any).L;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(leafletMapRef.current);
      },
      (err) => alert(err.message)
    );
  };

  const toggleAmenity = (id: string) => setSelectedAmenities((s) => ({ ...s, [id]: !s[id] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!area || !bedrooms || !bathrooms || !city || !locality) {
      setError("Please fill all required fields.");
      return;
    }
    if (!latlng) {
      setError("Please select location on map.");
      return;
    }

    setLoading(true);

    const payload = {
      area: Number(area),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      furnishing,
      property_type: propertyType,
      city,
      locality,
      floor: floor ? Number(floor) : null,
      parking,
      amenities: Object.keys(selectedAmenities).filter((k) => selectedAmenities[k]),
      lat: latlng.lat,
      lng: latlng.lng,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://ai-valuation-backend-1.onrender.com"}/predict/house-rent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Server error " + res.status);

      const data = await res.json();
      setResult({
        predicted_rent: data.predicted_rent ?? data.rent,
        min_rent: data.min_rent,
        max_rent: data.max_rent,
        confidence: data.confidence,
        insights: data.insights ?? "Model insights not provided",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n?: number | null) => (n == null ? "-" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">House Rent Estimator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="Area (sqft)" value={area} onChange={(e) => setArea(e.target.value)} />
              <input className="input" placeholder="Bedrooms" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              <input className="input" placeholder="Bathrooms" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />

              <select className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option>Apartment</option>
                <option>Independent House</option>
                <option>Studio</option>
                <option>Villa</option>
              </select>

              <select className="input" value={furnishing} onChange={(e) => setFurnishing(e.target.value)}>
                <option>Unfurnished</option>
                <option>Semi-Furnished</option>
                <option>Fully Furnished</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input" placeholder="Locality" value={locality} onChange={(e) => setLocality(e.target.value)} />
              <input className="input col-span-2" placeholder="Floor (optional)" value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>

            <div>
              <select className="input" value={parking} onChange={(e) => setParking(e.target.value)}>
                <option value="Yes">Parking: Yes</option>
                <option value="No">Parking: No</option>
              </select>
            </div>

            <div>
              <div className="font-medium mb-2">Amenities</div>
              <div className="flex flex-wrap gap-3">
                {AMENITIES.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleAmenity(a.id)}
                    className={`px-4 py-2 rounded-lg border ${selectedAmenities[a.id] ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">Pick Location</div>
              <div ref={mapRef} className="h-56 rounded-xl overflow-hidden border border-white/10 mb-2" />

              <button type="button" onClick={useMyLocation} className="btn-secondary">
                Use My Location
              </button>

              <div className="text-xs text-gray-300 mt-2">{latlng ? `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : "No location selected"}</div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Predicting..." : "Predict Rent"}
            </button>
          </form>
        </div>

        {/* RIGHT: Result */}
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-2xl shadow-lg min-h-[220px]">
            <h3 className="text-xl font-semibold mb-4">Prediction Result</h3>

            {!result && !loading && <p className="text-gray-400">Fill form and click Predict to see rent estimate.</p>}

            {loading && <p className="text-gray-300">Calculating rent...</p>}

            {result && (
              <div className="space-y-4">
                <div>
                  <div className="text-gray-300 text-sm">Estimated Monthly Rent</div>
                  <div className="text-3xl font-bold">{fmt(result.predicted_rent)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-300 mb-1">Rent Range</div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{fmt(result.min_rent)}</span>
                    <span>{fmt(result.max_rent)}</span>
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
              Our AI model evaluates local market conditions, amenities, building type, furnishing, and geographic factors to estimate monthly rental value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
