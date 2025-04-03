// app/post/[id].tsx
'use client'
import { postData, Post } from '../../finalpage/page';
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Import useParams hook

interface PostDetailPageProps {
    params: { id: string }; // Explicitly define params type here as well for extra safety
}

const PostDetailPage: React.FC = () => { // Simpler React.FC, useParams handles props now
    const params = useParams<PostDetailPageProps['params']>(); // Use useParams hook to get params
    const postId = params?.id ? parseInt(params.id) : NaN; // Safe access and handle potential undefined

    const post = postData.find((p: Post) => p.id === postId);

    if (!post) {
        return <div>Post not found</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <div className="container mx-auto px-4 py-8">
                <Link href="/finalpage" className="inline-flex items-center mb-4 text-purple-600 hover:text-purple-700">
                    <FaArrowLeft className="mr-2" /> Back to Event
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-start space-x-2 mb-4">
                        <div className="avatar">
                            <div className="w-10 h-10 rounded-full bg-gray-200">
                                <Image
                                    src={post.profileImageUrl}
                                    alt={post.username}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold text-gray-800">{post.username} <span className="font-normal text-gray-500 text-sm">• {post.timeAgo}</span></div>
                        </div>
                    </div>
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    {post.imageUrl && (
                        <div className="rounded-lg overflow-hidden">
                            <Image
                                src={post.imageUrl}
                                alt="Post Image"
                                width={800}
                                height={600}
                                className="w-full aspect-[4/3] object-cover rounded-md"
                            />
                        </div>
                    )}

                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Comments</h4>
                        <p className="text-gray-500">Comments section will be implemented here in the future.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;