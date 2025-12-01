"use client";

import React, { useEffect, useRef, useState } from "react";

type ResultType = {
  predicted_price?: number;
  min_price?: number;
  max_price?: number;
  confidence?: number;
  insights?: string;
};

export default function LandPrice() {
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [zoneType, setZoneType] = useState("Residential");
  const [roadWidth, setRoadWidth] = useState("");
  const [cornerPlot, setCornerPlot] = useState("No");

  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Init map
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
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = L.marker([lat, lng]).addTo(map);
        });
      } catch (err) {
        console.error("Leaflet init error:", err);
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

        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 15);
          const L = (window as any).L;
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = L.marker([lat, lng]).addTo(leafletMapRef.current);
        }
      },
      (err) => alert(err.message)
    );
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 5);
    const readers: Promise<string>[] = selected.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) => {
      setImagePreviews((prev) => [...prev, ...urls]);
    });
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetResult();

    if (!area || !city || !locality) {
      setError("Please fill area, city and locality.");
      return;
    }
    if (!latlng) {
      setError("Please select the plot location on the map.");
      return;
    }

    setLoading(true);

    const payload = {
      area: Number(area),
      city,
      locality,
      zone_type: zoneType,
      road_width: roadWidth ? Number(roadWidth) : null,
      corner_plot: cornerPlot === "Yes",
      lat: latlng.lat,
      lng: latlng.lng,
      // images: imagePreviews, // enable later in backend
    };

    const API_BASE =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      process.env.NEXT_PUBLIC_API ??
      "https://ai-valuation-backend-1.onrender.com";

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const res = await fetch(`${API_BASE}/predict/land-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      const data = await res.json();
      setResult({
        predicted_price: data.predicted_price ?? data.price ?? null,
        min_price: data.min_price ?? null,
        max_price: data.max_price ?? null,
        confidence: data.confidence ?? null,
        insights: data.insights ?? JSON.stringify(data).slice(0, 400),
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Prediction failed.");
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
      <h1 className="text-3xl font-bold mb-6">Land Price Estimator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                min={0}
                className="input"
                placeholder="Plot Area (sqft)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <select
                className="input"
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
              >
                <option>Residential</option>
                <option>Commercial</option>
                <option>Industrial</option>
                <option>Agricultural</option>
              </select>

              <input
                type="text"
                className="input"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Locality / Area"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
              />

              <input
                type="number"
                min={0}
                className="input"
                placeholder="Road width (ft, optional)"
                value={roadWidth}
                onChange={(e) => setRoadWidth(e.target.value)}
              />
              <select
                className="input"
                value={cornerPlot}
                onChange={(e) => setCornerPlot(e.target.value)}
              >
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>

            {/* Map */}
            <div>
              <div className="mb-2 font-medium">Select Plot on Map</div>
              <div className="mb-2 text-xs text-gray-300">
                Click on the map to mark the plot location
              </div>
              <div
                ref={mapRef}
                className="h-56 rounded-md mb-3 border border-white/6 overflow-hidden"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="btn-secondary"
                >
                  Use My Location
                </button>
                <div className="text-sm text-gray-300 self-center">
                  {latlng
                    ? `Selected: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(
                        5
                      )}`
                    : "No location selected"}
                </div>
              </div>
            </div>

            {/* Images & Camera */}
            <div className="space-y-2">
              <div className="font-medium">Plot Photos (optional)</div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                <label className="btn-secondary cursor-pointer">
                  Upload from gallery
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageFiles(e.target.files)}
                  />
                </label>

                <label className="btn-secondary cursor-pointer">
                  Capture with camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden border border-white/10 h-20"
                    >
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <div className="pt-4">
              <button disabled={loading} className="btn-primary">
                {loading ? "Predicting..." : "Predict Land Price"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Result */}
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-2xl shadow-lg min-h-[220px]">
            <h3 className="text-xl font-semibold mb-2">Prediction</h3>

            {!result && (
              <div className="text-gray-300">
                Fill the form and click{" "}
                <strong>Predict Land Price</strong> to see results here.
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-gray-300">
                      Estimated Plot Value
                    </div>
                    <div className="text-3xl font-bold">
                      {fmt(result.predicted_price)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Based on model v1.0
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-300">Confidence</div>
                    <div className="text-xl font-semibold">
                      {result.confidence
                        ? Math.round(result.confidence * 100) + "%"
                        : "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-300 mb-2">Price range</div>
                  <div className="w-full bg-white/6 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/40"
                      style={{
                        width:
                          result.min_price != null &&
                          result.max_price != null
                            ? "60%"
                            : "40%",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <div>{fmt(result.min_price)}</div>
                    <div>{fmt(result.max_price)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">
                    Model insights
                  </div>
                  <div className="text-xs text-gray-300 whitespace-pre-line">
                    {result.insights}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/3 p-6 rounded-2xl text-sm text-gray-300">
            <div className="font-semibold mb-2">How this works</div>
            <div className="text-xs">
              The model analyzes zoning, location, access, and market patterns
              to estimate fair land value.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
