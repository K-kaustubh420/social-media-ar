'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Corrected import
import { auth, db } from '@/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

// Define types for data structures
interface ChallengeData {
  id: string;
  category: string;
  creatorAvatarUrl: string;
  creatorName: string;
  description: string;
  imageUrls: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string | null;
  title: string;
  videoUrl?: string;
}

interface Story {
  id: number;
  imageUrl: string;
  profileImageUrl: string;
  username: string;
  timeAgo: string;
  userId: string;
  createdAt: string;
}

interface Post {
  id: number;
  username: string;
  profileImageUrl: string;
  timeAgo: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
}

interface LeaderboardEntry {
  id: number;
  rank: number;
  username: string;
  profileImageUrl: string;
  score: string;
}

interface FinalPageData {
  stories: Story[];
  posts: Post[];
  leaderboard: LeaderboardEntry[];
  galleryImages: string[];
  dailyVisits: number;
  followers: string;
  startDate: string;
}

export default function FinalPage() {
  const params = useParams();
  const challengeId = params?.challengeId as string;  //Use optional chaining in case params is undefined

  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [finalPageData, setFinalPageData] = useState<FinalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); //Add error message state

  useEffect(() => {
    if (!challengeId) {
        // challengeId is still undefined/null, exit useEffect
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      setErrorMessage(null); //Clear any previous errors

      try {
        const user = auth.currentUser;
        if (!user) {
          setIsAuthorized(false);
          return;
        }

        const isUserAuthorized = await verifyUserChallengeCompletion(user.uid, challengeId);
        setIsAuthorized(isUserAuthorized);

        if (!isUserAuthorized) {
          return; // Stop if not authorized
        }

        // Fetch challenge and final page data in parallel
        const [challenge, finalPage] = await Promise.all([
          fetchChallengeData(challengeId),
          fetchFinalPageData(challengeId),
        ]);

        if (challenge) {
          setChallengeData(challenge);

          // Initialize finalPageData if it doesn't exist, including challenge data
          if (!finalPage) {
            const defaultFinalPageData: FinalPageData = {
              stories: [],
              posts: [],
              leaderboard: [],
              galleryImages: challenge.imageUrls || [],
              dailyVisits: 0, // Initial values
              followers: '0',
              startDate: new Date(challenge.timestamp || '').toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
              }),
            };
            await createFinalPageData(challengeId, defaultFinalPageData);
            setFinalPageData(defaultFinalPageData);
          } else {
            setFinalPageData(finalPage);
          }
        } else {
            console.error('Challenge not found.');
            setErrorMessage("Challenge not found. Please check the URL."); //Set error message
        }
      } catch (error: any) { //Ensure the error is typed
        console.error('Error fetching data:', error);
        setErrorMessage("Failed to load data. Please try again later.");  //Set error message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [challengeId]);

  const verifyUserChallengeCompletion = async (userId: string, challengeId: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'userChallenges'),
        where('userId', '==', userId),
        where('challengeId', '==', challengeId),
        where('challengeStatus', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error: any) {
      console.error("Error verifying challenge completion:", error);
      setErrorMessage("Error verifying challenge completion. Please try again.");
      return false;  //Return false if an error occurs
    }
  };

  const fetchChallengeData = async (challengeId: string): Promise<ChallengeData | null> => {
    try {
      const challengeDocRef = doc(db, 'challenges', challengeId);
      const challengeDocSnap = await getDoc(challengeDocRef);

      if (challengeDocSnap.exists()) {
        return { id: challengeDocSnap.id, ...challengeDocSnap.data() } as ChallengeData;
      } else {
        console.error('Challenge not found');
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching challenge data:', error);
      setErrorMessage("Error fetching challenge data. Please check your connection and try again.");
      return null;
    }
  };

  const fetchFinalPageData = async (challengeId: string): Promise<FinalPageData | null> => {
    try {
      const finalPageDocRef = doc(db, 'finalPageData', challengeId);
      const finalPageDocSnap = await getDoc(finalPageDocRef);

      if (finalPageDocSnap.exists()) {
        return finalPageDocSnap.data() as FinalPageData;
      } else {
        return null; // Return null if no data exists
      }
    } catch (error: any) {
      console.error('Error fetching final page data:', error);
      setErrorMessage("Error fetching final page data. Please try again later.");
      return null;
    }
  };

  const createFinalPageData = async (challengeId: string, data: FinalPageData): Promise<void> => {
    try {
      const finalPageDocRef = doc(db, 'finalPageData', challengeId);
      await setDoc(finalPageDocRef, data);
    } catch (error: any) {
      console.error('Error creating final page data:', error);
      setErrorMessage("Error creating final page data. Please try again later.");
    }
  };

  // Functions to update finalPageData on Firestore
  const updateFinalPageData = async (challengeId: string, updates: Partial<FinalPageData>): Promise<void> => {
    try {
      const finalPageDocRef = doc(db, 'finalPageData', challengeId);
      await setDoc(finalPageDocRef, updates, { merge: true }); // Merge updates with existing data
      setFinalPageData((prevData) => ({ ...prevData, ...updates }) as FinalPageData);
    } catch (error: any) {
      console.error('Error updating final page data:', error);
      setErrorMessage("Error updating data. Please check your connection and try again.");
    }
  };

  const addStory = async (story: Omit<Story, 'id' | 'userId' | 'createdAt'>) => {
    if (!challengeId || !auth.currentUser) return;
    const newStory: Story = { id: Date.now(), ...story, userId: auth.currentUser.uid, createdAt: new Date().toISOString() };
    await updateFinalPageData(challengeId, { stories: [...(finalPageData?.stories || []), newStory] });
  };

  const addPost = async (post: Omit<Post, 'id' | 'userId' | 'createdAt'>) => {
    if (!challengeId || !auth.currentUser) return;
    const newPost: Post = { id: Date.now(), ...post, userId: auth.currentUser.uid, createdAt: new Date().toISOString() };
    await updateFinalPageData(challengeId, { posts: [...(finalPageData?.posts || []), newPost] });
  };

  // Example functions for admin panel functionality (adjust as needed)
  const updateLeaderboard = async (leaderboardData: LeaderboardEntry[]) => {
    if (!challengeId) return;
    await updateFinalPageData(challengeId, { leaderboard: leaderboardData });
  };

  const updateGalleryImages = async (images: string[]) => {
    if (!challengeId) return;
    await updateFinalPageData(challengeId, { galleryImages: images });
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!isAuthorized) return <div className="flex justify-center items-center min-h-screen text-red-500">You are not authorized to view this page.</div>;
  if (!challengeData) return <div className="flex justify-center items-center min-h-screen">Challenge not found.</div>;
    if (errorMessage) return <div className="flex justify-center items-center min-h-screen text-red-500">{errorMessage}</div>;

  // Map challenge data to eventData structure
  const eventData = {
    name: challengeData.title,
    category: challengeData.category,
    organizer: challengeData.creatorName,
    dailyVisits: finalPageData?.dailyVisits || 0,
    followers: finalPageData?.followers || '0',
    startDate: finalPageData?.startDate || '',
    description: challengeData.description,
    bannerImage: challengeData.imageUrls[0] || 'https://via.placeholder.com/600x240',
  };

  const stories = finalPageData?.stories || [];
  const posts = finalPageData?.posts || [];
  const leaderboard = finalPageData?.leaderboard || [];

  const galleryImages = finalPageData?.galleryImages || [];
  const displayedLeaderboardData = showFullLeaderboard ? leaderboard : leaderboard.slice(0, 3);

  // Handle adding a sample story or post (for testing)
  const handleAddStory = () => {
    if (!auth.currentUser) return;
    const newStory = {
      imageUrl: 'https://images.unsplash.com/photo-1742077638802-978320d345bb?...',
      profileImageUrl: auth.currentUser.photoURL || 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?...',
      username: auth.currentUser.displayName || 'User',
      timeAgo: 'Just now',
    };
    addStory(newStory);
  };

  const handleAddPost = () => {
    if (!auth.currentUser) return;
    const newPost = {
      username: auth.currentUser.displayName || 'User',
      profileImageUrl: auth.currentUser.photoURL || 'https://images.unsplash.com/profile-1678845241942-9b483a622d2bimage?...',
      timeAgo: 'Just now',
      content: 'This is a new post!',
      imageUrl: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?...',
    };
    addPost(newPost);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      <div className="container mx-auto px-4 py-2">
        {/* Banner Image */}
        <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[2.5/1]">
          <Image src={eventData.bannerImage} alt={eventData.name} fill className="object-cover" />
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
            <div className="rounded-full mr-2 w-5 h-5 bg-gray-200">
              {challengeData?.creatorAvatarUrl && (
                <Image src={challengeData.creatorAvatarUrl} alt={eventData.organizer} width={20} height={20} className="rounded-full object-cover" />
              )}
            </div>
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
          <h3 className="font-semibold mb-2 text-gray-800 text-lg flex justify-between items-center">
            Stories
            <button onClick={handleAddStory} className="text-purple-600 hover:text-purple-700 text-sm flex items-center">
              <AiOutlinePlus className="mr-1" /> Add Story
            </button>
          </h3>
          <div className="overflow-x-auto whitespace-nowrap pb-2">
            {stories.map((story) => (
              <Link href={`/story/${story.id}`} key={story.id} className="inline-block w-20 md:w-24 mr-3 last:mr-0">
                <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100">
                  {story.imageUrl && (
                    <Image src={story.imageUrl} alt={`Story by ${story.username}`} fill className="object-cover" />
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center space-x-1">
                    <div className="avatar avatar-xs">
                      <div className="rounded-full ring ring-white ring-offset-base-100 ring-offset-2 bg-gray-200">
                        {story.profileImageUrl && (
                          <Image src={story.profileImageUrl} alt={story.username} width={18} height={18} className="rounded-full" />
                        )}
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
              <div
                key={leader.id}
                className={`absolute flex flex-col items-center ${
                  index === 0 ? 'top-0' : index === 1 ? 'left-[15%] top-[65%]' : 'right-[15%] top-[65%]'
                } transform -translate-y-1/2`}
              >
                <div className="relative">
                  <div
                    className={`absolute -top-1 -right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.6rem] ${
                      index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-yellow-300 text-gray-700' : 'bg-orange-300 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`avatar relative shadow-lg rounded-full p-1 ${
                      index === 0
                        ? 'bg-purple-100 shadow-purple-300'
                        : index === 1
                        ? 'bg-yellow-100 shadow-yellow-300'
                        : 'bg-orange-100 shadow-orange-300'
                    }`}
                  >
                    <div className={`rounded-full ring-0 bg-white ${index === 0 ? 'w-20 h-20' : 'w-14 h-14'}`}>
                      {leader.profileImageUrl && (
                        <Image
                          src={leader.profileImageUrl}
                          alt={leader.username}
                          width={index === 0 ? 80 : 56}
                          height={index === 0 ? 80 : 56}
                          className="rounded-full object-cover"
                        />
                      )}
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
                    <div className="absolute -top-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center text-[0.6rem] bg-gray-400 text-white">
                      {leader.rank}
                    </div>
                    <div className="avatar relative bg-gray-100 shadow-lg rounded-full p-1">
                      <div className="w-12 h-12 rounded-full bg-white">
                        {leader.profileImageUrl && (
                          <Image
                            src={leader.profileImageUrl}
                            alt={leader.username}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        )}
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
          <h3 className="font-semibold mb-3 text-gray-800 text-lg flex justify-between items-center">
            Posts
            <button onClick={handleAddPost} className="text-purple-600 hover:text-purple-700 text-sm flex items-center">
              <AiOutlinePlus className="mr-1" /> Add Post
            </button>
          </h3>
          <div className="space-y-4">
            {posts.map((post) => (
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
                      <div className="font-semibold text-gray-800">
                        {post.username} <span className="font-normal text-gray-500 text-sm">• {post.timeAgo}</span>
                      </div>
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
          {galleryImages.map((imageUrl, index) => (
            <Image
              key={index}
              src={imageUrl}
              alt={`Gallery Image ${index + 1}`}
              className="rounded-lg object-cover w-full h-40"
              width={500}
              height={300}
            />
          ))}
        </div>
      </div>
    </div>
  );
}