'use client'
import Image from 'next/image';
import Link from 'next/link'; // Import Link from next/link
import { FaArrowLeft } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { AiOutlinePlus } from 'react-icons/ai';
import { useState } from 'react'; // Import useState for toggling leaderboard

// Define interfaces for Story and Post objects
export interface Story {
    id: number;
    imageUrl: string;
    profileImageUrl: string;
    username: string;
    timeAgo: string;
}

export interface Post {
    id: number; // It seems you have 'id' twice in your Post interface, likely a mistake. Keeping it for now as per original structure.
    username: string;
    profileImageUrl: string;
    timeAgo: string;
    content: string;
    imageUrl?: string; // Optional imageUrl
}


// Specific Unsplash image URLs
const bannerImageUrl = "https://images.unsplash.com/photo-1742077414023-45a81fd63736?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG90b3MtZmVlZHw2fHx8ZW58MHx8fHx8";
const galleryImageUrls = [
    "https://images.unsplash.com/photo-1742077638802-978320d345bb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG90b3MtZmVlZHw3fHx8ZW58MHx8fHx8",
    "https://images.unsplash.com/photo-1741851373559-6879db14fd8a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG90b3MtZmVlZHwyMHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1742268351444-7e153a9fb747?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwzNnx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1742268351444-7e153a9fb747?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwzNnx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1742268351444-7e153a9fb747?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwzNnx8fGVufDB8fHx8fA%3D%3D",
];


const eventData = {
    name: 'BoomTown Fair',
    category: 'Music and Festival',
    organizer: 'Sujan Pradhan',
    dailyVisits: 1224,
    followers: '42k',
    startDate: '12 Oct',
    description: 'Join us for an unforgettable party festival event! Experience a vibrant celebration filled with live music, delicious food, exciting games, and fantastic entertainment. Dance the night away with friends, enjoy stunning performances, and create memories that will last a lifetime.',
    bannerImage: bannerImageUrl,
};

export const storyData: Story[] = [ // Export and type storyData
    {
        id: 1,
        imageUrl: "https://images.unsplash.com/photo-1742077638802-978320d345bb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHw3fHx8ZW58MHx8fHx8",
        profileImageUrl: 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        username: 'Alex Broker',
        timeAgo: '20m ago',
    },
    {
        id: 2,
        imageUrl: "https://images.unsplash.com/photo-1741851373559-6879db14fd8a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwyMHx8fGVufDB8fHx8fA%3D%3D",
        profileImageUrl: 'https://images.unsplash.com/profile-1683147332811-43a47a8c34aaimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        username: 'Mia K.',
        timeAgo: '35m ago',
    },
    {
        id: 3,
        imageUrl: "https://images.unsplash.com/photo-1742268351444-7e153a9fb747?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwzNnx8fGVufDB8fHx8fA%3D%3D",
        profileImageUrl: 'https://images.unsplash.com/profile-1586467829902-d39ff039084bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        username: 'Jay Dee',
        timeAgo: '1hr ago',
    },
    {
        id: 4,
        imageUrl: "https://images.unsplash.com/photo-1742268351444-7e153a9fb747?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwzNnx8fGVufDB8fHx8fA%3D%3D",
        profileImageUrl: 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        username: 'Anna L.',
        timeAgo: '2hr ago',
    },
    {
        id: 5,
        imageUrl: "https://images.unsplash.com/photo-1742268351444-7e153a9fb747?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC-waG0dG9tcy1mZWVZHwzNnx8fGVufDB8fHx8fA%3D%3D",
        profileImageUrl: 'https://images.unsplash.com/profile-1683147332811-43a47a8c34aaimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        username: 'Ben S.',
        timeAgo: '3hr ago',
    },
];

const leaderboardData = [
    {
        id: 1,
        rank: 1,
        username: 'Chester Wade',
        profileImageUrl: 'https://images.unsplash.com/profile-1586467829902-d39ff039084bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '250 EXP',
    },
    {
        id: 2,
        rank: 2,
        username: 'Daniel Apodaca',
        profileImageUrl: 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '230 EXP',
    },
    {
        id: 3,
        rank: 3,
        username: 'David Lee',
        profileImageUrl: 'https://images.unsplash.com/profile-1683147332811-43a47a8c34aaimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '210 EXP',
    },
    {
        id: 4,
        rank: 4,
        username: 'Emily R.',
        profileImageUrl: 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '203 EXP',
    },
    {
        id: 5,
        rank: 5,
        username: 'Frank G.',
        profileImageUrl: 'https://images.unsplash.com/profile-1683147332811-43a47a8c34aaimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '200 EXP',
    },
    {
        id: 6,
        rank: 6,
        username: 'Grace H.',
        profileImageUrl: 'https://images.unsplash.com/profile-1586467829902-d39ff039084bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '195 EXP',
    },
    {
        id: 7,
        rank: 7,
        username: 'Henry J.',
        profileImageUrl: 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '190 EXP',
    },
    {
        id: 8,
        rank: 8,
        username: 'Ivy K.',
        profileImageUrl: 'https://images.unsplash.com/profile-1683147332811-43a47a8c34aaimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '185 EXP',
    },
    {
        id: 9,
        rank: 9,
        username: 'Jack L.',
        profileImageUrl: 'https://images.unsplash.com/profile-1586467829902-d39ff039084bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        score: '180 EXP',
    },
];

