'use client'
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/firebase/firebase';
import { collection, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const ChallengeAcceptedPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const challengeId = searchParams.get('id');
  const challengeTitle = searchParams.get('title');
  const locationName = searchParams.get('locationName');
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const expiryDate = searchParams.get('expiryDate');

  const useMockAuth = () => {
    const mockUser = { uid: 'kjafJ0pUp3byMrveRE1kYAyJ4Je2', email: 'neupanekiran23@gmail.com', displayName: 'Nupane Kiran' };
    return { authUser: mockUser, loading: false };
  };
  const { authUser, loading: authLoading } = useMockAuth();

  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<'accepted' | 'completed' | 'dropped' | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [distanceToChallenge, setDistanceToChallenge] = useState<number | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    const checkChallengeStatus = async () => {
      if (!challengeId) return;
      const userChallengeRef = doc(collection(db, 'userChallenges'), `${authUser.uid}_${challengeId}`);
      const docSnap = await getDoc(userChallengeRef);
      if (docSnap.exists()) {
        setChallengeAccepted(true);
        setChallengeStatus(docSnap.data().challengeStatus || 'accepted');
      }
      setLoading(false);
    };
    checkChallengeStatus();
  }, [authUser, router, challengeId]);

  useEffect(() => {
    if (userLocation && latitude && longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(latitude),
        parseFloat(longitude)
      );
      setDistanceToChallenge(distance);
    }
  }, [userLocation, latitude, longitude]);

  const getLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log("Live Location:", { latitude, longitude, accuracy });
          setUserLocation({ latitude, longitude });
          setLocationError(null);
          reverseGeocodeLiveLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          let errorMessage = "Geolocation failed.";
          if (error.code === 1) errorMessage = "Location permission denied.";
          if (error.code === 2) errorMessage = "Location unavailable.";
          if (error.code === 3) errorMessage = "Geolocation timeout.";
          setLocationError(errorMessage);
          setUserLocation(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      console.warn("Geolocation is not supported by this browser.");
    }
  };

  const reverseGeocodeLiveLocation = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      if (!response.ok) {
        console.error("Reverse geocoding failed:", response.status);
        return;
      }
      const data = await response.json();
      console.log("Reverse Geocoded Address:", data.address);
    } catch (error) {
      console.error("Error during reverse geocoding:", error);
    }
  };

  const checkLocation = async () => {
    if (!userLocation || !latitude || !longitude) {
      setLocationError("Please get your live location first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/mistral/check-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLatitude: userLocation.latitude,
          userLongitude: userLocation.longitude,
          challengeLatitude: parseFloat(latitude),
          challengeLongitude: parseFloat(longitude),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check location");
      }

      const result = await response.json();
      console.log("Location Check Result:", result);
      setIsWithinRadius(result.isWithinRadius);
      setDistanceToChallenge(result.calculatedDistance);
      setLocationError(null);
    } catch (error) {
      console.error("Error checking location:", error);
      setLocationError("Failed to verify location. Please try again.");
      setIsWithinRadius(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueChallenge = async () => {
    if (!authUser || !challengeId) return;

    setLoading(true);
    setFirebaseError(null);

    try {
      const userChallengeRef = doc(collection(db, 'userChallenges'), `${authUser.uid}_${challengeId}`);
      await setDoc(userChallengeRef, {
        userId: authUser.uid,
        challengeId,
        acceptedAt: serverTimestamp(),
        expiryDate: expiryDate || null,
        challengeTitle: challengeTitle || null,
        locationName: locationName || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        challengeStatus: 'accepted',
      });

      setChallengeAccepted(true);
      setChallengeStatus('accepted');
    } catch (error: any) {
      console.error("Firebase error accepting challenge:", error);
      setFirebaseError("Failed to save challenge progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDropChallenge = async () => {
    if (!authUser || !challengeId) return;

    setLoading(true);
    setFirebaseError(null);

    try {
      const userChallengeRef = doc(collection(db, 'userChallenges'), `${authUser.uid}_${challengeId}`);
      await setDoc(userChallengeRef, {
        ...((await getDoc(userChallengeRef)).data()),
        challengeStatus: 'dropped'
      }, { merge: true });
      
      setChallengeAccepted(false);
      setChallengeStatus('dropped');
      router.push('/challenges');
    } catch (error: any) {
      console.error("Firebase error dropping challenge:", error);
      setFirebaseError("Failed to drop challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChallenge = async () => {
    if (!authUser || !challengeId) return;

    setLoading(true);
    setFirebaseError(null);

    try {
      const userChallengeRef = doc(collection(db, 'userChallenges'), `${authUser.uid}_${challengeId}`);
      await setDoc(userChallengeRef, {
        ...((await getDoc(userChallengeRef)).data()),
        challengeStatus: 'completed',
        completedAt: serverTimestamp(),
      }, { merge: true });

      setChallengeStatus('completed');
    } catch (error: any) {
      console.error("Firebase error completing challenge:", error);
      setFirebaseError("Failed to mark challenge as completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="bg-black text-white min-h-screen flex justify-center items-center">Loading...</div>;
  }

  if (!challengeId || !challengeTitle) {
    return <div className="bg-black text-white min-h-screen flex justify-center items-center">Challenge information is missing.</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen p-4 container mx-auto">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <p>Loading...</p>
        </div>
      )}

      {!challengeAccepted ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">Challenge Not Accepted</h1>
          <p>It seems you haven't accepted this challenge yet.</p>
          <button
            onClick={handleContinueChallenge}
            className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Accepting Challenge...' : 'Continue Doing Challenge'}
          </button>
          {firebaseError && <p className="text-red-500 mt-2">{firebaseError}</p>}
          <button
            onClick={() => router.back()}
            className="mt-2 block bg-gray-700 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go Back to Challenge Details
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">Continue Your Challenge: {challengeTitle}</h1>
          <p className="mb-4">Status: {challengeStatus}</p>

          {expiryDate && (
            <div className="mb-4 flex items-center text-gray-300">
              <Clock className="mr-2" size={20} /> Expires on: {new Date(expiryDate).toLocaleDateString()}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Location Information</h2>
            <p className="text-gray-300">Challenge Location: {locationName || 'Not specified'}</p>
            {latitude && longitude && (
              <p className="text-gray-300">
                Target Coordinates: Lat: {parseFloat(latitude).toFixed(4)}, Lon: {parseFloat(longitude).toFixed(4)}
              </p>
            )}
            {userLocation ? (
              <>
                <p className="text-gray-300">
                  Your Location: Lat: {userLocation.latitude.toFixed(4)}, Lon: {userLocation.longitude.toFixed(4)}
                </p>
                {distanceToChallenge !== null && (
                  <p className="text-gray-300">
                    Distance to Challenge: {(distanceToChallenge / 1000).toFixed(2)} km (
                    {distanceToChallenge.toFixed(0)} meters)
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-300">Click below to get your live location.</p>
            )}
            <button
              onClick={getLiveLocation}
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Get Live Location
            </button>
            {locationError && <p className="text-red-500 mt-2">{locationError}</p>}
          </div>

          {userLocation && challengeStatus !== 'completed' && (
            <div className="mb-6">
              <button
                onClick={checkLocation}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                I’ve Reached the Correct Place
              </button>
              {isWithinRadius === false && (
                <p className="text-yellow-400 mt-2">You are not within 20 kilometers of the challenge location.</p>
              )}
            </div>
          )}

          <button
            onClick={handleDropChallenge}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
            disabled={loading}
          >
            {loading ? 'Dropping Challenge...' : 'Drop Challenge'}
          </button>
          {firebaseError && <p className="text-red-500 mt-2">{firebaseError}</p>}

          {(isWithinRadius === true || challengeStatus === 'completed') && (
            <div className="flex space-x-4 mt-4">
              <Link href="/arview" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Show AR View
              </Link>
              <Link href="/finalpage" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                See Final Page
              </Link>
              {isWithinRadius === true && challengeStatus !== 'completed' && (
                <button
                  onClick={handleCompleteChallenge}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? 'Marking as Done...' : 'Done'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChallengeAcceptedPage;