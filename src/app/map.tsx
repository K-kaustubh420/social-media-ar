'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Modify, defaults as defaultInteractions } from 'ol/interaction';
import { Control, defaults as defaultControls } from 'ol/control';
import Geolocation from 'ol/Geolocation';
import { LineString } from 'ol/geom';
import 'ol-ext/dist/ol-ext.css';
import Nominatim from 'ol-ext/control/SearchNominatim'; // Corrected import
import dynamic from 'next/dynamic';
import { Collection } from 'ol';

interface Location {
  longitude: number;
  latitude: number;
  address?: string;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    imageUrls: string[];
    videoUrl?: string;
    location: Location;
    creatorName: string;
    creatorAvatarUrl: string;
    category: string;
    timestamp?: string; // ISO String
}

// Placeholder user object
const user = {
  avatarUrl: '/image.jpg', // Use local image
};


const OpenLayersMap = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const userMarker = useRef<Feature<Point> | null>(null);
  const destinationMarker = useRef<Feature<Point> | null>(null);
  const routeLayer = useRef<VectorLayer<VectorSource> | null>(null);  // Ref for the route layer
  const carouselRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]); // State for challenges
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);


  const createUserIconStyle = () => {
    return new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: '/icons8-location-marker-96.png',
        scale: 0.2, // Increased scale for larger marker
      }),
    });
  };

  const createDestinationIconStyle = () => {
    return new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Keep external URL
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
          // Remove the previous layer before adding a new one.
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
      userMarker.current.setGeometry(new Point(coordinates)); // Update geometry

    }

    const modify = new Modify({ features: new Collection([marker]) });
    map.addInteraction(modify);
    modify.on('modifyend', (evt) => {
      const coords = (evt.features.getArray()[0].getGeometry() as Point).getCoordinates();
      const [longitude, latitude] = toLonLat(coords);
      setUserLocation({ longitude, latitude });
    });
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
           // Remove previous destination marker layer
           map.getLayers().getArray().forEach(layer => {
                if (layer instanceof VectorLayer) {
                    const source = layer.getSource();
                    if (source instanceof VectorSource) {
                        const features = source.getFeatures();
                         features.forEach(feature => {
                            if (feature.get('name') === 'Destination') {
                                map.removeLayer(layer);
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
        }
    };


  useEffect(() => {
    if (!mapRef.current) return;

    const initialView = new View({
      center: fromLonLat([0, 0]),
      zoom: 2,
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

    // Geolocation
    const geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: map.getView().getProjection(),
    });

    geolocation.setTracking(true);

    geolocation.on('error', () => {
      setError('Could not get your location. Please drop a pin.');
    });

    geolocation.on('change:position', () => {
      const coordinates = geolocation.getPosition();
      if (coordinates && !userLocation) {
        const [longitude, latitude] = toLonLat(coordinates);
        setUserLocation({ longitude, latitude });
        updateUserMarker(coordinates, map);
        map.getView().animate({ center: fromLonLat([longitude, latitude]), zoom: 14 });
      }
    });

    const search = new Nominatim(); // Use the class directly
    search.on('select', (evt: any) => { //Consider typing this any, but for this case it's ok
      const { lon, lat } = evt.search;
      const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);
      map.getView().animate({ center: coordinates, zoom: 15 });
    });
    map.addControl(search);

       // Current Location Button
      const currentLocationButton = new (class extends Control {
        constructor() {
          const button = document.createElement('button');
          button.innerHTML = '';
          button.className = 'current-location-button ol-control btn btn-circle btn-ghost';

          const element = document.createElement('div');
          element.className = 'ol-control ol-unselectable'; // Add ol-unselectable class
          element.style.position = 'absolute';
          element.style.top = '0.5em';
          element.style.right = '0.5em';
          element.appendChild(button);

          super({
            element: element,
          });

          button.addEventListener('click', () => {
            if (userLocation) {
              map.getView().animate({
                center: fromLonLat([userLocation.longitude, userLocation.latitude]),
                zoom: 15,
              });
            } else {
              setError('Location not set. Please drop a pin or enable geolocation.');
            }
          });
        }
      })();
      map.addControl(currentLocationButton);
    // Click handler (for pin drop)
    const clickHandler = (evt: any) => {
      const clickedCoordinate = evt.coordinate;
      const [longitude, latitude] = toLonLat(clickedCoordinate);

      if (!userLocation) {
        setUserLocation({ longitude, latitude });
        updateUserMarker(clickedCoordinate, map);
        map.getView().animate({ center: fromLonLat([longitude, latitude]), zoom: 14 });
      }
    };
    map.on('click', clickHandler);



    // Cleanup
    return () => {
      map.un('click', clickHandler);
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
      }
    };
  }, []);

   useEffect(() => {
    if (carouselRef.current) {
      const onScroll = () => {
        if (!carouselRef.current) return;
        const scrollLeft = carouselRef.current.scrollLeft;
        const cardWidth = carouselRef.current.children[0]?.clientWidth || 0; // Get first child (card)
        if (cardWidth > 0)
        {
        const newIndex = Math.round(scrollLeft / cardWidth);
        if (newIndex !== currentEventIndex) {
          setCurrentEventIndex(newIndex);
        }
        }
      };

      carouselRef.current.addEventListener('scroll', onScroll, { passive: true }); // passive for performance
      return () => {
        if(carouselRef.current)
        carouselRef.current.removeEventListener('scroll', onScroll);
      };
    }
  }, [currentEventIndex]);

// Update destination, and *remove* previous route
    useEffect(() => {
        if (mapInstance.current && filteredChallenges.length > 0) {
            removeRoute(); // Remove the old route *before* updating the marker
            updateDestinationMarker(filteredChallenges[currentEventIndex].location, mapInstance.current);
        }
    }, [currentEventIndex, mapInstance.current, filteredChallenges]);


 // Route Calculation (now only runs if both locations are valid)
   useEffect(() => {
        if (userLocation && filteredChallenges.length > 0 && mapInstance.current) {
            const destinationLocation = filteredChallenges[currentEventIndex].location;
            const startCoord = fromLonLat([userLocation.longitude, userLocation.latitude]);
            const endCoord = fromLonLat([destinationLocation.longitude, destinationLocation.latitude]);


            const osrmBaseUrl = 'https://router.project-osrm.org/route/v1/driving/';
            const url = `${osrmBaseUrl}${userLocation.longitude},${userLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                        const route = data.routes[0].geometry;
                        const routeFeature = new Feature({
                            geometry: new LineString(route.coordinates).transform('EPSG:4326', 'EPSG:3857'),
                        });

                        const vectorSource = new VectorSource({
                            features: [routeFeature],
                        });

                        const newRouteLayer = new VectorLayer({  // Use a *new* layer
                            source: vectorSource,
                            style: new Style({
                                stroke: new Stroke({
                                    color: '#4F62D7',
                                    width: 6,
                                }),
                            }),
                        });
                        routeLayer.current = newRouteLayer; // Store the *new* layer in the ref
                        mapInstance.current.addLayer(newRouteLayer);

                        const extent = vectorSource.getExtent();
                       if (mapInstance.current) { // Check mapInstance.current before using
                            mapInstance.current.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15 });
						}

                    } else {
                        setError("Could not find a route.");
                    }
                })
                .catch(err => {
                    setError('Error fetching route: ' + err.message);
                });
        }
    }, [userLocation, currentEventIndex, mapInstance.current, filteredChallenges]);


// Filter events based on search term and categories
    useEffect(() => {
      const filtered = challenges.filter(challenge => {
        const titleMatch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase());
        const descriptionMatch = challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(challenge.category);
        return (titleMatch || descriptionMatch) && categoryMatch;
      });
        setFilteredChallenges(filtered);

        // Update map markers and carousel index based on the *first* filtered event.
        if (filtered.length > 0) {
            setCurrentEventIndex(0); // Reset to first event
              if (mapInstance.current) {
                removeRoute(); // Clear any existing route
                 updateDestinationMarker(filtered[0].location, mapInstance.current);
              }

        } else {
            // Handle case with no matching events (e.g., show a message or clear markers).
              if (mapInstance.current){
                removeRoute(); // Clear route on no filter results
                    mapInstance.current.getLayers().getArray().forEach(layer => {
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
             }
        }

    }, [searchTerm, selectedCategories, mapInstance.current, challenges]);

    const handleCategoryClick = (category: string) => {
      setSelectedCategories((prevCategories) => {
          if (prevCategories.includes(category)) {
              return prevCategories.filter((c) => c !== category);
          } else {
              return [...prevCategories, category];
          }
      });
  };

  const availableCategories = [...new Set(challenges.map((challenge) => challenge.category))];

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const response = await fetch('/api/challenges'); // Your API endpoint
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Challenge[] = await response.json();
                setChallenges(data);
                 setFilteredChallenges(data);  //Initially show all challenges
                if(data.length > 0 && mapInstance.current) {
                    updateDestinationMarker(data[0].location, mapInstance.current);
                }
            } catch (error) {
                console.error("Failed to fetch challenges:", error);
                setError('Failed to load challenges.');
            }
        };

        fetchChallenges();
    }, []); // Fetch challenges on component mount


 return (
    <div className="map-container relative h-screen w-full">
      <div ref={mapRef} className="map h-full w-full" />

      {/* Search and Filter Card */}
      <div className='text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-box absolute bottom-72 left-1/2 transform -translate-x-1/2  z-10 w-[90vw] p-4 shadow-lg'>
            <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                 className="input bg-transparent input-bordered w-full mb-2 dark:placeholder-gray-400"
            />
            <div className="flex flex-wrap ">
                {availableCategories.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`badge ${selectedCategories.includes(category) ? 'badge-primary' : 'badge-outline'} mx-1 my-0.5 dark:border-gray-600 dark:text-gray-300`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>

      <div
        className="carousel w-full bg-transparent rounded-box absolute bottom-0 left-0 z-10"
        ref={carouselRef}
        style={{borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '15px 0'}}
      >
        {filteredChallenges.map((challenge) => (
          <div key={challenge.id} className="carousel-item ">
            <div className="event-card w-[90vw] mx-[5vw] flex flex-col rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800">
              <img src={challenge.imageUrls && challenge.imageUrls.length > 0 ? challenge.imageUrls[0] : "/image.jpeg"} alt={challenge.title} className="event-image w-full h-32 object-cover rounded-md mb-4" />
              <div className="event-info flex-1">
                <div className="event-title font-bold text-lg mb-1">{challenge.title}</div>
                <div className="event-subtitle text-sm mb-2">{challenge.description}</div>
                <div className="event-creator flex items-center mt-auto">
                    <img src={challenge.creatorAvatarUrl} alt="Creator" className="creator-avatar w-5 h-5 rounded-full mr-2" />
                  <span className='text-gray-800 dark:text-gray-300'>{challenge.creatorName}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

const DynamicMapComponent = dynamic(() => Promise.resolve(OpenLayersMap), {
  ssr: false,
});

export default DynamicMapComponent;