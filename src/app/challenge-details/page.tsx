// ChallengeDetailsPage.tsx
'use client'
import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Users, Calendar, ChevronDown, ChevronUp, Image, Video, File } from "lucide-react";
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
    followers: number;
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
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto p-4">
        {/* Prominent Single Image at Top */}
        {challengeData.challengeImages && challengeData.challengeImages.length > 0 ? (
          <img
            src={challengeData.challengeImages[0]}
            alt={challengeData.title}
            className="w-full h-[300px] object-cover rounded-lg mb-4"
          />
        ) : (
          challengeData.imageUrl && (
            <img
              src={challengeData.imageUrl || "https://via.placeholder.com/400x300"}
              alt={challengeData.title}
              className="w-full h-[300px] object-cover rounded-lg mb-4"
            />
          )
        )}

        {/* Combined Image and Video Horizontal Scroll Gallery */}
        <div className="mt-4 overflow-x-auto whitespace-nowrap">
          {(challengeData.challengeImages || []).map((imageUrl, index) => (
            <img
              key={`image-${index}`}
              src={imageUrl}
              alt={`Challenge Image ${index + 1}`}
              className="inline-block w-[200px] h-[200px] rounded-lg mr-2 object-cover"
            />
          ))}
          {(challengeData.challengeVideos || []).map((videoUrl, index) => (
            <video
              key={`video-${index}`}
              src={videoUrl}
              controls
              className="inline-block w-[200px] h-[200px] rounded-lg mr-2 object-cover"
            />
          ))}
          {/* Fallback if no images or videos in arrays, but single image/video URLs exist - for gallery fallback, we can skip this as prominent image already handles single imageUrl */}
        </div>


        {/* Title and Basic Info */}
        <h1 className="text-3xl font-bold mt-4">{challengeData.title}</h1>
        <p className="text-gray-400">{challengeData.subtitle}</p>

        {/* Creator Info */}
        <div className="flex items-center mt-4">
          <img src={challengeData.creatorAvatarUrl} alt={challengeData.creatorName} className="w-12 h-12 rounded-full mr-3" />
          <div>
            <p className="font-semibold">{challengeData.creatorName}</p>
            <p className="text-gray-400">Creator</p>
          </div>
        </div>


        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="stat place-items-center">
            <div className="stat-title text-gray-300 flex items-center">
              <Users className="mr-1" size={16} /> Participants
            </div>
            <div className="stat-value text-xl">{challengeData.participants}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title text-gray-300 flex items-center">
              <Calendar className="mr-1" size={16} /> Start Date
            </div>
            <div className="stat-value text-xl">{challengeData.startDate}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title text-gray-300">Daily Visits</div>
            <div className="stat-value text-xl">{challengeData.dailyVisits}</div>
          </div>
        </div>


        {/* Description (Expandable) */}
        <div className="mt-4">
          <p className={`text-gray-300 ${showMore ? '' : 'line-clamp-3'}`}>
            {challengeData.description}
          </p>
          <button onClick={toggleShowMore} className="text-blue-400 mt-1">
            {showMore ? (
              <span>
                <ChevronUp size={16} className="inline mr-1" /> Show Less
              </span>
            ) : (
              <span>
                <ChevronDown size={16} className="inline mr-1" /> Show More
              </span>
            )}
          </button>
        </div>


        {/* Map Section */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <MapPin className="mr-2" size={20} /> Location
          </h2>
          <p className="text-gray-300">{challengeData.locationName}</p>
          <button onClick={handleSeeOnMap} className="mt-2 text-blue-400 btn btn-ghost font-semibold">
            See on Map
          </button>
        </div>

<div className="w-full md:w-3/4 p-4">
  <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
    <iframe
      src={mapUrl}
      title="Google Maps WebView"
      style={{ width: '100%', height: '600px', border: 'none' }}
      allowFullScreen
    ></iframe>
  </div>
</div>

        {/* File attachments */}
        {challengeData.challengeFiles && challengeData.challengeFiles.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <File className="mr-2" size={20} /> Files
            </h2>
            <div className="flex flex-col space-y-2">
              {challengeData.challengeFiles.map((file, index) => (
                <a
                  key={index}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  File {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}


        {/* Action Bar */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex space-x-4">

            <button onClick={toggleLike} className="hover:text-red-500 transition-colors group">
              <Heart className={liked ? "text-red-500 text-xl group-active:scale-125 transition-transform" : "text-xl group-active:scale-125 transition-transform"} fill={liked ? "red" : "none"} />
            </button>

            <button className="hover:text-blue-500 transition-colors group">
              <MessageCircle className="text-xl group-active:scale-125 transition-transform" />
            </button>
            <button className="hover:text-blue-500 transition-colors group">
              <Share2 className="text-xl group-active:scale-125 transition-transform" />
            </button>
          </div>

          <button onClick={toggleBookmark} className="hover:text-blue-500 transition-colors group">
            <Bookmark className={bookmarked ? "text-xl group-active:scale-125 transition-transform fill-current" : "text-xl group-active:scale-125 transition-transform"} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>

                {/* "Accept Challenge" Button - Conditionally Rendered */}
                {authUser ? (
                    <button
                        onClick={handleAcceptChallenge}
                        className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Accept challenge!
                    </button>
                ) : (
                    <div className="mt-6 text-center">
                        <p className="text-gray-400 mb-2">Please <Link href="/login" className="text-blue-400 hover:underline">login</Link> or <Link href="/signup" className="text-blue-400 hover:underline">signup</Link> to accept this challenge.</p>
                    </div>
                )}

      </div>
    </div>
  );
};

export default ChallengeDetailsPage;