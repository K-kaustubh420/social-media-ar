'use client';
import Image from 'next/image';
import Link from 'next/link';
import { AiOutlinePlus } from 'react-icons/ai';
import React from 'react';
import { useState, useEffect } from 'react';

// Define interfaces
interface Story {
    id: string;
    imageUrl: string;
    text: string;
}

interface Post {
    id: string;
    imageUrl: string;
    text: string;
}

interface EventData {
    title: string;
    organizer: string;
    category: string;
    dailyVisits?: number; // Optional, not in API but added for consistency with image
    followers?: string;  // Optional
    startDate?: string;  // Optional
    description: string;
    bannerImage?: string;
    videoUrl?: string;
}

export default function Page({ params: paramsPromise }: { params: Promise<{ challengeId: string }> }) {
    const params = React.use(paramsPromise);
    const [eventData, setEventData] = useState<EventData | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const { challengeId } = params;
                const response = await fetch(`/api/finalpage/${challengeId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch data');
                }

                // Map API response to state
                setEventData({
                    title: data.pageTitle || 'Untitled Event',
                    organizer: data.creatorName || 'Unknown Organizer',
                    category: data.category || 'Uncategorized',
                    description: data.pageDescription || '',
                    bannerImage: data.pageImageUrls?.[0] || '/placeholder.jpg',
                    videoUrl: data.pageVideoUrl,
                });
                setStories(data.stories || []);
                setPosts(data.posts || []);
                setGalleryImages(data.pageImageUrls || []);
                setLoading(false);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        }
        fetchData();
    }, [params]);

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <div className="container mx-auto px-4 py-2">
                {/* Banner Image */}
                <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[2.5/1]">
                    <Image
                        src={eventData?.bannerImage || '/placeholder.jpg'}
                        alt={eventData?.title || 'Event Banner'}
                        fill
                        className="object-cover"
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
                    <h2 className="text-xl font-bold mb-1 text-gray-800">{eventData?.title}</h2>
                    <p className="text-gray-600 text-sm mb-2">{eventData?.category}</p>
                    <div className="flex items-center mb-2">
                        <div className="rounded-full mr-2 w-5 h-5 bg-gray-200"></div>
                        <span className="text-sm text-gray-700">{eventData?.organizer}</span>
                    </div>
                    <div className="flex space-x-4 mb-3">
                        <div>
                            <p className="text-lg font-semibold text-gray-800">1224</p> {/* Placeholder, not in API */}
                            <p className="text-gray-500 text-xs">Daily Visit</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-800">42k</p> {/* Placeholder, not in API */}
                            <p className="text-gray-500 text-xs">Followers</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-800">12 Oct</p> {/* Placeholder, not in API */}
                            <p className="text-gray-500 text-xs">Started on</p>
                        </div>
                    </div>
                    <p className="text-gray-700 text-sm">{eventData?.description}</p>
                </div>

                {/* Stories Card */}
                <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
                    <h3 className="font-semibold mb-2 text-gray-800 text-lg">
                        Stories
                        <Link href="/add-story" className="text-purple-600 hover:text-purple-700 text-sm flex items-center ml-2">
                            <AiOutlinePlus className="mr-1" /> Add Story
                        </Link>
                    </h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-2">
                        {stories.map((story) => (
                            <Link href={`/story/${story.id}`} key={story.id} className="inline-block w-20 md:w-24 mr-3 last:mr-0">
                                <div className="relative rounded-full overflow-hidden aspect-square bg-gray-100">
                                    {story.imageUrl && <Image src={story.imageUrl} alt={`Story by ${story.text}`} fill className="object-cover" />}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center truncate">{story.text}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Posts Section */}
                <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
                    <h3 className="font-semibold mb-3 text-gray-800 text-lg">
                        Posts
                        <Link href="/add-post" className="text-purple-600 hover:text-purple-700 text-sm flex items-center ml-2">
                            <AiOutlinePlus className="mr-1" /> Add Post
                        </Link>
                    </h3>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <Link href={`/post/${post.id}`} key={post.id} className="block">
                                <div className="p-3 rounded-lg hover:bg-gray-50">
                                    <p className="text-gray-700 text-sm">{post.text}</p>
                                    {post.imageUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden">
                                            <Image src={post.imageUrl} alt="Post Image" width={600} height={400} className="w-full aspect-[5/2] object-cover rounded-md" />
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
                    {galleryImages.slice(0, 5).map((url, index) => (
                        <img key={index} src={url} alt={`Gallery Image ${index + 1}`} className="rounded-lg object-cover w-full h-40" />
                    ))}
                </div>
            </div>
        </div>
    );
}