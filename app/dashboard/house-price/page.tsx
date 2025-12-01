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
  // form
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [bhk, setBhk] = useState("2BHK");
  const [furnishing, setFurnishing] = useState("Semi-Furnished");
  const [buildYear, setBuildYear] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");

  // amenities & map
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // images (gallery + camera)
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // data URLs for UI preview

  // result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // init amenities
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    AMENITIES.forEach((a) => (initial[a.id] = false));
    setSelectedAmenities(initial);
  }, []);

  // Leaflet init (client-only)
  useEffect(() => {
    let mounted = true;
    async function initMap() {
      try {
        const L = await import("leaflet");

        // marker icons
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: (await import("leaflet/dist/images/marker-icon-2x.png")).default,
          iconUrl: (await import("leaflet/dist/images/marker-icon.png")).default,
          shadowUrl: (await import("leaflet/dist/images/marker-shadow.png")).default,
        });

        if (!mounted || !mapRef.current) return;

        const map = L.map(mapRef.current, { center: [20.5937, 78.9629], zoom: 6 });
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
        console.error("Leaflet load error:", err);
      }
    }
    initMap();

    return () => {
      mounted = false;
      try {
        leafletMapRef.current?.remove();
        leafletMapRef.current = null;
      } catch {}
    };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatlng({ lat, lng });
        try {
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 14);
            if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
            else {
              const L = (window as any).L;
              markerRef.current = L.marker([lat, lng]).addTo(leafletMapRef.current);
            }
          }
        } catch {}
      },
      (err) => alert("Unable to get location: " + err.message)
    );
  };

  const toggleAmenity = (id: string) =>
    setSelectedAmenities((s) => ({ ...s, [id]: !s[id] }));

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  // Image selection (gallery)
  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 5); // max 5
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

  // Camera (takes single photo, adds to previews)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetResult();

    if (!area || !bedrooms || !bathrooms || !city || !locality) {
      setError("Please fill area, bedrooms, bathrooms, city and locality.");
      return;
    }
    if (!latlng) {
      setError("Please pick a location on the map (or use 'Use My Location').");
      return;
    }

    setLoading(true);
    setError(null);

    // prepare payload
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
      // images: imagePreviews, // ⬅️ enable later when backend supports it
    };

    const API_BASE =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      process.env.NEXT_PUBLIC_API ??
      "https://ai-valuation-backend-1.onrender.com";

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const res = await fetch(`${API_BASE}/predict/house-price`, {
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
      <h1 className="text-3xl font-bold mb-6">Residential Price Estimator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                min={0}
                className="input"
                placeholder="Area (sqft)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="input"
                placeholder="Bedrooms"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="input"
                placeholder="Bathrooms"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
              <select
                className="input"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option>Apartment</option>
                <option>Independent House</option>
                <option>Villa</option>
                <option>Studio</option>
              </select>

              <select
                className="input"
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
              >
                <option>1BHK</option>
                <option>2BHK</option>
                <option>3BHK</option>
                <option>4BHK+</option>
              </select>

              <select
                className="input"
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
              >
                <option>Unfurnished</option>
                <option>Semi-Furnished</option>
                <option>Furnished</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                className="input"
                placeholder="Year Built (optional)"
                value={buildYear}
                onChange={(e) => setBuildYear(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                type="text"
                className="input col-span-2"
                placeholder="Locality / Area"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
              />
            </div>

            {/* Amenities */}
            <div>
              <div className="mb-2 font-medium">Amenities</div>
              <div className="flex flex-wrap gap-3">
                {AMENITIES.map((a) => {
                  const active = selectedAmenities[a.id];
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        active
                          ? "bg-white/8 border-white/20"
                          : "bg-transparent border-white/5 hover:bg-white/3"
                      }`}
                    >
                      <span className="text-xl">{a.icon}</span>
                      <span className="text-sm">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Map */}
            <div>
              <div className="mb-2 font-medium">Pick location on map</div>
              <div className="mb-2 text-xs text-gray-300">
                Click the map to set lat/lng — or use your current location
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
              <div className="font-medium">Property Photos (optional)</div>
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
                {loading ? "Predicting..." : "Predict Price"}
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
                Fill the form and click <strong>Predict Price</strong> to see
                results here.
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-gray-300">
                      Estimated Market Value
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

                {/* range bar */}
                <div>
                  <div className="text-sm text-gray-300 mb-2">Price range</div>
                  <div className="w-full bg-white/6 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/40"
                      style={{
                        width:
                          result.min_price != null &&
                          result.max_price != null
                            ? `${Math.min(
                                100,
                                (100 *
                                  ((result.max_price -
                                    (result.min_price ?? 0)) /
                                    Math.max(
                                      1,
                                      result.max_price ?? 1
                                    ))) %
                              100}`
                            : "40%",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left:
                          result.min_price != null &&
                          result.max_price != null &&
                          result.predicted_price != null
                            ? `${
                                ((result.predicted_price -
                                  (result.min_price ?? 0)) /
                                  Math.max(
                                    1,
                                    (result.max_price ?? 1) -
                                      (result.min_price ?? 0)
                                  )) *
                                100
                              }%`
                            : "50%",
                        transform: "translateX(-50%)",
                        top: -6,
                      }}
                    >
                      <div className="bg-white text-black px-2 py-1 rounded text-xs font-semibold shadow">
                        Model
                      </div>
                    </div>
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

                <div>
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      alert(
                        "This can call an inflation endpoint to show adjusted price (future enhancement)."
                      )
                    }
                  >
                    Show inflation-adjusted value
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/3 p-6 rounded-2xl text-sm text-gray-300">
            <div className="font-semibold mb-2">How this works</div>
            <div className="text-xs">
              We use an ensemble ML model trained on historical transactions,
              local amenities, proximity data and market trends. Predictions are
              indicative and should be used as an estimate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
