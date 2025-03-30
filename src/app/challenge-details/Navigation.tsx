'use client';
import React, { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import * as olProj from 'ol/proj';
import 'ol/ol.css'; // Import OpenLayers CSS
import { MapPin } from 'lucide-react';

interface NavigationProps {
    latitude?: number;
    longitude?: number;
    locationName?: string;
}

const Navigation: React.FC<NavigationProps> = ({ latitude, longitude, locationName }) => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [destination, setDestination] = useState<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);

    useEffect(() => {
        if (latitude && longitude) {
            setDestination([longitude, latitude]); // OpenLayers uses [longitude, latitude]
        }
    }, [latitude, longitude]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]); // OpenLayers uses [longitude, latitude]
                },
                error => {
                    console.error("Error getting user location:", error);
                    setError("Could not get user location. Please ensure location services are enabled.");
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        map.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                })
            ],
            view: new View({
                center: olProj.fromLonLat([0, 0]), // Default center
                zoom: 12
            })
        });
    }, []);

    useEffect(() => {
        if (!map.current) return;

        const layers = map.current.getLayers();

        // Remove existing marker layers if they exist
        layers.forEach(layer => {
            if (layer instanceof VectorLayer && layer.get('isMarkerLayer')) {
                map.current?.removeLayer(layer);
            }
        });

        const markerFeatures = [];

        if (userLocation) {
            const userMarker = new Feature({
                geometry: new Point(olProj.fromLonLat(userLocation))
            });
            userMarker.setStyle(new Style({
                image: new Icon({
                    anchor: [0.5, 1],
                    src: 'https://openlayers.org/en/latest/examples/data/icon.png', // Default marker icon
                })
            }));
            markerFeatures.push(userMarker);
        }

        if (destination) {
            const destMarker = new Feature({
                geometry: new Point(olProj.fromLonLat(destination))
            });
            destMarker.setStyle(new Style({
                image: new Icon({
                    anchor: [0.5, 1],
                    src: 'https://openlayers.org/en/latest/examples/data/icon.png', // Default marker icon
                })
            }));
            markerFeatures.push(destMarker);
        }


        if (markerFeatures.length > 0) {
            const vectorSource = new VectorSource({
                features: markerFeatures,
            });

            const markerLayer = new VectorLayer({
                source: vectorSource,
            });
            markerLayer.set('isMarkerLayer', true); // Mark this layer as marker layer
            map.current.addLayer(markerLayer);

            if (userLocation && destination) {
                const view = map.current.getView();
                view.fit(vectorSource.getExtent(), {
                    padding: [50, 50],
                    maxZoom: 15 // Optional: Limit max zoom after fitting bounds
                });
            } else if (destination) {
                map.current.getView().setCenter(olProj.fromLonLat(destination));
            } else if (userLocation) {
                 map.current.getView().setCenter(olProj.fromLonLat(userLocation));
            }
        }


    }, [userLocation, destination]);


    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
                <MapPin className="mr-2" size={20} /> Navigation (OpenLayers)
            </h2>
            {error && <p className="text-red-500">{error}</p>}
            <div ref={mapRef} style={{ height: '400px', width: '100%' }} className="rounded-lg overflow-hidden">
                {/* Map will be rendered here */}
            </div>
            {/* Directions and transport options will be added here later */}
        </div>
    );
};

export default Navigation;