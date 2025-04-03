// components/ReelsGrid.tsx
"use client"
import Image from 'next/image';
import { useState } from 'react';

interface Reel {
  id: number;
  thumbnail: string;
  videoUrl: string;
  caption: string;
  views: string;
  likes?: string;
  comments?: string;
  timestamp?: string;
  user?: {
    username: string;
    profilePic: string;
  };
}

interface ReelsGridProps {
  reels: Reel[];
}

const ReelsGrid: React.FC<ReelsGridProps> = ({ reels }) => {
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  const openModal = (reel: Reel) => {
    setSelectedReel(reel);
  };

  const closeModal = () => {
    setSelectedReel(null);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {reels.map((reel) => (
          <div key={reel.id} className="relative aspect-w-1 aspect-h-1 cursor-pointer" onClick={() => openModal(reel)}>
            <Image
              src={reel.thumbnail}
              alt={`Reel ${reel.id}`}
              layout="fill"
              objectFit="cover"
              className=""
            />
            {/*  Overlay for caption and play button  */}
            <div className="absolute inset-0 flex items-end p-1 bg-black bg-opacity-50 w-50 h-96 rounded-lg">
              <span className="text-white text-xs line-clamp-2">{reel.caption}</span>
            </div>
            {/* Views Count */}
            <div className="absolute top-1 right-1 flex items-center text-white text-xs bg-black bg-opacity-50 rounded-full px-2 py-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{reel.views}</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              {/* Play icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

       {/* Modal (for larger view on desktop) */}
       {selectedReel && (
        <div className={`fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center ${selectedReel ? '' : 'hidden'} md:hidden`}>
           <button
            className="absolute top-4 right-4 text-white text-2xl z-50"
            onClick={closeModal}
            aria-label="Close"
          >
            × {/* Use a simple 'x' for close */}
          </button>

           {/* Mobile view: Show reel details directly, without a modal */}
           <div className="bg-black text-white w-full max-w-md p-4">
           <video controls className="w-full aspect-video">
              <source src={selectedReel.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
           </video>
           <div className="mt-2">
                <p className="text-lg font-semibold">{selectedReel.caption}</p>
                <p className="text-gray-400">Views: {selectedReel.views}</p>
                {/* Add more details as needed */}
                {selectedReel.likes && <p className="text-gray-400">Likes: {selectedReel.likes}</p>}
                {selectedReel.comments && <p className="text-gray-400">Comments: {selectedReel.comments}</p>}
                {selectedReel.timestamp && <p className="text-gray-400">Posted: {selectedReel.timestamp}</p>}  {/* Display timestamp */}
                {selectedReel.user && (  //Display User
                    <div className='flex items-center mt-2'>
                       <Image src={selectedReel.user.profilePic} alt='User Profile Picture' width={24} height={24} className='rounded-full mr-2'/>
                       <p>{selectedReel.user.username}</p>
                    </div>
                )}
            </div>

        </div>
        </div>
      )}

      {selectedReel && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 items-center justify-center hidden md:flex">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white text-2xl z-50"
            onClick={closeModal}
            aria-label="Close"
          >
            × {/* Use a simple 'x' for close */}
          </button>

          {/* Modal Content */}
          <div className="bg-black text-white flex max-w-4xl w-full h-full max-h-[90vh] rounded-lg overflow-hidden">
            {/* Video Section (Left) */}
            <div className="w-2/3 h-full flex items-center justify-center">
              <video controls autoPlay className="w-full h-full object-contain">
                <source src={selectedReel.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Details Section (Right) */}
            <div className="w-1/3 h-full p-4 overflow-y-auto">
              {selectedReel.user && (
                <div className="flex items-center mb-4">
                  <Image
                    src={selectedReel.user.profilePic}
                    alt={`User ${selectedReel.user.username}`}
                    width={40}
                    height={40}
                    className="rounded-full mr-2"
                  />
                  <h3 className="text-lg font-semibold">{selectedReel.user.username}</h3>
                </div>
              )}
              <p className="mb-2">{selectedReel.caption}</p>
              <div className="text-gray-400 text-sm">
                <p>Views: {selectedReel.views}</p>
                {selectedReel.likes && <p>Likes: {selectedReel.likes}</p>}
                {selectedReel.comments && <p>Comments: {selectedReel.comments}</p>}
                {selectedReel.timestamp && <p>Posted: {selectedReel.timestamp}</p>}
              </div>
              {/* Add comments section, like button, etc. here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReelsGrid;