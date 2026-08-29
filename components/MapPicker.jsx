// components/MapPicker.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const useMapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents),
  { ssr: false }
);

const MapClickHandler = ({ onMapClick }) => {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export default function MapPicker({ lat, lng, onLocationChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const displayName = result.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    onLocationChange(lat, lng, displayName);
    setSearchResults([]);
    setSearchQuery(result.display_name || "");
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15);
    }
  };

  const handleMarkerDrag = (e) => {
    const lat = e.target.getLatLng().lat;
    const lng = e.target.getLatLng().lng;
    onLocationChange(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleMapClick = (lat, lng) => {
    onLocationChange(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          placeholder="Cari jalan, tempat, atau kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>🔍</button>
      </form>

      {searchResults.length > 0 && (
        <div style={styles.searchResults}>
          {searchResults.map((result) => (
            <div
              key={result.place_id}
              style={styles.resultItem}
              onClick={() => handleSelectLocation(result)}
            >
              <span style={styles.resultIcon}>📍</span>
              <div>
                <div style={styles.resultName}>{result.display_name}</div>
                <div style={styles.resultType}>
                  {result.type} • {result.class}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSearching && <p style={styles.loadingText}>🔍 Mencari...</p>}

      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "300px", width: "100%", borderRadius: "8px" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[lat, lng]}
          draggable={true}
          eventHandlers={{ dragend: handleMarkerDrag }}
        >
          <Popup>Lokasi terpilih</Popup>
        </Marker>
        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>
    </div>
  );
}

const styles = {
  searchForm: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  searchInput: {
    flex: 1,
    padding: "0.6rem 0.8rem",
    border: "1px solid #e9ecef",
    borderRadius: "20px",
    fontSize: "0.85rem",
    outline: "none",
  },
  searchButton: {
    padding: "0.6rem 1rem",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
  },
  searchResults: {
    maxHeight: "200px",
    overflowY: "auto",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "0.75rem",
    border: "1px solid #e9ecef",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 0.8rem",
    borderBottom: "1px solid #f1f3f5",
    cursor: "pointer",
  },
  resultIcon: { fontSize: "1.2rem" },
  resultName: { fontSize: "0.85rem", fontWeight: "500" },
  resultType: { fontSize: "0.7rem", color: "#6c757d" },
  loadingText: {
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#6c757d",
    marginBottom: "0.5rem",
  },
};