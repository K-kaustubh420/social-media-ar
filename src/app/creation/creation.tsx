// components/ChallengeCreation.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { db, storage } from '@/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
import { Style, Icon } from 'ol/style';
import { FaMapMarkerAlt, FaImage, FaVideo, FaUser, FaTag } from 'react-icons/fa';
import Geocoder from 'ol-geocoder';
import 'ol-geocoder/dist/ol-geocoder.min.css';


interface Location {
    latitude: number;
    longitude: number;
    address?: string;
}

interface ChallengeFormData {
    title: string;
    description: string;
    imageUrls: string[];
    videoUrl?: string;
    location: Location;
    creatorName: string;
    creatorAvatarUrl: string;
    category: string;
}

const ChallengeCreation = () => {
    const [formData, setFormData] = useState<ChallengeFormData>({
        title: '',
        description: '',
        imageUrls: [],
        videoUrl: '',
        location: { latitude: 0, longitude: 0, address: '' }, // Initialize address
        creatorName: '',
        creatorAvatarUrl: '',
        category: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<Map | null>(null);
    const marker = useRef<Feature<Point> | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newImageUrls = [...formData.imageUrls];
        newImageUrls[index] = e.target.value;
        setFormData({ ...formData, imageUrls: newImageUrls });
    };

    const addImageUrlField = () => {
        setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
    };

    const createMarkerStyle = () => {
        return new Style({
            image: new Icon({
                anchor: [0.5, 1],
                src: '/icons8-location-marker-96.png',
                scale: 0.06,
                color: '#3700B3',
            }),
        });
    };

   const updateMarker = (coordinates: number[], map: Map) => {
        const newMarker = new Feature({
            geometry: new Point(coordinates),
            name: 'Challenge Location'
        });
        newMarker.setStyle(createMarkerStyle());


        if (!marker.current) {
            const vectorSource = new VectorSource({ features: [newMarker] });
            const vectorLayer = new VectorLayer({ source: vectorSource });
            map.addLayer(vectorLayer);
            marker.current = newMarker;
        } else {
            map.getLayers().getArray().forEach(layer => {
                if (layer instanceof VectorLayer) {
                    const source = layer.getSource();
                    if (source instanceof VectorSource) {
                        const features = source.getFeatures();
                         features.forEach(feature => {
                            if (feature.get('name') === 'Challenge Location') {
                                map.removeLayer(layer);
                            }
                        });
                    }
                }
            });
            const vectorSource = new VectorSource({ features: [newMarker] });
            const vectorLayer = new VectorLayer({ source: vectorSource });
            map.addLayer(vectorLayer);
            marker.current.setGeometry(new Point(coordinates));
        }
    };

    //  Reverse Geocoding (kept outside useEffect)
    const reverseGeocode = async (longitude: number, latitude: number) => {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}&zoom=18&addressdetails=1`;
      try {
          const response = await fetch(url);
          const data = await response.json();
          return data?.display_name || "Address not found"; // Use optional chaining
      } catch (error) {
          console.error("Reverse geocoding error:", error);
          return "Error fetching address";
      }
  };

    //  handleLocationChange (kept outside useEffect)
    const handleLocationChange = (location: Location) => {
      setFormData(prevFormData => ({ ...prevFormData, location }));
    };

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;

        const initialCoordinates = fromLonLat([0, 0]);
        const initialZoom = 2;

        if (!mapInstance.current) {
            const map = new Map({
                target: mapRef.current,
                layers: [new TileLayer({ source: new OSM() })],
                view: new View({
                    center: initialCoordinates,
                    zoom: initialZoom,
                }),
            });
            mapInstance.current = map;

            const geocoder = new Geocoder('nominatim', {
                provider: 'osm',
                lang: 'en',
                placeholder: 'Search for a place...',
                limit: 5,
                keepOpen: false,
                preventDefault: true,
            });
            map.addControl(geocoder);

            geocoder.on('addresschosen', (evt: any) => {
              const coordinates = evt.coordinate;
              map.getView().animate({ center: coordinates, zoom: 15 });
              // No marker, no location update on search.
            });

            //  Click handler is now ASYNC
            const clickHandler = async (evt: any) => {
                const clickedCoordinate = evt.coordinate;
                const [longitude, latitude] = toLonLat(clickedCoordinate);

                //  Reverse geocode FIRST
                const address = await reverseGeocode(longitude, latitude);

                //  THEN update the state and marker
                handleLocationChange({ latitude, longitude, address }); // Include address
                if (mapInstance.current){
                  updateMarker(clickedCoordinate, mapInstance.current);
                }
            };

            map.on('click', clickHandler);

            return () => {
                map.un('click', clickHandler);
                if (mapInstance.current) {
                    mapInstance.current.setTarget(undefined);
                    mapInstance.current.getControls().forEach(control => mapInstance.current?.removeControl(control));
                    mapInstance.current = null;
                }
            };
        }

        // Only update the marker IF location data is present (from click)
        if (formData.location.latitude !== 0 && formData.location.longitude !==0 && mapInstance.current) {
            const newCoordinates = fromLonLat([formData.location.longitude, formData.location.latitude]);
            updateMarker(newCoordinates, mapInstance.current);
        }

    }, [formData.location]); //  formData.location as dependency

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Retained but commented
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(false);

      const filteredImageUrls = formData.imageUrls.filter(url => url.trim() !== '');

      if (!formData.title || !formData.description || filteredImageUrls.length === 0 || !formData.creatorName || !formData.creatorAvatarUrl || !formData.category || formData.location.latitude === 0 || formData.location.longitude === 0) {
          setError('Please fill in all required fields, add at least one image URL, and set the location.');
          setLoading(false);
          return;
      }

      try {
          await addDoc(collection(db, 'challenges'), {
              ...formData,
              imageUrls: filteredImageUrls,
              timestamp: serverTimestamp(),
          });

          setSuccess(true);
          setLoading(false);
           setFormData({
              title: '',
              description: '',
              imageUrls: [],
              videoUrl: '',
              location: { latitude: 0, longitude: 0, address: '' }, // Reset address
              creatorName: '',
              creatorAvatarUrl: '',
              category: '',
          });
          setUploadProgress(0);
          if (fileInputRef.current) {
              fileInputRef.current.value = '';
          }
          if (mapInstance.current) {
              mapInstance.current.getView().animate({ center: fromLonLat([0, 0]), zoom: 2 });
              mapInstance.current.getLayers().forEach(layer => {
                  if (layer instanceof VectorLayer) {
                      const source = layer.getSource();
                      if (source instanceof VectorSource) {
                          source.clear();
                      }
                  }
              });
              marker.current = null;
          }
      } catch (err: any) {
          setError('Error creating challenge: ' + err.message);
          setLoading(false);
          console.error("Error adding document: ", err);
      }
  };

  const handleAddImageClick = () => {
        // Retained but commented out
  };


    return (
        <div className="bg-cover bg-center bg-no-repeat min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1465447142348-e9952c393450?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}>
            <div className="w-full md:w-3/4 lg:w-2/3 xl:w-1/2 bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-8">
                <h1 className="text-3xl font-extrabold text-center text-white">
                    Create a New Challenge
                </h1>

                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                {success && <div className="text-teal-400 text-sm text-center">Challenge created successfully!</div>}

                {loading && (
                    <div className="mb-4">
                        <progress
                            className="progress progress-primary w-full"
                            value={uploadProgress}
                            max="100"
                        />
                        <div className='text-center text-white'>Uploading... {uploadProgress.toFixed(0)}%</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label htmlFor="title" className="block text-sm font-medium text-white">
                            <FaTag className="inline-block mr-2 text-purple-400" /> Challenge Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter challenge title"
                            className="input input-bordered w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>


                    <div className="space-y-1">
                        <label htmlFor="description" className="block text-sm font-medium text-white">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your challenge..."
                            className="textarea textarea-bordered w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                            required
                            rows={4}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="category" className="block text-sm font-medium text-white">
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="select select-bordered w-full bg-gray-800 text-white focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            <option value="Music">Music</option>
                            <option value="Art">Art</option>
                            <option value="Food">Food</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Travel">Travel</option>
                            <option value="Comedy">Comedy</option>
                        </select>
                    </div>


                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                            <FaImage className="inline-block mr-2 text-purple-400" /> Image URLs
                        </label>
                        {formData.imageUrls.map((url, index) => (
                            <div key={index} className="mb-2">
                                <input
                                    type="url"
                                    name={`imageUrl-${index}`}
                                    value={url}
                                    onChange={(e) => handleImageUrlChange(e, index)}
                                    placeholder={`Image URL ${index + 1}`}
                                    className="input input-bordered w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addImageUrlField}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Add Image URL
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="videoUrl" className="block text-sm font-medium text-white">
                            <FaVideo className="inline-block mr-2 text-purple-400" /> Video URL (Optional)
                        </label>
                        <input
                            type="url"
                            id="videoUrl"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleChange}
                            placeholder="Paste a video link (optional)"
                            className="input input-bordered w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                        />
                    </div>


                    <div className="space-y-1">
                        <label htmlFor="creatorName" className="block text-sm font-medium text-white">
                            <FaUser className="inline-block mr-2 text-purple-400" /> Your Name
                        </label>
                        <input
                            type="text"
                            id="creatorName"
                            name="creatorName"
                            value={formData.creatorName}
                            onChange={handleChange}
                            placeholder="Your Name"
                            className="input input-bordered w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>


                    <div className="space-y-1">
                        <label htmlFor="creatorAvatarUrl" className="block text-sm font-medium text-white">
                            Avatar URL
                        </label>
                        <input
                            type="text"
                            id="creatorAvatarUrl"
                            name="creatorAvatarUrl"
                            value={formData.creatorAvatarUrl}
                            onChange={handleChange}
                            placeholder="Your Avatar URL"
                            className="input input-bordered w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>


                   <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                            <FaMapMarkerAlt className="inline-block mr-2 text-purple-400" /> Location
                        </label>
                        <div ref={mapRef} className="h-72 w-full rounded-xl border-2 border-dashed border-gray-700"></div>
                        <p className="text-center text-gray-400 text-sm mt-2">
                            Latitude: {formData.location.latitude.toFixed(4)}, Longitude: {formData.location.longitude.toFixed(4)}
                        </p>
                        {formData.location.address && (
                            <p className="text-center text-gray-400 text-sm mt-2">
                                Address: {formData.location.address}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-6 border border-transparent rounded-full text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-blue-600 hover:from-blue-600 hover:to-purple-500 transition duration-300 ease-in-out"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Challenge'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChallengeCreation;