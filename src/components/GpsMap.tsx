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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const mapObjRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const polylineRef = useRef<unknown>(null);
  const trailPoints = useRef<[number, number][]>([]);

  useEffect(() => {
    // Add Leaflet CSS via link tag
    const id = "leaflet-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Add Leaflet JS via script tag (more reliable than dynamic import)
    const scriptId = "leaflet-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setReady(true);
      document.head.appendChild(script);
    } else {
      // Already loaded
      setReady(true);
    }
  }, []);

  // Init map when Leaflet is ready
  useEffect(() => {
    if (!ready || !mapRef.current || mapObjRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: homePosition,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Geofence
    L.circle(homePosition, {
      radius: geofenceRadius,
      color: "#4FAE94",
      fillColor: "#4FAE94",
      fillOpacity: 0.06,
      weight: 2,
      dashArray: "8 5",
    }).addTo(map);

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

    // Trail line
    const polyline = L.polyline([], {
      color: "#FFD166",
      weight: 3,
      opacity: 0.8,
      dashArray: "10 6",
    }).addTo(map);
    polylineRef.current = polyline;

    // Cat marker
    const catIcon = L.divIcon({
      html: `<div style="width:32px;height:32px;background:rgba(255,143,163,0.2);border:2.5px solid #FF8FA3;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px rgba(255,143,163,0.5);animation:gps-pulse 2s ease-out infinite;">🐱</div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const marker = L.marker(currentPosition, { icon: catIcon }).addTo(map)
      .bindPopup(`<b>${catName}</b><br/>GPS tracking active`);
    markerRef.current = marker;
    mapObjRef.current = map;

    // Fix tiles
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
    setTimeout(() => map.invalidateSize(), 1500);

    return () => {
      map.remove();
      mapObjRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Update marker position
  useEffect(() => {
    if (!markerRef.current || !mapObjRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (markerRef.current as any).setLatLng(currentPosition);

    trailPoints.current = [...trailPoints.current, currentPosition];
    if (polylineRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (polylineRef.current as any).setLatLngs(trailPoints.current);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapObjRef.current as any).panTo(currentPosition, { animate: true, duration: 1.5 });
  }, [currentPosition]);

  return (
    <div ref={containerRef}>
      <style>{`
        @keyframes gps-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,143,163,0.5); }
          70% { box-shadow: 0 0 0 12px rgba(255,143,163,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,143,163,0); }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ width: "100%", height: 350 }}
      />
    </div>
  );
}
