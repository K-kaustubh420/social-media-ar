'use client'
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link'; // Import Link
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
  const [imageUrls, setImageUrls] = useState(null);
  const [radiusMessage, setRadiusMessage] = useState<string | null>(null); // Added radius message state

    const challengeData = {
        latitude: latitude,
        longitude: longitude,
        locationName: locationName
    };

    const mapUrl = challengeData?.latitude && challengeData?.longitude
        ? `https://www.google.com/maps?q=${challengeData.latitude},${challengeData.longitude}&z=15&output=embed`
        : `https://www.google.com/maps?q=${encodeURIComponent(challengeData?.locationName)}&z=15&output=embed`;

        const backgroundMapUrl = challengeData?.latitude && challengeData?.longitude
        ? `https://staticmap.openstreetmap.de/staticmap.php?center=${challengeData.latitude},${challengeData.longitude}&zoom=15&size=600x400&markers=${challengeData.latitude},${challengeData.longitude},red-pushpin`
        : null;
      

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const docRef = doc(db, "challengeImages", "imageUrls");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setImageUrls(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

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

      if (!result.isWithinRadius) {
        setRadiusMessage(`You are not within 20 kilometers of the challenge location.`); // Set the message
      } else {
        setRadiusMessage(null); // Clear the message
      }

      setLocationError(null);
    } catch (error) {
      console.error("Error checking location:", error);
      setLocationError("Failed to verify location. Please try again.");
      setIsWithinRadius(null);
      setRadiusMessage(null);
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

  const backgroundImage = challengeStatus === 'completed' && imageUrls ? imageUrls.challengeCompleted : imageUrls?.background;

  return (
    <div
      className="min-h-screen"
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        color: 'white',
      }}
    >
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <p>Loading...</p>
        </div>
      )}

      {/* Google Maps Embed as Background */}
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{
          border: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>

      {/* Floating Card at Bottom */}
      <div
        className="bg-indigo-50 rounded-xl p-6 shadow-lg text-black"
        style={{
          position: 'absolute',
          bottom: '110px',
          left: '16px',
          right: '16px',
          zIndex: 2,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="rounded-full bg-gray-200 w-10 h-10 mr-2" />
            <div>
              <h2 className="text-lg font-semibold">{challengeTitle}</h2>
              <p className="text-sm text-gray-600">{locationName}</p>
            </div>
          </div>
          {expiryDate && (
            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="mr-1" size={16} />
              {new Date(expiryDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {userLocation && (
          <div className="flex items-center mb-2">
            <ArrowRight className="mr-2" size={20} />
            Distance: {(distanceToChallenge / 1000).toFixed(2)} km
          </div>
        )}

        {userLocation && challengeStatus !== 'completed' ? (
          <button
            onClick={checkLocation}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-xl w-full mb-2"
            disabled={loading || isWithinRadius === false}
          >
            {loading
              ? 'Checking Location...'
              : isWithinRadius === false
              ? radiusMessage
              : 'I’ve Reached the Correct Place'}
          </button>
        ) : challengeStatus === 'completed' ? (
          <div className="alert alert-warning">
            You have reached the correct place and completed this challenge!
          </div>
        ) : (
          <button
            onClick={getLiveLocation}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl w-full mb-2"
            disabled={loading}
          >
            Get Live Location
          </button>
        )}

        {locationError && <p className="text-red-500 mt-2">{locationError}</p>}

        {challengeStatus !== 'completed' && (
          <button
            onClick={handleDropChallenge}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl w-full mb-4"
            disabled={loading}
          >
            {loading ? 'Dropping Challenge...' : 'Drop Challenge'}
          </button>
        )}

        {(isWithinRadius === true || challengeStatus === 'completed') && (
          <div className="flex space-x-4 mt-4">
            <Link
              href="/arview"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
            >
              Show AR View
            </Link>
            <Link
              href="/finalpage"
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl"
            >
              See Final Page
            </Link>
            {isWithinRadius === true && challengeStatus !== 'completed' && (
              <button
                onClick={handleCompleteChallenge}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl"
                disabled={loading}
              >
                {loading ? 'Marking as Done...' : 'Done'}
              </button>
            )}
          </div>
        )}

        {firebaseError && <p className="text-red-500 mt-2">{firebaseError}</p>}
      </div>
    </div>
  );
  
};

export default ChallengeAcceptedPage;