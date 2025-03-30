'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

const DirectionsMap: React.FC = () => {
  const [route, setRoute] = useState<[number, number][]>([]);

  // Hardcoded Start (Chennai) and End (Mumbai) Coordinates
  const startLat = 13.0827;
  const startLng = 80.2707;
  const endLat = 19.076;
  const endLng = 72.8777;

  const startIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684813.png',
    iconSize: [30, 30],
  });

  useEffect(() => {
    const fetchRoute = async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        const coordinates = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
        setRoute(coordinates);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();
  }, []);

  return (
    <MapContainer center={[startLat, startLng]} zoom={5} style={{ height: '80vh', width: '100%' }}>
      {/* Map with OSM Tiles */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Markers for Start and End */}
      <Marker position={[startLat, startLng]} icon={startIcon} />
      <Marker position={[endLat, endLng]} icon={endIcon} />
      
      {/* Draw Route */}
      {route.length > 0 && (
        <Polyline pathOptions={{ color: 'blue' }} positions={route} />
      )}
    </MapContainer>
  );
};

export default DirectionsMap;
