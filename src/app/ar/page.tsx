'use client'
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const View = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const [direction, setDirection] = useState<string>('N');
  const [isARSupported, setIsARSupported] = useState<boolean>(false);
  const [isARModeActive, setIsARModeActive] = useState<boolean>(false);
  const [location, setLocation] = useState<{ latitude: number | null, longitude: number | null, error: string | null }>({
    latitude: null,
    longitude: null,
    error: null,
  });
  const [ipLocation, setIpLocation] = useState<{ latitude: number | null, longitude: number | null, city: string | null, country: string | null, postalcode: string | null, address: string | null } | null>(null);
  const [liveLocationDetails, setLiveLocationDetails] = useState<{ city: string | null, postalcode: string | null, address: string | null } | null>(null);
  const [isIpLocationActive, setIsIpLocationActive] = useState<boolean>(false);
  const [activeXRSession, setActiveXRSession] = useState<XRSession | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLocationInputActive, setManualLocationInputActive] = useState<boolean>(false);
  const [manualLocation, setManualLocation] = useState<string | null>(null);
  const [tempManualLocationInput, setTempManualLocationInput] = useState<string>('');


  useEffect(() => {
    // Check for AR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
    }

    // Access camera (only if AR is not active OR not supported)
    if (!isARSupported || !isARModeActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
        });
    }

    // Track device orientation for direction
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha ?? 0;
      const directions = ['N', 'E', 'S', 'W'];
      let index = Math.round(alpha / 90) % 4;
      if (index < 0) index += 4;
      setDirection(directions[index]);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      console.warn('Device orientation not supported');
    }

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude, error: null });
          setIsIpLocationActive(false);
          setLocationError(null);
          setManualLocationInputActive(false);
          reverseGeocodeLiveLocation(latitude, longitude); // Reverse geocode live location
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          console.error('Geolocation error code:', error.code);
          console.error('Geolocation error message:', error.message);
          setLocation({ latitude: null, longitude: null, error: error.message || 'Geolocation failed' });
          fetchIpLocation();
          setLocationError('Geolocation service failed.');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setLocation({ latitude: null, longitude: null, error: 'Geolocation not supported' });
      fetchIpLocation();
      setLocationError('Geolocation not supported by browser.');
    }


    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (isARModeActive) {
        stopARSessionCleanup();
      }
    };
  }, [isARSupported, isARModeActive]);

  useEffect(() => {
    if (locationError && ipLocation === null && manualLocation === null) {
      setManualLocationInputActive(true);
    } else {
      setManualLocationInputActive(false);
    }
  }, [locationError, ipLocation, manualLocation]);


  const fetchIpLocation = async () => {
    try {
      const response = await fetch('https://ip-api.com/json');
      if (!response.ok) {
        console.error('IP Geolocation HTTP error:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        const { lat, lon, city, country, zip } = data;
        setIpLocation({ latitude: lat, longitude: lon, city, country, postalcode: zip, address: null }); // Address will be fetched in reverseGeocodeIpLocation
        setIsIpLocationActive(true);
        setLocationError(null);
        reverseGeocodeIpLocation(lat, lon); // Reverse geocode IP location
      } else {
        console.warn('IP geolocation failed:', data.message);
        setIpLocation(null);
        setIsIpLocationActive(false);
        setLocationError('IP based location failed.');
      }
    } catch (error) {
      console.error('Error fetching IP location:', error);
      setIpLocation(null);
      setIsIpLocationActive(false);
      setLocationError('Could not determine location.');
    }
  };

  const reverseGeocodeIpLocation = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        console.error('Reverse geocoding failed:', response.status);
        return; // Do not throw error, IP location is still partially useful
      }
      const data = await response.json();
      if (data && data.address) {
        const addressDetails = data.address;
        const formattedAddress = [
          addressDetails.road || addressDetails.pedestrian || addressDetails.path,
          addressDetails.neighbourhood,
          addressDetails.suburb,
          addressDetails.city || addressDetails.town || addressDetails.village,
        ].filter(Boolean).join(', ');

        setIpLocation(prev => prev ? {...prev, address: formattedAddress } : null);
      }
    } catch (error) {
      console.error('Error during reverse geocoding for IP:', error);
    }
  };


  const reverseGeocodeLiveLocation = async (latitude: number, longitude: number) => {
    setLiveLocationDetails(null); // Reset live location details while fetching
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        console.error('Reverse geocoding failed for live location:', response.status);
        return;
      }
      const data = await response.json();
      if (data && data.address) {
        const addressDetails = data.address;
        setLiveLocationDetails({
          city: addressDetails.city || addressDetails.town || addressDetails.village || null,
          postalcode: addressDetails.postcode || null,
          address: [
            addressDetails.road || addressDetails.pedestrian || addressDetails.path,
            addressDetails.neighbourhood,
            addressDetails.suburb
          ].filter(Boolean).join(', ') || null
        });
      }
    } catch (error) {
      console.error('Error during reverse geocoding for live location:', error);
    }
  };


  const startARSession = async () => {
    if (!navigator.xr || !arCanvasRef.current) return;
    try {
      setIsARModeActive(true);
      const session = await navigator.xr.requestSession('immersive-ar');
      setActiveXRSession(session);
      session.onend = () => {
        setIsARModeActive(false);
        setActiveXRSession(null);
      };

      const renderer = new THREE.WebGLRenderer({
        canvas: arCanvasRef.current,
        context: arCanvasRef.current.getContext('webgl2', { xrCompatible: true }) as WebGL2RenderingContext
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
      const scene = new THREE.Scene();

      // Example: Add a simple cube in AR
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      renderer.xr.setSession(session);

      const animate = () => {
        if (!isARModeActive) {
          renderer.setAnimationLoop(null);
          return;
        }
        renderer.render(scene, camera);
      };

      renderer.setAnimationLoop(animate);
      session.requestAnimationFrame(() => {
        renderer.xr.updateCamera(camera);
      });


    } catch (error) {
      console.error('Failed to start AR session:', error);
      setIsARModeActive(false);
      setActiveXRSession(null);
    }
  };

  const stopARSession = () => {
    if (isARModeActive && activeXRSession) {
      activeXRSession.end();
      setIsARModeActive(false);
      setActiveXRSession(null);
      stopARSessionCleanup();
    }
  };


  const stopARSessionCleanup = () => {
    if (arCanvasRef.current) {
      const renderer = new THREE.WebGLRenderer({ canvas: arCanvasRef.current });
      renderer.dispose();
      const canvas = arCanvasRef.current;
      const gl = canvas.getContext('webgl2');
      if (gl) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      arCanvasRef.current = null;
      renderer.forceContextLoss();
    }
  };

  const handleManualLocationSubmit = () => {
    if (tempManualLocationInput.trim() !== '') {
      setManualLocation(tempManualLocationInput.trim());
      setManualLocationInputActive(false);
      setLocationError(null);
      console.log('Manual location submitted:', tempManualLocationInput.trim());
    } else {
      alert('Please enter a location.');
    }
  };


  return (
    <div className="relative w-full h-screen overflow-hidden">
      {isARSupported && !isARModeActive ? (
        <button onClick={startARSession} className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-lg">Start AR Mode</button>
      ) : isARSupported && isARModeActive ? (
        <>
          <button onClick={stopARSession} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg">Stop AR Mode</button>
          <canvas ref={arCanvasRef} className="absolute inset-0 w-full h-full" />
        </>
      ) : (
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-90" autoPlay muted />
      )}

      {/* FPS-like Overlay Effects - always shown */}
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 border-4 border-gray-800 rounded-xl opacity-50 pointer-events-none" />

      {/* Forza-Like Navigation Strips - always shown */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-[20%] left-1/2 w-16 h-6 bg-blue-500 opacity-80 rounded-full blur-sm"
          style={{
            transform: `translateX(-50%) translateY(${i * 50}px) rotate(${i * 2 - 10}deg)`,
            animation: `stripAnimation 2s ${i * 0.15}s infinite linear`
          }}
        />
      ))}

      {/* Navigation Poles - always shown */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-[10%] left-[calc(50% - 80px + ${i * 40}px)] w-4 h-40 bg-blue-400 opacity-80 rounded-full shadow-lg animate-pole"
        />
      ))}

      {/* Direction & Navigation Effect - always shown */}
      <div className="absolute top-4 left-4 text-white text-xl bg-black bg-opacity-50 px-4 py-2 rounded-lg">
        Direction: {direction}
      </div>

 


      {/* Information Card (Reduced Size) - always shown */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-4 bg-white/20 backdrop-blur-xl rounded-xl w-[80vw] max-w-sm text-white shadow-lg">
        <p className="text-center text-lg">You have reached your location</p>
        <div className="mt-4">
          <img src="https://lp-cms-production.imgix.net/features/2017/09/dubai-marina-skyline-2c8f1708f2a1.jpg?auto=compress&format=auto&fit=crop&q=50&w=1200&h=800" alt="BoomTown Fair" className="w-full rounded-lg" />
          <h2 className="mt-4 text-xl font-bold">BoomTown Fair</h2>
          <p className="text-sm">Music and Festival</p>
          <p className="text-sm">by Sujan Pradhan</p>
          <button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full">Join Now</button>
        </div>
      </div>

      <style>{`
        @keyframes stripAnimation {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          50% { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(1.2); }
        }

        @keyframes poleAnimation {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }

        .animate-strip {
          animation: stripAnimation 2s infinite linear;
        }

        .animate-pole {
          animation: poleAnimation 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default View;