// ChallengeDetailsPage.tsx
'use client'
import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Users, Calendar, ChevronDown, ChevronUp, Image, Video, File, Send, Navigation } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
//import { useAuth } from '@/firebase/authContext'; // Assuming you have an auth context activate when using authentication
import Link from 'next/link';

interface ChallengeDetailsProps {
    id: string;
    imageUrl?: string; // Main challenge image URL (fallback)
    videoUrl?: string; // Main challenge video URL (fallback)
    title: string;
    subtitle: string;
    creatorName: string;
    creatorAvatarUrl: string; // Creator profile image URL (using creatorAvatarUrl)
    dailyVisits: number;
    startDate: string;
    description: string;
    locationName: string;
    latitude?: number;
    longitude?: number;
    challengeImages?: string[]; // Array of challenge image URLs
    challengeVideos?: string[]; // Array of challenge video URLs
    challengeFiles?: string[];
    participants?: number;
    expiryDate?: string; // Add expiryDate to props
  }

const ChallengeDetailsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('id');

  const [challengeData, setChallengeData] = useState<ChallengeDetailsProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // New state for tracking whether the challenge is accepted
// Mock useAuth for isolated testing
const useMockAuth = () => {
  // *** SCENARIO 1: Simulate LOGGED-OUT user ***
  //return { authUser: null, loading: false };

  // *** SCENARIO 2: Simulate LOGGED-IN user ***
   const mockUser = { uid: 'kjafJ0pUp3byMrveRE1kYAyJ4Je2', email: 'neupanekiran23@gmail.com', displayName: 'Nupane Kiran' };
   return { authUser: mockUser, loading: false };
};



  const router = useRouter();
  const { authUser, loading: authLoading } =  useMockAuth();  //useAuth(); // Use your auth context to get user and loading state
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (challengeId) {
      const fetchChallengeDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/challenges/${challengeId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: ChallengeDetailsProps = await response.json();
          setChallengeData(data);
          setLoading(false);
        } catch (error: any) {
          console.error("Fetch error:", error);
          setError("Failed to load challenge details.");
          setLoading(false);
        }
      };

      fetchChallengeDetails();
    } else {
      setError("Challenge ID is missing.");
      setLoading(false);
    }
  }, [challengeId]);

  const toggleLike = () => setLiked(!liked);
  const toggleBookmark = () => setBookmarked(!bookmarked);
  const toggleShowMore = () => setShowMore(!showMore);

  const handleSeeOnMap = () => {
    if (challengeData?.latitude && challengeData?.longitude) {
      console.log(`Navigate to: ${challengeData.latitude}, ${challengeData.longitude}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${challengeData.latitude},${challengeData.longitude}`, '_blank');
    } else {
      console.log("Map coordinates not available.");
      window.open(`https://www.google.com/maps/search/?api=1&query=${challengeData?.locationName}`, '_blank');
    }
  };

  const handleAcceptChallenge = () => {
    if (!authUser) {
      // User is not logged in, handle accordingly (e.g., show login modal, redirect to login page)
      console.log("User not logged in, cannot accept challenge.");
      return; // Or you can set an error state to display a message to the user
    }

    // Redirect to ChallengeAcceptedPage, passing challenge details as query parameters
    router.push(`/challenge-accepted?id=${challengeId}&title=${encodeURIComponent(challengeData?.title || '')}&locationName=${encodeURIComponent(challengeData?.locationName || '')}&latitude=${challengeData?.latitude}&longitude=${challengeData?.longitude}&expiryDate=${challengeData?.expiryDate}`);
  };


  if (loading || authLoading) {
    return <div className="bg-black text-white min-h-screen flex justify-center items-center">Loading challenge details...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex justify-center items-center">Error: {error}</div>;
  }

  const mapUrl = challengeData?.latitude && challengeData?.longitude
  ? `https://www.google.com/maps?q=${challengeData.latitude},${challengeData.longitude}&z=15&output=embed`
  : `https://www.google.com/maps?q=${encodeURIComponent(challengeData?.locationName)}&z=15&output=embed`;


  if (!challengeData) {
    return <div className="bg-black text-white min-h-screen flex justify-center items-center">Challenge data not found.</div>;
  }


  return (
    <div className="relative min-h-screen bg-black text-white">
  
      {/* Fullscreen Map Background */}
      <iframe
        src={mapUrl}
        title="Google Maps WebView"
        className="absolute top-0 left-0 w-full h-full z-0"
        style={{ border: 'none' }}
        allowFullScreen
      ></iframe>
  
      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-end min-h-screen p-4 pointer-events-none">
        <div
          ref={cardRef}
          className="bg-gray-800 rounded-2xl p-4 shadow-md transition-all duration-300 ease-in-out pointer-events-auto"
          style={{ marginBottom: '10px', marginLeft:"40px", marginRight:"40px", maxHeight: '75vh', overflowY: 'auto' }}
        >
  
          {/* Title and Basic Info */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-lg font-bold">{challengeData.title}</h1>
              <p className="text-gray-400 text-xs">{challengeData.subtitle}</p>
            </div>
  
            {authUser ? (
              <button
                onClick={handleAcceptChallenge}
                className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline flex items-center text-xs"
              >
                <Navigation size={20} />
              </button>
            ) : (
              <div className="text-right">
                <p className="text-gray-400 text-xs mb-2">
                  Please <Link href="/login" className="text-blue-400 hover:underline">login</Link> or <Link href="/signup" className="text-blue-400 hover:underline">signup</Link> to accept.
                </p>
              </div>
            )}
          </div>
  
          {/* Prominent Image */}
          {(challengeData.challengeImages?.[0] || challengeData.imageUrl) && (
            <img
              src={challengeData.challengeImages?.[0] || challengeData.imageUrl}
              alt={challengeData.title}
              className="w-full h-[120px] object-cover rounded-lg mb-2"
            />
          )}
  
          {/* Media Gallery */}
          <div className="overflow-x-auto whitespace-nowrap mb-2">
            {(challengeData.challengeImages || []).map((imageUrl, index) => (
              <img
                key={`image-${index}`}
                src={imageUrl}
                alt={`Challenge Image ${index + 1}`}
                className="inline-block w-[80px] h-[80px] rounded-lg mr-1 object-cover hover:scale-110 transition-transform"
              />
            ))}
            {(challengeData.challengeVideos || []).map((videoUrl, index) => (
              <video
                key={`video-${index}`}
                src={videoUrl}
                controls
                className="inline-block w-[80px] h-[80px] rounded-lg mr-1 object-cover hover:scale-110 transition-transform"
              />
            ))}
          </div>
  
          {/* Creator Info */}
          <div className="flex items-center mb-2">
            <img src={challengeData.creatorAvatarUrl} alt={challengeData.creatorName} className="w-6 h-6 rounded-full mr-2" />
            <div>
              <p className="font-semibold text-xs">{challengeData.creatorName}</p>
              <p className="text-gray-400 text-xxs">Creator</p>
            </div>
          </div>
  
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 my-2">
            <div className="stat place-items-center p-0 hover:bg-gray-700 rounded">
              <div className="stat-title text-gray-300 flex items-center text-xxs">
                <Users className="mr-1" size={12} /> Participants
              </div>
              <div className="stat-value text-xs">{challengeData.participants}</div>
            </div>
            <div className="stat place-items-center p-0 hover:bg-gray-700 rounded">
              <div className="stat-title text-gray-300 flex items-center text-xxs">
                <Calendar className="mr-1" size={12} /> Start Date
              </div>
              <div className="stat-value text-xs">{challengeData.startDate}</div>
            </div>
            <div className="stat place-items-center p-0 hover:bg-gray-700 rounded">
              <div className="stat-title text-gray-300 text-xxs">Daily Visits</div>
              <div className="stat-value text-xs">{challengeData.dailyVisits}</div>
            </div>
          </div>
  
          {/* Description */}
          <div className="mb-2">
            <p className={`text-gray-300 text-xxs ${showMore ? '' : 'line-clamp-3'}`}>
              {challengeData.description}
            </p>
            <button onClick={toggleShowMore} className="text-blue-400 mt-1 text-xxs hover:text-blue-300">
              {showMore ? (
                <span><ChevronUp size={12} className="inline mr-1" /> Show Less</span>
              ) : (
                <span><ChevronDown size={12} className="inline mr-1" /> Show More</span>
              )}
            </button>
          </div>
  
          {/* Files */}
          {challengeData.challengeFiles?.length > 0 && (
            <div className="mb-2">
              <h2 className="text-sm font-semibold mb-1 flex items-center">
                <File className="mr-1" size={14} /> Files
              </h2>
              <div className="flex flex-col space-y-0.5">
                {challengeData.challengeFiles.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-xxs hover:text-blue-300"
                  >
                    File {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
  
          {/* Action Bar */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex space-x-2">
              <button onClick={toggleLike} className="hover:text-red-500 transition-colors group">
                <Heart className={liked ? "text-red-500 group-active:scale-125" : "group-active:scale-125"} size={16} fill={liked ? "red" : "none"} />
              </button>
              <button className="hover:text-blue-500 transition-colors group">
                <MessageCircle className="group-active:scale-125" size={16} />
              </button>
              <button className="hover:text-blue-500 transition-colors group">
                <Share2 className="group-active:scale-125" size={16} />
              </button>
            </div>
  
            <button onClick={toggleBookmark} className="hover:text-blue-500 transition-colors group">
              <Bookmark className={bookmarked ? "fill-current group-active:scale-125" : "group-active:scale-125"} size={16} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          </div>
  
        </div>
      </div>
    </div>
  );
  
};

export default ChallengeDetailsPage;