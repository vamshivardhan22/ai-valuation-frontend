"use client";

import React, { useEffect, useRef, useState } from "react";

type ResultType = {
  predicted_price?: number;
  min_price?: number;
  max_price?: number;
  confidence?: number;
  price_per_sqft?: number;
  insights?: string;
};

export default function LandPrice() {
  const [area, setArea] = useState("");
  const [zone, setZone] = useState("Residential");
  const [roadWidth, setRoadWidth] = useState("");
  const [facing, setFacing] = useState("East");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [plotShape, setPlotShape] = useState("Regular");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        leafletMapRef.current?.setView([lat, lng], 15);
        const L = (window as any).L;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(leafletMapRef.current);
      },
      (err) => alert(err.message)
    );
  };

  const fmt = (n?: number | null) => (n == null ? "-" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!area || !city || !locality) {
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
      zone,
      road_width: roadWidth ? Number(roadWidth) : null,
      facing,
      city,
      locality,
      plot_shape: plotShape,
      lat: latlng.lat,
      lng: latlng.lng,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://ai-valuation-backend-1.onrender.com"}/predict/land-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Server error " + res.status);
      const data = await res.json();

      setResult({
        predicted_price: data.predicted_price ?? data.price,
        min_price: data.min_price,
        max_price: data.max_price,
        price_per_sqft: data.price_per_sqft,
        confidence: data.confidence,
        insights: data.insights ?? "No insight provided",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Land Price Estimator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT = Form */}
        <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="Land Area (sqft)" value={area} onChange={(e) => setArea(e.target.value)} />
              <select className="input" value={zone} onChange={(e) => setZone(e.target.value)}>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Agricultural</option>
                <option>Industrial</option>
              </select>

              <input className="input" placeholder="Road Width (ft)" value={roadWidth} onChange={(e) => setRoadWidth(e.target.value)} />
              <select className="input" value={facing} onChange={(e) => setFacing(e.target.value)}>
                <option>East</option>
                <option>West</option>
                <option>North</option>
                <option>South</option>
                <option>North-East</option>
                <option>North-West</option>
                <option>South-East</option>
                <option>South-West</option>
              </select>

              <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input" placeholder="Locality / Area" value={locality} onChange={(e) => setLocality(e.target.value)} />
              <select className="input col-span-2" value={plotShape} onChange={(e) => setPlotShape(e.target.value)}>
                <option>Regular</option>
                <option>Irregular</option>
                <option>L-Shape</option>
                <option>Corner Plot</option>
              </select>
            </div>

            <div>
              <div className="font-medium mb-2">Pick Land Location</div>
              <div ref={mapRef} className="h-56 rounded-xl overflow-hidden border border-white/10 mb-2" />
              <button type="button" onClick={useMyLocation} className="btn-secondary">
                Use My Location
              </button>

              <div className="text-xs text-gray-300 mt-2">{latlng ? `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : "No location selected"}</div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Predicting..." : "Predict Land Price"}
            </button>
          </form>
        </div>

        {/* RIGHT = Results */}
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-2xl shadow-lg min-h-[220px]">
            <h3 className="text-xl font-semibold mb-4">Prediction Result</h3>

            {!result && !loading && <p className="text-gray-400">Fill the form and click Predict.</p>}
            {loading && <p className="text-gray-300">Loading prediction...</p>}

            {result && (
              <div className="space-y-4">
                <div>
                  <div className="text-gray-300 text-sm">Estimated Land Value</div>
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
                  <div className="text-sm font-medium mb-1">Price Per Sqft</div>
                  <div className="text-lg font-semibold">{fmt(result.price_per_sqft)}</div>
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
            <p>Our AI analyzes local market trends, zoning rules, road access, plot shape and geospatial patterns to predict accurate land valuation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
