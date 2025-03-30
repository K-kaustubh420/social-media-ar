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
    const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
    const [isLetsGoEnabled, setIsLetsGoEnabled] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [mistralSuggestion, setMistralSuggestion] = useState<string | null>(null);
    const [isLoadingMistral, setIsLoadingMistral] = useState(false);

    // API KEYS - REMEMBER TO USE .ENV FILES IN REAL PROJECTS
    const openRouteServiceApiKey = '5b3ce3597851110001cf6248084f4a2a34a7472290fdd717896a405a';
    //const mistralApiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY; // No longer needed here

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
            setRouteInstructions([]);
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

    // const fetchMistralSuggestions = useCallback(async (start: Location, end: Location): Promise<string> => { // DELETED
    //     if (!mistralApiKey) {
    //         console.warn("Mistral API key is not set. Skipping suggestions.");
    //         return "Mistral API key is not set. Skipping suggestions.";
    //     }

    //     const prompt = `Suggest various ways to travel from ${start.latitude}, ${start.longitude} to ${end.latitude}, ${end.longitude}.  Consider modes like bike, car, public transport (bus, trains, cabs), and flights. Provide concise, actionable advice about public transport options`;

    //     try {
    //         const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Accept": "application/json",
    //                 "Authorization": `Bearer ${mistralApiKey}`,
    //             },
    //             body: JSON.stringify({
    //                 model: "mistral-medium", // Choose the model based on your needs
    //                 messages: [{ role: "user", content: prompt }],
    //                 temperature: 0.5,
    //                 max_tokens: 200,
    //             }),
    //         });

    //         if (!response.ok) {
    //             throw new Error(`Mistral API error: ${response.status} - ${response.statusText}`);
    //         }

    //         const data = await response.json();
    //         const suggestion = data.choices[0].message.content.trim();
    //         return suggestion;

    //     } catch (error: any) {
    //         console.error("Error fetching Mistral suggestions:", error);
    //         return `Failed to get travel suggestions: ${error.message}`;
    //     }
    // }, [mistralApiKey]);

    const calculateRoute = useCallback(async () => {
        console.log("calculateRoute function called");
        if (!userLocation || !destinationLocation || !mapInstance.current) {
            console.log("calculateRoute: Missing location or map instance");
            return;
        }

        if (!openRouteServiceApiKey) {
            setError("OpenRouteService API key is missing. Please set 'openRouteServiceApiKey'.");
            console.error("OpenRouteService API key is missing.");
            return;
        }

        const orsRouteUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${openRouteServiceApiKey}&start=${userLocation.longitude},${userLocation.latitude}&end=${destinationLocation.longitude},${destinationLocation.latitude}&instructions=true`;

        try {
            const response = await fetch(orsRouteUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("ORS Route Data:", data);
            if (data.features && data.features.length > 0) {
                const routeGeoJson = data.features[0].geometry;
                const routeFeature = new Feature({
                    geometry: new LineString(routeGeoJson.coordinates).transform('EPSG:4326', 'EPSG:3857'),
                });

                const vectorSource = new VectorSource({
                    features: [routeFeature],
                });

                const newRouteLayer = new VectorLayer({
                    source: vectorSource,
                    style: new Style({
                        stroke: new Stroke({
                            color: '#4F62D7',
                            width: 6,
                        }),
                    }),
                });
                routeLayer.current = newRouteLayer;
                mapInstance.current.addLayer(newRouteLayer);

                const extent = vectorSource.getExtent();
                if (mapInstance.current) {
                    mapInstance.current.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 15 });
                }

                const orsInstructions = data.features[0].properties.segments[0].steps;
                const instructions = orsInstructions.map((step: any) => step.instruction);
                setRouteInstructions(instructions);
                setCurrentStepIndex(0);
                setIsLoadingMistral(true);

                // fetchMistralSuggestions(userLocation, destinationLocation) // DELETED
                //     .then(suggestion => {
                //         console.log("Mistral Suggestion:", suggestion);
                //         setMistralSuggestion(suggestion);
                //     });
                const mistralResponse = await fetch('/api/mistral', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        startLat: userLocation.latitude,
                        startLon: userLocation.longitude,
                        endLat: destinationLocation.latitude,
                        endLon: destinationLocation.longitude,
                    }),
                });

                if (!mistralResponse.ok) {
                    throw new Error(`Failed to fetch Mistral suggestion: ${mistralResponse.status}`);
                }

                const mistralData = await mistralResponse.json();
                setMistralSuggestion(mistralData.suggestion);
                setIsLoadingMistral(false);


            } else {
                setError("Could not find a route using OpenRouteService.");
                setRouteInstructions([]);
                setCurrentStepIndex(-1);
                setMistralSuggestion(null);
                setIsLoadingMistral(false);
            }
        }
        catch (err: any) {
            setError(`Error fetching route from OpenRouteService: ${err.message}`);
            setRouteInstructions([]);
            setCurrentStepIndex(-1);
            console.error("Error fetching route:", err);
            setMistralSuggestion(null);
            setIsLoadingMistral(false);
        }
    }, [openRouteServiceApiKey, userLocation, destinationLocation]);


    const handleLetsGoClick = useCallback(() => {
        console.log('"Let\'s Go!" button clicked');
        calculateRoute();
    }, [calculateRoute]);


    const handleClearRoute = useCallback(() => {
        removeRoute();
        setUserLocation(null);
        setIsLetsGoEnabled(false);
        setMistralSuggestion(null);
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
        if (currentStepIndex < routeInstructions.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    }, [currentStepIndex, routeInstructions.length]);

    const handlePreviousStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    }, [currentStepIndex]);

    return (
        <div className="navigation-container relative h-screen w-full flex flex-col">
            <div ref={mapRef} className="map h-[60vh] w-full" />

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


            <div className="route-instructions bg-black p-4 shadow-md rounded-md mt-2 max-h-[30vh] overflow-y-auto">
                <h3 className="font-bold mb-2">Navigation Steps</h3>
                {routeInstructions.length > 0 ? (
                    <ol className="list-decimal pl-5">
                        {routeInstructions.map((instruction, index) => (
                            <li
                                key={index}
                                className={`mb-1 ${index === currentStepIndex ? 'font-semibold text-blue-500' : 'text-gray-300'}`}
                            >
                                {instruction}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-gray-500">Route instructions will appear here after you click "Let's Go!".</p>
                )}
                {routeInstructions.length > 0 && (
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
                            disabled={currentStepIndex >= routeInstructions.length - 1}
                            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            {isLoadingMistral ? (
                <div className="mistral-suggestion bg-yellow-100 p-4 text-yellow-700 rounded-md mt-2">
                    <p>Loading travel suggestions...</p>
                </div>
            ) : (
                mistralSuggestion && (
                    <div className="mistral-suggestion bg-green-100 p-4 text-green-700 rounded-md mt-2">
                        <h4 className="font-bold">Travel Suggestions:</h4>
                        <p>{mistralSuggestion}</p>
                    </div>
                )
            )}
            {error && <div className="error-message p-4 bg-red-100 text-red-700 rounded-md mt-2">{error}</div>}
        </div>
    );
};

const DynamicNavigationComponent = dynamic(() => Promise.resolve(Navigation), {
    ssr: false,
});

export default DynamicNavigationComponent;