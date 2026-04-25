import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon (Leaflet's default icons break with bundlers)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to handle map click events
const ClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

ClickHandler.propTypes = {
  onMapClick: PropTypes.func.isRequired,
};

// Component to recenter map when position changes
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
};

const Map = ({ lat, lng, onLocationSelect }) => {
  const [currentPosition, setCurrentPosition] = useState([lat, lng]);

  const fetchAddress = useCallback(
    async (latitude, longitude) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          {
            headers: {
              "Accept-Language": "en",
            },
          },
        );
        const data = await response.json();
        if (data.display_name) {
          onLocationSelect(data.display_name, latitude, longitude);
        } else {
          throw new Error("No address found");
        }
      } catch (error) {
        console.error("Failed to fetch address:", error);
      }
    },
    [onLocationSelect],
  );

  const handleMapClick = (newLat, newLng) => {
    setCurrentPosition([newLat, newLng]);
    fetchAddress(newLat, newLng);
  };

  useEffect(() => {
    setCurrentPosition([lat, lng]);
  }, [lat, lng]);

  return (
    <div className="map-container w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] rounded-2xl bg-slate-50 p-2 sm:p-4 shadow-lg">
      <div
        className="relative w-full h-full"
        style={{ borderRadius: "16px", overflow: "hidden" }}
      >
        <MapContainer
          center={currentPosition}
          zoom={15}
          style={{ width: "100%", height: "100%", borderRadius: "16px" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={currentPosition} />
          <ClickHandler onMapClick={handleMapClick} />
          <MapUpdater center={currentPosition} />
        </MapContainer>
      </div>
    </div>
  );
};

Map.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  onLocationSelect: PropTypes.func.isRequired,
};

export default Map;
