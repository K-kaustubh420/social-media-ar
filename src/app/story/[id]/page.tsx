// app/story/[id].tsx
'use client'
import { storyData, Story } from '../../finalpage/page';
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Import useParams hook

interface StoryDetailPageProps {
    params: { id: string }; // Explicitly define params type here as well for extra safety
}

const StoryDetailPage: React.FC = () => { // Simpler React.FC, useParams handles props now
    const params = useParams<StoryDetailPageProps['params']>(); // Use useParams hook to get params
    const storyId = params?.id ? parseInt(params.id) : NaN; // Safe access and handle potential undefined

    const story = storyData.find((s: Story) => s.id === storyId);

    if (!story) {
        return <div>Story not found</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <div className="container mx-auto px-4 py-8">
                <Link href="/finalpage" className="inline-flex items-center mb-4 text-purple-600 hover:text-purple-700">
                    <FaArrowLeft className="mr-2" /> Back to Event
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="relative rounded-2xl overflow-hidden aspect-video mb-4">
                        {story.imageUrl && <Image src={story.imageUrl} alt={`Story by ${story.username}`} fill className="object-cover" />}
                    </div>
                    <div className="flex items-center mb-2">
                        <div className="avatar avatar-sm mr-2">
                            <div className="rounded-full ring ring-white ring-offset-base-100 ring-offset-2 bg-gray-200">
                                {story.profileImageUrl && <Image src={story.profileImageUrl} alt={story.username} width={36} height={36} className="rounded-full" />}
                            </div>
                        </div>
                        <div className="font-semibold text-gray-800">{story.username}</div>
                        <span className="text-gray-500 ml-2">• {story.timeAgo}</span>
                    </div>
                    <p className="text-gray-700">
                        This is the full story content. Imagine detailed text and more information related to the story.
                    </p>

                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Comments</h4>
                        <p className="text-gray-500">Comments section will be implemented here in the future.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryDetailPage;