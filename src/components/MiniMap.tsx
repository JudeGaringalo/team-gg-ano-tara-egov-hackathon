"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Center } from "./Trash2CashApp";

function pinIcon(selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" fill="none" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))"><path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 13.5 24.5 15 25C16.5 39.5 30 25.5 30 15 30 6.72 23.28 0 15 0z" fill="${selected ? "#1b5e20" : "#4caf50"}"/><circle cx="15" cy="14" r="5" fill="#fff"/></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
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

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const avgLat = centers.reduce((s, c) => s + c.lat, 0) / centers.length;
    const avgLng = centers.reduce((s, c) => s + c.lng, 0) / centers.length;

    const map = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
    const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17 });
    const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });

    street.addTo(map);

    L.control.layers({
      Street: street,
      Terrain: terrain,
      Satellite: satellite,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

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
    <div ref={mapRef} className="mini-map" />
  );
}