export const postData: Post[] = [ // Export and type postData
    {
        id: 101,
        username: 'Alex Broker',
        profileImageUrl: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2FsbHBhcGVyfGVufDB8fDB8fHww',
        timeAgo: '5m ago',
        content: 'Just arrived at BoomTown Fair! The energy here is amazing. 🎶 #BoomTownFair #MusicFestival',
        imageUrl: "https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2FsbHBhcGVyfGVufDB8fDB8fHww",
    },
    {
        id: 102,
        username: 'Mia K.',
        profileImageUrl: 'https://images.unsplash.com/profile-1683147332811-43a47a8c34aaimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        timeAgo: '15m ago',
        content: 'Sunset vibes at the festival. Who else is here? 🌅 #FestivalSunset #BoomTown',
        imageUrl: "https://images.unsplash.com/photo-1533228768278-d4ff6f2f9964?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZlc3RpdmFsJTIwc2V0fGVufDB8fDB8fDA%3D",
    },
    {
        id: 103,
        username: 'Jay Dee',
        profileImageUrl: 'https://images.unsplash.com/profile-1586467829902-d39ff039084bimage?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32',
        timeAgo: '30m ago',
        content: 'Best food truck ever! You gotta try the tacos near the main stage. 🌮 #FestivalFood #Tacos',
        imageUrl: "https://images.unsplash.com/photo-1559924502-f34d0749ddc5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8ZmVzdGl2YWwlMjBmb29kfGVufDB8fDB8fDA%3D",
    },
];


const galleryImages = galleryImageUrls;

