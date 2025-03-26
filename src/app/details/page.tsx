'use client'
import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Users, Calendar, ChevronDown, ChevronUp, Image, Video, File } from "lucide-react"; // Import more icons

interface ChallengeDetailsProps {
  imageUrl?: string;
  videoUrl?: string; // Add video URL
  title: string;
  subtitle: string;
  creatorName: string;
  creatorImageUrl: string; // Separate creator image URL
  dailyVisits: number;
  followers: number;  // Consider renaming to participants if it's challenge-specific
  startDate: string;
  description: string;
  locationName: string;  //For direct map name
  latitude?: number;    //  For Future use
  longitude?: number;   //  For Future use
  challengeImages?: string[]; // Array for multiple images
  challengeVideos?: string[]; // Array for multiple videos
  challengeFiles?: string[];    // Array for files like pdfs
  participants?: number; //  number of people taking the challenge
}


const ChallengeDetailsPage: React.FC<ChallengeDetailsProps> = ({
  imageUrl = "https://images.wanderon.in/blogs/new/2023/12/leh-ladakh.jpg",
  videoUrl,
  title = "Leh a must visit",
  subtitle = "Travel & Exploration",
  creatorName = "Kiran Prasad",
  creatorImageUrl = "https://images.wanderon.in/blogs/new/2023/12/leh-ladakh.jpg",  // Use the provided creator image
  dailyVisits = 1245,
  followers = 8900, //consider participants count
  startDate = "15 Jan",
  description = "Experience the breathtaking beauty of Leh Ladakh. Explore the high-altitude landscapes, stunning monasteries, and thrilling adventures that make this a must-visit destination!",
  locationName = "Leh, Ladakh", // Example location
  latitude,
  longitude,
  challengeImages = [],
  challengeVideos = [],
  challengeFiles = [],
  participants = 150, // Example participant count

}) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMore, setShowMore] = useState(false); // State for expanding description
  const [currentImageIndex, setCurrentImageIndex] = useState(0); //for carousel
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // for video carousel


  const toggleLike = () => setLiked(!liked);
  const toggleBookmark = () => setBookmarked(!bookmarked);
  const toggleShowMore = () => setShowMore(!showMore);

  // Function to handle "See on Map" click (replace with actual map integration)
  const handleSeeOnMap = () => {
    if (latitude && longitude) {
      //  Implement map navigation using latitude and longitude (e.g., using a library like react-leaflet)
      console.log(`Navigate to: ${latitude}, ${longitude}`);
      // Example (using a simple Google Maps link - NOT RECOMMENDED FOR PRODUCTION, use a proper mapping library!):
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    } else {
      console.log("Map coordinates not available.");
      window.open(`https://www.google.com/maps/search/?api=1&query=${locationName}`, '_blank'); //open by location name

    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % challengeImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + challengeImages.length) % challengeImages.length);
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % challengeVideos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex - 1 + challengeVideos.length) % challengeVideos.length);
  };




  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto p-4">
        {/* Main Image/Video */}
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Title and Basic Info */}
        <h1 className="text-3xl font-bold mt-4">{title}</h1>
        <p className="text-gray-400">{subtitle}</p>

        {/* Creator Info */}
        <div className="flex items-center mt-4">
          <img src={creatorImageUrl} alt={creatorName} className="w-12 h-12 rounded-full mr-3" />
          <div>
            <p className="font-semibold">{creatorName}</p>
            <p className="text-gray-400">Creator</p>
          </div>
        </div>


        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="stat place-items-center">
            <div className="stat-title text-gray-300 flex items-center">
              <Users className="mr-1" size={16} /> Participants
            </div>
            <div className="stat-value text-xl">{participants}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title text-gray-300 flex items-center">
              <Calendar className="mr-1" size={16} /> Start Date
            </div>
            <div className="stat-value text-xl">{startDate}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title text-gray-300">Daily Visits</div>
            <div className="stat-value text-xl">{dailyVisits}</div>
          </div>
        </div>


        {/* Description (Expandable) */}
        <div className="mt-4">
          <p className={`text-gray-300 ${showMore ? '' : 'line-clamp-3'}`}>
            {description}
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
          <p className="text-gray-300">{locationName}</p>
          <button onClick={handleSeeOnMap} className="mt-2 text-blue-400 btn btn-ghost font-semibold">
            See on Map
          </button>
        </div>

        {/*  Carousel for multiple images */}
        {challengeImages.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <Image className="mr-2" size={20} /> Challenge Images
            </h2>
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <img
                src={challengeImages[currentImageIndex]}
                alt={`Challenge Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {challengeImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                  </button>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {challengeImages.map((_, index) => (
                      <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-gray-500"
                          }`}
                      ></span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Video carousel */}
        {challengeVideos.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <Video className="mr-2" size={20} /> Challenge Videos
            </h2>
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <video
                src={challengeVideos[currentVideoIndex]}
                controls
                className="w-full h-full object-cover"
              />
              {challengeVideos.length > 1 && (
                <>
                  <button
                    onClick={prevVideo}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    </button>
                  <button
                    onClick={nextVideo}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                  </button>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {challengeVideos.map((_, index) => (
                      <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentVideoIndex ? "bg-white" : "bg-gray-500"
                          }`}
                      ></span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* File attachments */}
        {challengeFiles.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <File className="mr-2" size={20} /> Files
            </h2>
            <div className="flex flex-col space-y-2">
              {challengeFiles.map((file, index) => (
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
      </div>
    </div>
  );
};

export default ChallengeDetailsPage;