// @/components/GoogleMapComponent.tsx
import React, { useEffect, useRef } from 'react';

interface GoogleMapComponentProps {
    latitude: number;
    longitude: number;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ latitude, longitude }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);  // Store map instance
    const markerInstance = useRef<google.maps.Marker | null>(null); // Store marker instance

    useEffect(() => {
        const initializeMap = async () => {
            if (!mapRef.current) return;

            const google = (window as any).google;  // Ensure google is available globally

            if (!google || !google.maps) {
                console.error("Google Maps API not loaded.");
                return;
            }

            // Create the map if it doesn't exist
            if (!mapInstance.current) {
                const map = new google.maps.Map(mapRef.current, {
                    center: { lat: latitude, lng: longitude },
                    zoom: 15,
                });
                mapInstance.current = map; // Store the map instance

                // Create the marker
                const marker = new google.maps.Marker({
                    position: { lat: latitude, lng: longitude },
                    map: map,
                    title: 'Challenge Location',
                });
                markerInstance.current = marker;  // Store marker instance
            }
            else {
                // Update map center
                mapInstance.current.setCenter({lat: latitude, lng: longitude});

                //Update marker
                markerInstance.current.setPosition({lat: latitude, lng: longitude});
            }
        };

        initializeMap();

        // Cleanup function to remove map on unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current = null;  // Clear the map instance on unmount
            }
             if (markerInstance.current) {
                markerInstance.current.setMap(null);
                markerInstance.current = null; // Clear marker on unmount
            }
        };
    }, [latitude, longitude]);

    return <div style={{ height: '600px', width: '100%' }} ref={mapRef} id="map" />;
};

export default GoogleMapComponent;