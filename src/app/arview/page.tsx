'use client'
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const View = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const [direction, setDirection] = useState<string>('N');
  const [isARSupported, setIsARSupported] = useState<boolean>(false);
  const [isARModeActive, setIsARModeActive] = useState<boolean>(false);
  const [location, setLocation] = useState<{ latitude: number | null, longitude: number | null, accuracy: number | null, error: string | null }>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
  });
  const [ipLocation, setIpLocation] = useState<{ latitude: number | null, longitude: number | null, city: string | null, country: string | null, postalcode: string | null, state: string | null, address: string | null } | null>(null);
  const [liveLocationDetails, setLiveLocationDetails] = useState<{ city: string | null, postalcode: string | null, address: string | null, state: string | null } | null>(null);
  const [isIpLocationActive, setIsIpLocationActive] = useState<boolean>(false);
  const [activeXRSession, setActiveXRSession] = useState<XRSession | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLocationInputActive, setManualLocationInputActive] = useState<boolean>(false);
  const [manualLocation, setManualLocation] = useState<string | null>(null);
  const [tempManualLocationInput, setTempManualLocationInput] = useState<string>('');
  const deviceOrientationRef = useRef<{ alpha: number | null, beta: number | null, gamma: number | null }>({ alpha: null, beta: null, gamma: null });
  const deviceMotionRef = useRef<{ acceleration: DeviceMotionEventAcceleration | null, rotationRate: DeviceMotionEventRotationRate | null }>({ acceleration: null, rotationRate: null });
  const arHitTestSourceRef = useRef<XRHitTestSource | null>(null); // Ref to store AR hitTestSource
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null); // Ref to store the renderer for cleanup
  const arSceneRef = useRef<THREE.Scene | null>(null); // Ref to store the AR scene
  const arCameraRef = useRef<THREE.PerspectiveCamera | null>(null); // Ref to store the AR camera
  const arCubeRef = useRef<THREE.Mesh | null>(null); // Ref to store the AR cube


  useEffect(() => {
    // Check for AR support on component mount
    const checkARSupport = async () => {
      if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
        if (!supported) {
          console.warn('Immersive AR not supported on this device.');
        }
      } else {
        console.warn('WebXR API not supported on this browser.');
      }
    };
    checkARSupport();

    // Access camera if AR is not supported or not active
    if (!isARSupported || !isARModeActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error('Error accessing camera (fallback for non-AR or non-active AR):', error);
        });
    }

    // Device orientation tracking
    const handleOrientation = (event: DeviceOrientationEvent) => {
      deviceOrientationRef.current = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      };
      const alpha = event.alpha ?? 0;
      const directions = ['N', 'E', 'S', 'W'];
      let index = Math.round(alpha / 90) % 4;
      if (index < 0) index += 4;
      setDirection(directions[index]);
    };

    // Device motion tracking
    const handleMotion = (event: DeviceMotionEvent) => {
      deviceMotionRef.current = {
        acceleration: event.acceleration,
        rotationRate: event.rotationRate,
      };
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      console.warn('Device orientation not supported');
    }

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    } else {
      console.warn('Device motion not supported');
    }

    // Geolocation setup (same as before)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocation({ latitude, longitude, accuracy, error: null });
          setIsIpLocationActive(false);
          setLocationError(null);
          setManualLocationInputActive(false);
          reverseGeocodeLiveLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          console.error('Geolocation error code:', error.code);
          console.error('Geolocation error message:', error.message);

          if (error.code === 1) {
            setLocationError('Location permission denied. Using IP location.');
          } else if (error.code === 2) {
            setLocationError('Location unavailable. Using IP location.');
          } else if (error.code === 3) {
            setLocationError('Geolocation timeout. Using IP location.');
          } else {
            setLocationError('Geolocation failed. Using IP location.');
          }

          setLocation({ latitude: null, longitude: null, accuracy: null, error: error.message || 'Geolocation failed' });
          fetchIpLocation();

        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setLocation({ latitude: null, longitude: null, accuracy: null, error: 'Geolocation not supported' });
      fetchIpLocation();
      setLocationError('Geolocation not supported. Using IP location.');
    }


    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
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
        const { lat, lon, city, country, zip, regionName } = data;
        setIpLocation({ latitude: lat, longitude: lon, city, country, postalcode: zip, state: regionName, address: null });
        setIsIpLocationActive(true);
        setLocationError(null);
        reverseGeocodeIpLocation(lat, lon);
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
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      if (!response.ok) {
        console.error('Reverse geocoding failed:', response.status);
        return;
      }
      const data = await response.json();
      if (data && data.address) {
        const addressDetails = data.address;
        const formattedAddress = [
          addressDetails.road || addressDetails.pedestrian || addressDetails.path || addressDetails.address29,
          addressDetails.neighbourhood || addressDetails.suburb,
          addressDetails.city || addressDetails.town || addressDetails.village,
          addressDetails.state,
          addressDetails.country
        ].filter(Boolean).join(', ');

        setIpLocation(prev => prev ? {...prev, address: formattedAddress } : null);
      }
    } catch (error) {
      console.error('Error during reverse geocoding for IP:', error);
    }
  };


  const reverseGeocodeLiveLocation = async (latitude: number, longitude: number) => {
    setLiveLocationDetails(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
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
            addressDetails.road || addressDetails.pedestrian || addressDetails.path  || addressDetails.address29,
            addressDetails.neighbourhood || addressDetails.suburb,
            addressDetails.city || addressDetails.town || addressDetails.village,
            addressDetails.state,
            addressDetails.country
          ].filter(Boolean).join(', ') || null,
          state: addressDetails.state || null,
        });
      }
    } catch (error) {
      console.error('Error during reverse geocoding for live location:', error);
    }
  };


  const startARSession = async () => {
    if (!navigator.xr || !arCanvasRef.current) {
      console.warn('WebXR or canvas ref not available.');
      return;
    }

    try {
      setIsARModeActive(true);
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['depth-sensing', 'plane-detection', 'light-estimation', 'hit-test'],
      });
      setActiveXRSession(session);
      session.onend = () => {
        setIsARModeActive(false);
        setActiveXRSession(null);
        arHitTestSourceRef.current = null;
        rendererRef.current = null; // Clear renderer ref
        arSceneRef.current = null; // Clear scene ref
        arCameraRef.current = null; // Clear camera ref
        arCubeRef.current = null; // Clear cube ref
      };

      // Initialize Three.js renderer, scene, and camera
      const renderer = new THREE.WebGLRenderer({
        canvas: arCanvasRef.current,
        context: arCanvasRef.current.getContext('webgl2', { xrCompatible: true }) as WebGL2RenderingContext
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      rendererRef.current = renderer; // Store renderer in ref

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
      arCameraRef.current = camera; // Store camera in ref
      const scene = new THREE.Scene();
      arSceneRef.current = scene; // Store scene in ref


      // Example: Add a simple cube in AR
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      arCubeRef.current = cube; // Store cube in ref
      scene.add(cube);


      // Handle AR hit test and placement
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleCanvasClick = (event: MouseEvent) => {
        if (!activeXRSession || !renderer.xr.getReferenceSpace() || !arCameraRef.current || !arCubeRef.current) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, arCameraRef.current);


        const hitTestSource = arHitTestSourceRef.current;

        if (hitTestSource) {
          activeXRSession.requestAnimationFrame((_time, frame) => {
            if (!frame) return;
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
              const hitPose = hitTestResults[0].getPose(renderer.xr.getReferenceSpace()!);
              if (hitPose) {
                arCubeRef.current!.position.set(hitPose.transform.position.x, hitPose.transform.position.y + 0.05, hitPose.transform.position.z);
                arCubeRef.current!.quaternion.set(hitPose.transform.orientation.x, hitPose.transform.orientation.y, hitPose.transform.orientation.z, hitPose.transform.orientation.w);
              }
            }
          });
        }
      };

      arCanvasRef.current.addEventListener('click', handleCanvasClick);


      renderer.xr.setSession(session);

      const animate = (timestamp: number, frame?: XRFrame) => {
        if (!isARModeActive || !rendererRef.current || !arSceneRef.current || !arCameraRef.current) {
          renderer.setAnimationLoop(null);
          return;
        }

        if (frame && rendererRef.current.xr.getReferenceSpace()) {
          const referenceSpace = rendererRef.current.xr.getReferenceSpace()!;
          const pose = frame.getViewerPose(referenceSpace);
          if (pose) {
            const view = pose.views[0];
            arCameraRef.current.matrix.fromArray(view.transform.matrix);
            arCameraRef.current.projectionMatrix.fromArray(view.projectionMatrix);
            arCameraRef.current.matrixWorldNeedsUpdate = true;

            // Example: Stabilize cube rotation based on device motion
            if (arCubeRef.current && deviceMotionRef.current.rotationRate?.alpha) {
              arCubeRef.current.rotation.y += deviceMotionRef.current.rotationRate.alpha * 0.001;
            }
          }
        }

        rendererRef.current.render(arSceneRef.current, arCameraRef.current);
      };

      renderer.setAnimationLoop(animate);

      // Create Hit Test Source
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          arHitTestSourceRef.current = source;
        });
      });

      session.requestAnimationFrame(() => {
        if (arCameraRef.current) {
          renderer.xr.updateCamera(arCameraRef.current);
        }
      });


    } catch (error) {
      console.error('Failed to start AR session:', error);
      setIsARModeActive(false);
      setActiveXRSession(null);
      arHitTestSourceRef.current = null;
      rendererRef.current = null; // Clear renderer ref on error
      arSceneRef.current = null; // Clear scene ref on error
      arCameraRef.current = null; // Clear camera ref on error
      arCubeRef.current = null; // Clear cube ref on error
    }
  };

  const stopARSession = () => {
    if (isARModeActive && activeXRSession) {
      activeXRSession.end();
      setIsARModeActive(false);
      setActiveXRSession(null);
      stopARSessionCleanup();
      arHitTestSourceRef.current = null;
      rendererRef.current = null; // Clear renderer ref on stop
      arSceneRef.current = null; // Clear scene ref on stop
      arCameraRef.current = null; // Clear camera ref on stop
      arCubeRef.current = null; // Clear cube ref on stop
    }
  };


  const stopARSessionCleanup = () => {
    if (arCanvasRef.current && rendererRef.current) {
      rendererRef.current.dispose();
      const canvas = arCanvasRef.current;
      const gl = canvas.getContext('webgl2');
      if (gl) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      rendererRef.current.forceContextLoss();
    }
    rendererRef.current = null; // Ensure ref is cleared after cleanup
    arCanvasRef.current = null; // Ensure canvas ref is cleared after cleanup, though it might be managed by React in this case.
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
      {/* AR Mode Toggle Button and Canvas */}
      {isARSupported ? (
        isARModeActive ? (
          <>
            <button onClick={stopARSession} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg z-10">Stop AR Mode</button>
            <canvas ref={arCanvasRef} className="absolute inset-0 w-full h-full" />
          </>
        ) : (
          <button onClick={startARSession} className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-lg z-10">Start AR Mode</button>
        )
      ) : (
        // Fallback to video if AR is not supported
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
      <div className="absolute top-4 left-4 text-white text-lg bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
        Direction: {direction}
      </div>

      {/* Location Display */}
      <div className="absolute top-4 left-[180px] text-white text-sm bg-black/20 backdrop-blur-sm px-1 py-0.5 rounded-lg">
        {locationError && !manualLocationInputActive && <div className="text-red-500">{locationError}</div>}
        {isIpLocationActive && ipLocation ? (
          <span>
            Location from IP (approx.): ({ipLocation.latitude?.toFixed(4)},{ipLocation.longitude?.toFixed(4)}, {ipLocation.address || 'Address not found'}, {ipLocation.city}, {ipLocation.state}, {ipLocation.postalcode})
            <a href="#" onClick={(e) => { e.preventDefault(); navigator.geolocation.getCurrentPosition(() => {}, () => {}); }} className="underline ml-1"> Use Live Location</a>
          </span>
        ) : liveLocationDetails && location.latitude !== null && location.longitude !== null ? (
          <span>
            Live Location (accuracy: {location.accuracy?.toFixed(0)}m): ({location.latitude.toFixed(4)},{location.longitude.toFixed(4)}, {liveLocationDetails.address || 'Address not found'}, {liveLocationDetails.city}, {liveLocationDetails.state}, {liveLocationDetails.postalcode})
          </span>
        ) : manualLocation ? (
          <span>
            Manual location set to: {manualLocation}
          </span>
        ) : manualLocationInputActive ? (
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Enter location"
              className="text-black px-2 py-1 rounded-md mr-2 text-sm"
              value={tempManualLocationInput}
              onChange={(e) => setTempManualLocationInput(e.target.value)}
            />
            <button onClick={handleManualLocationSubmit} className="bg-blue-500 text-white px-2 py-1 rounded-md text-sm">Submit</button>
          </div>
        ) : (
          <span>
            Fetching location...
          </span>
        )}
      </div>


      {/* Information Card */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-3 bg-white/10 backdrop-blur-xl rounded-xl w-[70vw] max-w-xs text-white shadow-lg">
        <p className="text-center text-lg">You have reached your location</p>
        <div className="mt-2">
          <img src="https://lp-cms-production.imgix.net/features/2017/09/dubai-marina-skyline-2c8f1708f2a1.jpg?auto=compress&format=auto&fit=crop&q=50&w=1200&h=800" alt="BoomTown Fair" className="w-full rounded-lg" />
          <h2 className="mt-2 text-lg font-bold">BoomTown Fair</h2>
          <p className="text-sm">Music and Festival</p>
          <p className="text-sm">by Sujan Pradhan</p>
          <button className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-full text-sm">Join Now</button>
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