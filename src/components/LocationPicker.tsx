import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";

// Fix default marker icons (Leaflet + bundlers)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  liveTrack?: boolean;
}

const Recenter = ({ pos }: { pos: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 14));
  }, [pos, map]);
  return null;
};

const ClickHandler = ({ onChange }: { onChange: Props["onChange"] }) => {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

export const LocationPicker = ({ value, onChange, liveTrack = false }: Props) => {
  const [address, setAddress] = useState<string>("");
  const watchId = useRef<number | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => onChange({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    );
  };

  // Live tracking for women alert
  useEffect(() => {
    if (!liveTrack || !navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => onChange({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTrack]);

  // Reverse geocode (free Nominatim)
  useEffect(() => {
    if (!value) return;
    const c = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${value.lat}&lon=${value.lng}`,
      { signal: c.signal, headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((d) => setAddress(d.display_name ?? ""))
      .catch(() => {});
    return () => c.abort();
  }, [value]);

  const center: [number, number] = value ? [value.lat, value.lng] : [20.5937, 78.9629]; // India

  return (
    <div className="space-y-2">
      <div className="h-56 rounded-lg overflow-hidden border border-border">
        <MapContainer center={center} zoom={value ? 15 : 5} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {value && <Marker position={[value.lat, value.lng]} icon={icon} />}
          <Recenter pos={value} />
          <ClickHandler onChange={onChange} />
        </MapContainer>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
          <LocateFixed /> Use my location
        </Button>
        {value && (
          <span className="text-xs text-muted-foreground truncate">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        )}
      </div>
      {address && <p className="text-xs text-muted-foreground line-clamp-2">{address}</p>}
    </div>
  );
};
