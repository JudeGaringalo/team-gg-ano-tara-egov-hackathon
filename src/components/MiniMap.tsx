"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Center } from "./Trash2CashApp";

type BaseMap = "street" | "terrain" | "satellite";

const BASE_MAP_OPTIONS: { value: BaseMap; label: string; url: string; maxZoom: number }[] = [
  { value: "street", label: "Street", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", maxZoom: 19 },
  { value: "terrain", label: "Terrain", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", maxZoom: 17 },
  { value: "satellite", label: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", maxZoom: 19 },
];

function pinIcon(selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" fill="none" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))"><path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 13.5 24.5 15 25C16.5 39.5 30 25.5 30 15 30 6.72 23.28 0 15 0z" fill="${selected ? "#1b5e20" : "#4caf50"}"/><circle cx="15" cy="14" r="5" fill="#fff"/></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="user-location-pulse"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function BaseMapToggle({
  baseMap,
  onChange,
}: {
  baseMap: BaseMap;
  onChange: (v: BaseMap) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const option = BASE_MAP_OPTIONS.find((o) => o.value === baseMap) ?? BASE_MAP_OPTIONS[0];

  return (
    <div ref={ref} className="map-controls-group">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="map-layer-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        {option.label}
      </button>
      {open && (
        <div className="map-layer-dropdown">
          {BASE_MAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`map-layer-option${baseMap === opt.value ? " active" : ""}`}
            >
              <span>{opt.label}</span>
              {baseMap === opt.value && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocateButton({
  mapInstance,
  userMarkerRef,
}: {
  mapInstance: React.MutableRefObject<L.Map | null>;
  userMarkerRef: React.MutableRefObject<L.Marker | null>;
}) {
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.marker(loc, { icon: userLocationIcon() }).addTo(map);
        map.setView(loc, 14, { animate: true });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, [mapInstance, userMarkerRef]);

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={locating}
      className="map-locate-btn"
      title="Use my location"
      aria-label="Use my location"
    >
      {locating ? (
        <span className="map-spinner" />
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
      )}
      {locating ? "Locating..." : "Use My Location"}
    </button>
  );
}

export default function MiniMap({
  centers,
  selected,
  onSelect,
}: {
  centers: Center[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [baseMap, setBaseMap] = useState<BaseMap>("satellite");

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const avgLat = centers.reduce((s, c) => s + c.lat, 0) / centers.length;
    const avgLng = centers.reduce((s, c) => s + c.lng, 0) / centers.length;

    const map = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    const initialOpt = BASE_MAP_OPTIONS.find((o) => o.value === baseMap) ?? BASE_MAP_OPTIONS[2];
    const tile = L.tileLayer(initialOpt.url, { maxZoom: initialOpt.maxZoom }).addTo(map);
    tileLayerRef.current = tile;

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const tile = tileLayerRef.current;
    if (!tile) return;
    const opt = BASE_MAP_OPTIONS.find((o) => o.value === baseMap) ?? BASE_MAP_OPTIONS[0];
    tile.setUrl(opt.url);
  }, [baseMap]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const markers = centers.map((center) => {
      const icon = center.id === selected ? pinIcon(true) : pinIcon(false);
      const marker = L.marker([center.lat, center.lng], { icon }).addTo(map);
      marker.on("click", () => onSelect(center.id));
      return marker;
    });

    markersRef.current = markers;

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [centers, selected, mapInstance.current]);

  return (
    <div className="mini-map-wrap">
      <div ref={mapRef} className="mini-map" />
      <div className="map-controls">
        <BaseMapToggle baseMap={baseMap} onChange={setBaseMap} />
        <LocateButton mapInstance={mapInstance} userMarkerRef={userMarkerRef} />
      </div>
    </div>
  );
}
