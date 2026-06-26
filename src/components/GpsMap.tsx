"use client";
import { useEffect, useRef, useState } from "react";

interface GpsPoint {
  lat: number;
  lng: number;
  label: string;
  time: string;
  emoji: string;
}

interface GpsMapProps {
  catName: string;
  homePosition: [number, number];
  geofenceRadius: number;
  trail: GpsPoint[];
  currentPosition: [number, number];
}

export default function GpsMap({
  catName,
  homePosition,
  geofenceRadius,
  trail,
  currentPosition,
}: GpsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import leaflet to avoid SSR
    import("leaflet").then((L) => {
      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: currentPosition,
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark map tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
      }).addTo(map);

      // Geofence circle
      L.circle(homePosition, {
        radius: geofenceRadius,
        color: "#4FAE94",
        fillColor: "#4FAE94",
        fillOpacity: 0.06,
        weight: 2,
        dashArray: "8 5",
      }).addTo(map);

      // Trail polyline
      if (trail.length > 1) {
        const latlngs = trail.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(latlngs, {
          color: "#FFD166",
          weight: 3,
          opacity: 0.8,
          dashArray: "10 6",
        }).addTo(map);
      }

      // Trail markers
      trail.forEach((point) => {
        const icon = L.divIcon({
          html: `<div style="font-size:18px;text-align:center;line-height:1;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.7))">${point.emoji}</div>`,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([point.lat, point.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${point.label}</b><br/>${point.time}`);
      });

      // Current position — pulsing cat marker
      const catIcon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;
          background:rgba(255,143,163,0.2);
          border:2.5px solid #FF8FA3;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;
          box-shadow: 0 0 12px rgba(255,143,163,0.5);
          animation: pulse 2s ease-out infinite;
        ">🐱</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker(currentPosition, { icon: catIcon }).addTo(map)
        .bindPopup(`<b>${catName}</b><br/>Current location`);

      // Force resize after a short delay
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 500);

      mapInstanceRef.current = map;
      setLoaded(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [catName, currentPosition, geofenceRadius, homePosition, trail]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,143,163,0.5); }
          70% { box-shadow: 0 0 0 12px rgba(255,143,163,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,143,163,0); }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ height: 280, width: "100%", borderRadius: 12, overflow: "hidden" }}
      />
      {!loaded && (
        <div
          className="flex items-center justify-center"
          style={{ height: 280, marginTop: -280, borderRadius: 12, background: "#0E0B14" }}
        >
          <span className="font-pixel text-[9px] text-white/40">Loading map…</span>
        </div>
      )}
      {/* Legend */}
      <div className="flex items-center justify-between mt-2.5 px-1">
        <div className="flex items-center gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF8FA3]" /> {catName}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ border: "1.5px dashed #4FAE94" }} /> Safe zone
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-[#FFD166] rounded" /> Trail
          </span>
        </div>
      </div>
    </>
  );
}
