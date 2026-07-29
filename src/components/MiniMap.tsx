"use client";

import { useEffect, useRef, useState } from "react";
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

function userLocationIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="user-location-pulse"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
  const userMarkerRef = useRef<L.Marker | null>(null);
  const locateBtnRef = useRef<HTMLDivElement | null>(null);

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

    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
    const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17 });
    const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });

    street.addTo(map);

    L.control.layers({
      Street: street,
      Terrain: terrain,
      Satellite: satellite,
    }, {}, { position: "topright" }).addTo(map);

    mapInstance.current = map;

    const LocateButton = L.Control.extend({
      onAdd: () => {
        const btn = L.DomUtil.create("button", "locate-map-btn leaflet-bar");
        btn.innerHTML = "📍";
        btn.title = "Use my location";
        btn.setAttribute("aria-label", "Use my location");
        btn.style.cssText = "position:relative;top:0;right:0;width:36px;height:36px;border:0;border-radius:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer;font-size:16px;line-height:36px;text-align:center;color:#0057b3;margin-bottom:4px;";
        btn.onclick = () => {
          if (!navigator.geolocation) return;
          btn.disabled = true;
          btn.innerHTML = "⏳";
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
              if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
              userMarkerRef.current = L.marker(loc, { icon: userLocationIcon() }).addTo(map);
              map.setView(loc, 14, { animate: true });
              btn.disabled = false;
              btn.innerHTML = "📍";
            },
            () => {
              btn.disabled = false;
              btn.innerHTML = "📍";
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
          );
        };
        return btn;
      },
    });
    map.addControl(new LocateButton({ position: "topright" }));

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