export default function Page() {
    const [showFullLeaderboard, setShowFullLeaderboard] = useState(false); // State for toggling leaderboard

    const displayedLeaderboardData = showFullLeaderboard ? leaderboardData : leaderboardData.slice(0, 3); // Data to display based on toggle

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <div className="container mx-auto px-4 py-2">

                {/* Banner Image - No Card Styling */}
                <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[2.5/1]">
                    <Image
                        src={eventData.bannerImage}
                        alt={eventData.name}
                        fill
                        className=""
                        style={{ }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
                </div>

                {/* Tabs Card */}
                <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex space-x-2 justify-start">
                        <button className="btn btn-sm rounded-full bg-purple-600 text-white hover:bg-purple-700 border-0 font-normal">Tales</button>
                        <button className="btn btn-sm rounded-full text-gray-500 hover:text-gray-700 bg-transparent border-0 font-normal">Stories</button>
                        <button className="btn btn-sm rounded-full text-gray-500 hover:text-gray-700 bg-transparent border-0 font-normal">Leaderboard</button>
                        <button className="btn btn-sm rounded-full text-gray-500 hover:text-gray-700 bg-transparent border-0 font-normal">Members</button>
                    </div>
                </div>

                {/* Event Info Card */}
                <div className="mb-4 p-4 bg-white rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-1 text-gray-800">{eventData.name}</h2>
                    <p className="text-gray-600 text-sm mb-2">{eventData.category}</p>
                    <div className="flex items-center mb-2">
                        <div className="rounded-full mr-2 w-5 h-5 bg-gray-200"></div>
                        <span className="text-sm text-gray-700">{eventData.organizer}</span>
                    </div>
                    <div className="flex space-x-4 mb-3">
                        <div>
                            <p className="text-lg font-semibold text-gray-800">{eventData.dailyVisits}</p>
                            <p className="text-gray-500 text-xs">Daily Visit</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-800">{eventData.followers}</p>
                            <p className="text-gray-500 text-xs">Followers</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-800">{eventData.startDate}</p>
                            <p className="text-gray-500 text-xs">Started on</p>
                        </div>
                    </div>
                    <p className="text-gray-700 text-sm">{eventData.description}</p>
                </div>

                {/* Stories Card with Carousel */}
                <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
                    <h3 className="font-semibold mb-2 text-gray-800 text-lg">Stories
                    <Link href="/add-story" className="text-purple-600 hover:text-purple-700 text-sm flex items-center">
        <AiOutlinePlus className="mr-1" /> Add Story
    </Link></h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-2"> {/* Carousel container */}
                        {storyData.map((story) => (
                            <Link href={`/story/${story.id}`} key={story.id} className="inline-block w-20 md:w-24 mr-3 last:mr-0"> {/* Inline-block for horizontal scroll */}
                                <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100">
                                    {story.imageUrl && <Image
                                        src={story.imageUrl}
                                        alt={`Story by ${story.username}`}
                                        fill
                                        className="object-cover"
                                    />}
                                    <div className="absolute bottom-1 left-1 flex items-center space-x-1">
                                        <div className="avatar avatar-xs">
                                            <div className="rounded-full ring ring-white ring-offset-base-100 ring-offset-2 bg-gray-200">
                                                {story.profileImageUrl && <Image
                                                    src={story.profileImageUrl}
                                                    alt={story.username}
                                                    width={18}
                                                    height={18}
                                                    className="rounded-full"
                                                />}
                                            </div>
                                        </div>
                                        <span className="text-white text-xs">{story.username}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">{story.timeAgo}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Leaderboard Card */}
                <div className="mb-4 bg-white rounded-[20px] shadow-md p-4 border border-gray-100">
                <h3 className="font-semibold mb-20 text-gray-800 text-xl text-center">Leaderboard</h3>
      <div className="relative flex justify-center">
        {displayedLeaderboardData.slice(0, 3).map((leader, index) => (
          <div key={leader.id} className={`absolute flex flex-col items-center ${index === 0 ? 'top-0' : index === 1 ? 'left-[15%] top-[65%]' : 'right-[15%] top-[65%]'} transform -translate-y-1/2`}>
            <div className="relative">
              <div className={`absolute -top-1 -right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.6rem] ${index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-yellow-300 text-gray-700' : 'bg-orange-300 text-gray-700'}`}>{index + 1}</div>
              <div className={`avatar relative shadow-lg rounded-full p-1 ${index === 0 ? 'bg-purple-100 shadow-purple-300' : index === 1 ? 'bg-yellow-100 shadow-yellow-300' : 'bg-orange-100 shadow-orange-300'}`}>
                <div className={`rounded-full ring-0 bg-white ${index === 0 ? 'w-20 h-20' : 'w-14 h-14'}`}>
                  {leader.profileImageUrl && <Image src={leader.profileImageUrl} alt={leader.username} width={index === 0 ? 80 : 56} height={index === 0 ? 80 : 56} className="rounded-full object-cover" />}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="font-medium text-gray-800 text-sm">{leader.username}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[180px] space-y-3">
        {displayedLeaderboardData.slice(3).map((leader) => (
          <div key={leader.id} className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute -top-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center text-[0.6rem] bg-gray-400 text-white">{leader.rank}</div>
                <div className="avatar relative bg-gray-100 shadow-lg rounded-full p-1">
                  <div className="w-12 h-12 rounded-full bg-white">
                    {leader.profileImageUrl && <Image src={leader.profileImageUrl} alt={leader.username} width={48} height={48} className="rounded-full object-cover" />}
                  </div>
                </div>
              </div>
              <div className="ml-10 mr-10">
                <div className="font-medium text-gray-800 text-base">{leader.username}</div>
                <div className="text-xs text-gray-500">Rank {leader.rank}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">{leader.score}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
        className="w-full rounded-full mt-4 bg-purple-600 text-white hover:bg-purple-700 border-0 font-normal text-sm py-2"
      >
        {showFullLeaderboard ? 'Show Top 3' : 'Check all'}
      </button>

</div>

                {/* Posts Section */}
                <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
                    <h3 className="font-semibold mb-3 text-gray-800 text-lg">Posts
                    <Link href="/add-post" className="text-purple-600 hover:text-purple-700 text-sm flex items-center">
        <AiOutlinePlus className="mr-1" /> Add Post
    </Link></h3>
                    <div className="space-y-4">
                        {postData.map((post) => (
                            <Link href={`/post/${post.id}`} key={post.id} className="block">
                                <div className="p-3 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start space-x-2">
                                        <div className="avatar">
                                            <div className="w-8 h-8 rounded-full bg-gray-200">
                                                <Image
                                                    src={post.profileImageUrl}
                                                    alt={post.username}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">{post.username} <span className="font-normal text-gray-500 text-sm">• {post.timeAgo}</span></div>
                                            <p className="text-gray-700 text-sm">{post.content}</p>
                                        </div>
                                    </div>
                                    {post.imageUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden">
                                            <Image
                                                src={post.imageUrl}
                                                alt="Post Image"
                                                width={600}
                                                height={400}
                                                className="w-full aspect-[5/2] object-cover rounded-md"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>


                {/* Gallery Card */}
                <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gallery</h2>
        <a href="#" className="text-blue-500 text-sm">See all</a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <img src={galleryImageUrls[0]} alt="DJ Party" className="rounded-lg object-cover w-full h-40 col-span-2" />
        <img src={galleryImageUrls[1]} alt="Concert Crowd" className="rounded-lg object-cover w-full h-40" />
        <img src={galleryImageUrls[2]} alt="Club Dance" className="rounded-lg object-cover w-full h-40" />
        <img src={galleryImageUrls[3]} alt="Green Light Portrait" className="rounded-lg object-cover w-full h-40" />
        <img src={galleryImageUrls[4]} alt="Street Style" className="rounded-lg object-cover w-full h-40" />
      </div>


            </div>
        </div>
    );
}