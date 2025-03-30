// Navigation.tsx
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Icon, Stroke } from 'ol/style';
import { defaults as defaultInteractions } from 'ol/interaction';
import { defaults as defaultControls } from 'ol/control';
import 'ol-ext/dist/ol-ext.css';
import Nominatim from 'ol-ext/control/SearchNominatim';
import dynamic from 'next/dynamic';
import { LineString } from 'ol/geom';

interface Location {
    longitude: number;
    latitude: number;
}

interface NavigationInstructions {
    driving: string[];
    publicTransport: string[];
}

const Navigation = () => {
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const hardcodedDestination: Location = { longitude: -73.9857, latitude: 40.7580 };
    const [destinationLocation, setDestinationLocation] = useState<Location | null>(hardcodedDestination);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<Map | null>(null);
    const userMarker = useRef<Feature<Point> | null>(null);
    const destinationMarker = useRef<Feature<Point> | null>(null);
    const routeLayer = useRef<VectorLayer<VectorSource> | null>(null);
    const [navigationInstructions, setNavigationInstructions] = useState<NavigationInstructions>({ driving: [], publicTransport: [] });
    const [isLetsGoEnabled, setIsLetsGoEnabled] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [mistralSuggestions, setMistralSuggestions] = useState<{ driving: string | null; publicTransport: string | null }>({ driving: null, publicTransport: null });
    const [isLoadingMistral, setIsLoadingMistral] = useState(false);

    // API KEYS - REMEMBER TO USE .ENV FILES IN REAL PROJECTS
    const openRouteServiceApiKey = '5b3ce3597851110001cf6248084f4a2a34a7472290fdd717896a405a';

    const createUserIconStyle = () => {
        return new Style({
            image: new Icon({
                anchor: [0.5, 1],
                src: '/icons8-location-marker-96.png',
                scale: 0.2,
            }),
        });
    };

    const createDestinationIconStyle = () => {
        return new Style({
            image: new Icon({
                anchor: [0.5, 1],
                src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                scale: 0.05,
            })
        });
    };

    const updateUserMarker = (coordinates: number[], map: Map) => {
        const marker = new Feature({
            geometry: new Point(coordinates),
            name: 'User Location',
        });

        marker.setStyle(createUserIconStyle());
        userMarker.current = marker;

        const vectorSource = new VectorSource({
            features: [marker],
        });
        const vectorLayer = new VectorLayer({ source: vectorSource });

        if (!userMarker.current) {
            map.addLayer(vectorLayer);
        } else {
            map.getLayers().getArray().forEach(layer => {
                if (layer instanceof VectorLayer) {
                    const source = layer.getSource();
                    if (source instanceof VectorSource) {
                        const features = source.getFeatures();
                        features.forEach(feature => {
                            if (feature.get('name') === 'User Location') {
                                map.removeLayer(layer);
                            }
                        });
                    }
                }
            });
            map.addLayer(vectorLayer);
            userMarker.current.setGeometry(new Point(coordinates));
        }
        setIsLetsGoEnabled(true);
    };

    const updateDestinationMarker = (location: Location, map: Map) => {
        const coordinates = fromLonLat([location.longitude, location.latitude]);
        const marker = new Feature({
            geometry: new Point(coordinates),
            name: 'Destination',
        });

        marker.setStyle(createDestinationIconStyle());
        destinationMarker.current = marker;

        const vectorSource = new VectorSource({
            features: [marker],
        });

        if (!destinationMarker.current) {
            const vectorLayer = new VectorLayer({
                source: vectorSource,
            });
            map.addLayer(vectorLayer);
        } else {
            map.getLayers().getArray().forEach(layer => {
                if (layer instanceof VectorLayer) {
                    const source = layer.getSource();
                    if (source instanceof VectorSource) {
                        const features = source.getFeatures();
                        features.forEach(feature => {
                            if (feature.get('name') === 'Destination') {
                                mapInstance.current?.removeLayer(layer);
                            }
                        });
                    }
                }
            });
            const vectorLayer = new VectorLayer({
                source: vectorSource,
            });
            map.addLayer(vectorLayer);
            destinationMarker.current.setGeometry(new Point(coordinates));
        }
    };

    const removeRoute = () => {
        if (mapInstance.current && routeLayer.current) {
            mapInstance.current.removeLayer(routeLayer.current);
            routeLayer.current = null;
            setNavigationInstructions({ driving: [], publicTransport: [] });
            setCurrentStepIndex(-1);
        }
    };

    useEffect(() => {
        if (!mapRef.current) return;

        const initialView = new View({
            center: fromLonLat([-79.4512, 43.6568]),
            zoom: 10,
        });

        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            view: initialView,
            interactions: defaultInteractions().extend([]),
            controls: defaultControls().extend([]),
        });

        mapInstance.current = map;

        if (destinationLocation) {
            updateDestinationMarker(destinationLocation, map);
        }

        const search = new Nominatim();
        search.on('select', (evt: any) => {
            const { lon, lat } = evt.search;
            const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);
            map.getView().animate({ center: coordinates, zoom: 15 });
        });
        map.addControl(search);

        const clickHandler = (evt: any) => {
            const clickedCoordinate = evt.coordinate;
            const [longitude, latitude] = toLonLat(clickedCoordinate);

            setUserLocation({ longitude, latitude });
            updateUserMarker(clickedCoordinate, map);
        };
        map.on('click', clickHandler);

        return () => {
            map.un('click', clickHandler);
            if (mapInstance.current) {
                mapInstance.current.setTarget(undefined);
            }
        };
    }, [destinationLocation]);

    const calculateRoute = useCallback(async () => {
        console.log("calculateRoute function called");
        if (!userLocation || !destinationLocation || !mapInstance.current) {
            console.log("calculateRoute: Missing location or map instance");
            return;
        }

        setIsLoadingMistral(true);
        setMistralSuggestions({ driving: null, publicTransport: null });
        setError(null);
        removeRoute(); // Clear any existing route

        try {
            // 1. Define the prompts
            const drivingPrompt = `Provide a step-by-step driving travel plan from latitude ${userLocation.latitude}, longitude ${userLocation.longitude} to latitude ${destinationLocation.latitude}, longitude ${destinationLocation.longitude}.  Include highway names/numbers, major landmarks, and information about tolls, potential traffic delays, and parking options at the destination.  Highlight any important border crossing procedures if applicable.  Format clearly for easy parsing.`;
            const publicTransportPrompt = `Provide a step-by-step public transport travel plan from latitude ${userLocation.latitude}, longitude ${userLocation.longitude} to latitude ${destinationLocation.latitude}, longitude ${destinationLocation.longitude}.  Include specific modes of transport (e.g., bus number, train line), transfer locations, and estimated travel times. Format clearly for easy parsing.`;

            // 2. Fetch the responses
            const [drivingResponse, publicTransportResponse] = await Promise.all([
                fetch('/api/mistral', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startLat: userLocation.latitude,
                        startLon: userLocation.longitude,
                        endLat: destinationLocation.latitude,
                        endLon: destinationLocation.longitude,
                        prompt: drivingPrompt, // Pass the prompt
                    }),
                }),
                fetch('/api/mistral', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startLat: userLocation.latitude,
                        startLon: userLocation.longitude,
                        endLat: destinationLocation.latitude,
                        endLon: destinationLocation.longitude,
                        prompt: publicTransportPrompt, // Pass the prompt
                    }),
                }),
            ]);

            // 3. Check responses
            if (!drivingResponse.ok || !publicTransportResponse.ok) {
                throw new Error(`Failed to fetch Mistral suggestions: Driving - ${drivingResponse.status}, Public Transport - ${publicTransportResponse.status}`);
            }

            const drivingData = await drivingResponse.json();
            const publicTransportData = await publicTransportResponse.json();

            // 4. Extract the suggestions
            const drivingSuggestion = drivingData.suggestion;
            const publicTransportSuggestion = publicTransportData.suggestion;

            setMistralSuggestions({ driving: drivingSuggestion, publicTransport: publicTransportSuggestion });

            // 5. Parse the instructions
            const drivingInstructions = parseMistralInstructions(drivingSuggestion);
            const publicTransportInstructions = parseMistralInstructions(publicTransportSuggestion);

            setNavigationInstructions({ driving: drivingInstructions, publicTransport: publicTransportInstructions });
            setCurrentStepIndex(0);  // Reset to first step

        } catch (err: any) {
            console.error("Error fetching/parsing Mistral data:", err);
            setError(`Error processing Mistral response: ${err.message}`);
            setNavigationInstructions({ driving: [], publicTransport: [] }); // Clear instructions
            setCurrentStepIndex(-1);
            setMistralSuggestions({ driving: null, publicTransport: null });
            removeRoute();
            // Attempting fallback to OpenRouteService is COMPLEX and will likely require its OWN dual API calls
        } finally {
            setIsLoadingMistral(false);
        }
    }, [userLocation, destinationLocation]);

    const parseMistralInstructions = (mistralOutput: string): string[] => {
        // This is a placeholder.  You **MUST** adapt this to how Mistral formats its output.
        // Assuming Mistral gives a numbered list, one step per line:
        return mistralOutput.split('\n')
            .map(line => line.trim())
            .filter(line => line !== ''); // Remove empty lines
    };

    const handleLetsGoClick = useCallback(() => {
        console.log('"Let\'s Go!" button clicked');
        calculateRoute();
    }, [calculateRoute]);

    const handleClearRoute = useCallback(() => {
        removeRoute();
        setUserLocation(null);
        setIsLetsGoEnabled(false);
        setMistralSuggestions({ driving: null, publicTransport: null });
        setIsLoadingMistral(false);

        if (mapInstance.current && userMarker.current) {
            mapInstance.current.getLayers().getArray().forEach(layer => {
                if (layer instanceof VectorLayer) {
                    const source = layer.getSource();
                    if (source instanceof VectorSource) {
                        const features = source.getFeatures();
                        features.forEach(feature => {
                            if (feature.get('name') === 'User Location') {
                                mapInstance.current?.removeLayer(layer);
                            }
                        });
                    }
                }
            });
        }
    }, []);

    const handleNextStep = useCallback(() => {
        // This may need modification to handle *both* sets of instructions.
        if (currentStepIndex < Math.max(navigationInstructions.driving.length, navigationInstructions.publicTransport.length) - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    }, [currentStepIndex, navigationInstructions.driving.length, navigationInstructions.publicTransport.length]);

    const handlePreviousStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    }, [currentStepIndex]);

    return (
        <div className="navigation-container relative h-screen w-full flex flex-col">
            <div ref={mapRef} className="map h-[40vh] w-full" /> {/* Reduced map height */}

            <div className="controls-panel p-4 bg-black shadow-md rounded-md mt-2 z-10 flex justify-between items-center">
                <div className="origin-info">
                    {userLocation ? (
                        <p>Origin set to: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</p>
                    ) : (
                        <p>Click on the map to set your origin.</p>
                    )}
                </div>
                <div className="actions">
                    <button
                        onClick={handleLetsGoClick}
                        disabled={!isLetsGoEnabled}
                        className={`lets-go-button px-4 py-2 rounded-md ${isLetsGoEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'} mr-2`}
                    >
                        Let's Go!
                    </button>
                    <button
                        onClick={handleClearRoute}
                        className="clear-route-button px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white"
                    >
                        Clear Origin
                    </button>
                </div>
            </div>

            {isLoadingMistral ? (
                <div className="mistral-suggestion bg-yellow-100 p-4 text-yellow-700 rounded-md mt-2">
                    <p>Loading instructions...</p>
                </div>
            ) : (
                mistralSuggestions.driving && mistralSuggestions.publicTransport && (
                    <div className="route-instructions flex flex-row bg-black p-4 shadow-md rounded-md mt-2 max-h-[40vh] overflow-y-auto"> {/* Flex row for columns */}
                        <div className="w-1/2 pr-2"> {/* Left column */}
                            <h3 className="font-bold mb-2">Driving Directions</h3>
                            <ol className="list-decimal pl-5 text-gray-300">
                                {navigationInstructions.driving.map((instruction, index) => (
                                    <li key={index} className="mb-1">
                                        {instruction}
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="w-1/2 pl-2"> {/* Right column */}
                            <h3 className="font-bold mb-2">Public Transport Directions</h3>
                            <ol className="list-decimal pl-5 text-gray-300">
                                {navigationInstructions.publicTransport.map((instruction, index) => (
                                    <li key={index} className="mb-1">
                                        {instruction}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                )
            )}
            {error && <div className="error-message p-4 bg-red-100 text-red-700 rounded-md mt-2">{error}</div>}
            <div className="flex justify-between mt-4">
                <button
                    onClick={handlePreviousStep}
                    disabled={currentStepIndex <= 0}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={handleNextStep}
                    disabled={currentStepIndex >= Math.max(navigationInstructions.driving.length, navigationInstructions.publicTransport.length) - 1}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const DynamicNavigationComponent = dynamic(() => Promise.resolve(Navigation), {
    ssr: false,
});

export default DynamicNavigationComponent;