'use client'
import React, { useState, useEffect } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    getFirestore,
    getDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import {
    FaHeading,
    FaParagraph,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaLink,
    FaImage,
    FaVideo,
    FaTrashAlt,
} from 'react-icons/fa';

interface Challenge {
    id: string;
    category: string;
    creatorAvatarUrl: string;
    creatorId: string;
    creatorName: string;
    description: string;
    expiryDate: string;
    imageUrls: string[];
    location: string;
    timestamp: number;
    title: string;
    videoUrl: string;
}

interface Post {
    text: string;
    imageUrl: string;
    id: string;
}

interface Story {
    text: string;
    imageUrl: string;
    id: string;
}

interface FinalPageData {
    id: string;
    challengeId: string;
    category: string;
    creatorAvatarUrl: string;
    creatorId: string;
    creatorName: string;
    pageDescription: string;
    pageExpiryDate: string;
    pageImageUrls: string[];
    pageLocation: string;
    pageTimestamp: number;
    pageTitle: string;
    pageVideoUrl: string;
    posts: Post[];
    stories: Story[];
}

const useMockAuth = () => {
    const mockUser = { uid: 'kjafJ0pUp3byMrveRE1kYAyJ4Je2', email: 'neupanekiran23@gmail.com', displayName: 'Nupane Kiran' };
    return { authUser: mockUser, loading: false };
};

const AdminPanel: React.FC = () => {
    const { authUser, loading: authLoading } = useMockAuth();
    const [createdChallenges, setCreatedChallenges] = useState<Challenge[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [finalPageData, setFinalPageData] = useState<FinalPageData>({
        id: '',
        challengeId: '',
        category: '',
        creatorAvatarUrl: '',
        creatorId: '',
        creatorName: '',
        pageDescription: '',
        pageExpiryDate: '',
        pageImageUrls: [],
        pageLocation: '',
        pageTimestamp: Date.now(),
        pageTitle: '',
        pageVideoUrl: '',
        posts: [],
        stories: [],
    });

    // State variables for form fields
    const [pageTitle, setPageTitle] = useState('');
    const [pageDescription, setPageDescription] = useState('');
    const [pageLocation, setPageLocation] = useState('');
    const [pageExpiryDate, setPageExpiryDate] = useState('');
    const [pageVideoUrl, setPageVideoUrl] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState('');
    const [newPostText, setNewPostText] = useState('');
    const [newPostImageUrl, setNewPostImageUrl] = useState('');
    const [newStoryText, setNewStoryText] = useState('');
    const [newStoryImageUrl, setNewStoryImageUrl] = useState('');

    const backgroundImages = [
        'https://images.unsplash.com/photo-1521336575822-6da63fb45455?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://preview.redd.it/im5rk5an7x631.png?width=1080&crop=smart&auto=webp&s=a503679b6b360c17b45ac6d86e119cf56e160007',
    ];

    useEffect(() => {
        setBackgroundImage(backgroundImages[Math.floor(Math.random() * backgroundImages.length)]);
    }, []);

    useEffect(() => {
        if (authUser && !authLoading) {
            fetchCreatedChallenges();
        }
    }, [authUser, authLoading]);

    const fetchCreatedChallenges = async () => {
        try {
            const challengesCollection = collection(db, 'challenges');
            const q = query(challengesCollection, where('creatorId', '==', authUser.uid));
            const querySnapshot = await getDocs(q);
            const challenges: Challenge[] = [];
            querySnapshot.forEach((doc) => {
                challenges.push({ id: doc.id, ...doc.data() } as Challenge);
            });
            setCreatedChallenges(challenges);
        } catch (error) {
            console.error('Error fetching challenges:', error);
        }
    };

    const handleChallengeSelect = async (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        const finalPageDocRef = doc(db, 'finalpages', `${challenge.id}-final`);
        const finalPageDoc = await getDoc(finalPageDocRef);

        const initialFinalPageData: FinalPageData = {
            id: '',
            challengeId: challenge.id,
            category: challenge.category,
            creatorAvatarUrl: challenge.creatorAvatarUrl,
            creatorId: challenge.creatorId,
            creatorName: challenge.creatorName,
            pageDescription: '',
            pageExpiryDate: '',
            pageImageUrls: [],
            pageLocation: '',
            pageTimestamp: Date.now(),
            pageTitle: '',
            pageVideoUrl: '',
            posts: [],
            stories: [],
        };

        if (finalPageDoc.exists()) {
            const data = finalPageDoc.data() as FinalPageData;

            // Update the state variables
            setPageTitle(data.pageTitle || '');
            setPageDescription(data.pageDescription || '');
            setPageLocation(data.pageLocation || '');
            setPageExpiryDate(data.pageExpiryDate || '');
            setPageVideoUrl(data.pageVideoUrl || '');

            setFinalPageData({ ...initialFinalPageData, ...data, id: finalPageDoc.id, challengeId: challenge.id });
            setIsManaging(true);
        } else {
            // Reset state variables when creating a new final page.

            setPageTitle('');
            setPageDescription('');
            setPageLocation('');
            setPageExpiryDate('');
            setPageVideoUrl('');

            setFinalPageData(initialFinalPageData);
            setIsManaging(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        switch (name) {
            case 'pageTitle':
                setPageTitle(value);
                break;
            case 'pageDescription':
                setPageDescription(value);
                break;
            case 'pageLocation':
                setPageLocation(value);
                break;
            case 'pageExpiryDate':
                setPageExpiryDate(value);
                break;
            case 'pageVideoUrl':
                setPageVideoUrl(value);
                break;
            default:
                break;
        }

        setFinalPageData(prevData => ({ ...prevData, [name]: value })); // Update FinalPageData as well
    };

    const handleAddImageUrl = () => {
        if (newImageUrl.trim() !== '') {
            setFinalPageData(prevData => ({
                ...prevData,
                pageImageUrls: [...prevData.pageImageUrls, newImageUrl.trim()],
            }));
            setNewImageUrl('');
        }
    };

    const handleRemoveImageUrl = (index: number) => {
        setFinalPageData(prevData => {
            const updatedImageUrls = [...prevData.pageImageUrls];
            updatedImageUrls.splice(index, 1);
            return { ...prevData, pageImageUrls: updatedImageUrls };
        });
    };

    const handleAddPost = () => {
        if (newPostText.trim() !== '' && newPostImageUrl.trim() !== '') {
            const newPost: Post = {
                text: newPostText,
                imageUrl: newPostImageUrl,
                id: Date.now().toString(),
            };

            setFinalPageData(prevData => ({
                ...prevData,
                posts: [...prevData.posts, newPost],
            }));

            setNewPostText('');
            setNewPostImageUrl('');
        }
    };

    const handleRemovePost = (id: string) => {
        setFinalPageData(prevData => ({
            ...prevData,
            posts: prevData.posts.filter(post => post.id !== id),
        }));
    };

    const handleAddStory = () => {
        if (newStoryText.trim() !== '' && newStoryImageUrl.trim() !== '') {
            const newStory: Story = {
                text: newStoryText,
                imageUrl: newStoryImageUrl,
                id: Date.now().toString(),
            };

            setFinalPageData(prevData => ({
                ...prevData,
                stories: [...prevData.stories, newStory],
            }));

            setNewStoryText('');
            setNewStoryImageUrl('');
        }
    };

    const handleRemoveStory = (id: string) => {
        setFinalPageData(prevData => ({
            ...prevData,
            stories: prevData.stories.filter(story => story.id !== id),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const finalPageDataToSave: FinalPageData = {
                ...finalPageData,
                id: `${finalPageData.challengeId}-final`,
                challengeId: finalPageData.challengeId,
                pageTimestamp: Date.now(),
                pageTitle: pageTitle,   // Use state variable
                pageDescription: pageDescription, // Use state variable
                pageLocation: pageLocation, // Use state variable
                pageExpiryDate: pageExpiryDate, // Use state variable
                pageVideoUrl: pageVideoUrl,   // Use state variable
            };

            const finalPageDocRef = doc(db, 'finalpages', finalPageDataToSave.id);
            await setDoc(finalPageDocRef, finalPageDataToSave, { merge: true });

            alert(`Final Page ${isManaging ? 'Updated' : 'Created'} Successfully!`);

            // Clear the state variables.
            setPageTitle('');
            setPageDescription('');
            setPageLocation('');
            setPageExpiryDate('');
            setPageVideoUrl('');
            setNewImageUrl('');

            setFinalPageData({
                id: '',
                challengeId: '',
                category: '',
                creatorAvatarUrl: '',
                creatorId: '',
                creatorName: '',
                pageDescription: '',
                pageExpiryDate: '',
                pageImageUrls: [],
                pageLocation: '',
                pageTimestamp: Date.now(),
                pageTitle: '',
                pageVideoUrl: '',
                posts: [],
                stories: [],
            });
            setSelectedChallenge(null);
            setIsManaging(false);
            fetchCreatedChallenges();
        } catch (error) {
            console.error('Error creating/updating final page:', error);
            alert(`Failed to ${isManaging ? 'update' : 'create'} final page.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFinalPage = async () => {
        if (!selectedChallenge) {
            alert("Please select a challenge first.");
            return;
        }

        const finalPageId = `${selectedChallenge.id}-final`;
        if (!window.confirm(`Are you sure you want to delete the final page for challenge "${selectedChallenge.title}"?`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const finalPageDocRef = doc(db, 'finalpages', finalPageId);
            await deleteDoc(finalPageDocRef);

            alert("Final Page Deleted Successfully!");

             // Clear the state variables.
             setPageTitle('');
             setPageDescription('');
             setPageLocation('');
             setPageExpiryDate('');
             setPageVideoUrl('');
             setNewImageUrl('');

            setFinalPageData({
                id: '',
                challengeId: '',
                category: '',
                creatorAvatarUrl: '',
                creatorId: '',
                creatorName: '',
                pageDescription: '',
                pageExpiryDate: '',
                pageImageUrls: [],
                pageLocation: '',
                pageTimestamp: Date.now(),
                pageTitle: '',
                pageVideoUrl: '',
                posts: [],
                stories: [],
            });
            setSelectedChallenge(null);
            setIsManaging(false);
            fetchCreatedChallenges();
        } catch (error) {
            console.error("Error deleting final page:", error);
            alert("Failed to delete final page.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const FinalPagePreview = ({ finalPageData }: { finalPageData: FinalPageData }) => {
        return (
            <div className="bg-white p-4 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Page Preview</h3>
                <div className="space-y-4">
                    {/* Title */}
                    <div className="border-b pb-2">
                        <h4 className="text-sm font-medium text-gray-700">Title:</h4>
                        <p className="text-gray-900 font-semibold">{finalPageData.pageTitle || 'No title'}</p>
                    </div>

                    {/* Description */}
                    <div className="border-b pb-2">
                        <h4 className="text-sm font-medium text-gray-700">Description:</h4>
                        <p className="text-gray-800">{finalPageData.pageDescription || 'No description'}</p>
                    </div>

                    {/* Images */}
                    <div className="border-b pb-2">
                        <h4 className="text-sm font-medium text-gray-700">Images:</h4>
                        {finalPageData.pageImageUrls.length > 0 ? (
                            <div className="flex space-x-3 overflow-x-auto">
                                {finalPageData.pageImageUrls.map((url, index) => (
                                    <img key={index} src={url} alt={`Image ${index + 1}`} className="w-24 h-24 object-cover rounded-md shadow-sm border border-gray-200" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-700">No images</p>
                        )}
                    </div>

                    {/* Video */}
                    <div className="border-b pb-2">
                        <h4 className="text-sm font-medium text-gray-700">Video:</h4>
                        {finalPageData.pageVideoUrl ? (
                            <video src={finalPageData.pageVideoUrl} controls className="w-full rounded-md shadow-sm" />
                        ) : (
                            <p className="text-gray-700">No video</p>
                        )}
                    </div>

                    {/* Posts */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700">Posts:</h4>
                        {finalPageData.posts.length > 0 ? (
                            <div className="space-y-3">
                                {finalPageData.posts.map((post) => (
                                    <div key={post.id} className="p-3 rounded-lg shadow-md bg-gray-100">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                                {finalPageData.creatorName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{finalPageData.creatorName}</p>
                                                <p className="text-xs text-gray-500">5m ago</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-700">{post.text}</p>
                                        {post.imageUrl && (
                                            <img src={post.imageUrl} alt="Post Image" className="mt-3 rounded-md shadow-sm w-full object-cover" style={{ maxHeight: '300px' }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-700">No posts</p>
                        )}
                    </div>

                    {/* Stories */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700">Stories:</h4>
                        {finalPageData.stories.length > 0 ? (
                            <div className="flex space-x-3 overflow-x-auto">
                                {finalPageData.stories.map((story) => (
                                    <div key={story.id} className="relative w-40 h-64 rounded-lg shadow-md overflow-hidden">
                                        <img src={story.imageUrl} alt="Story Image" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-2 text-white">
                                            <p className="text-sm">{story.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-700">No stories</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-screen text-gray-700">Loading...</div>;
    }

    return (
        <div
            className="min-h-screen py-6 flex flex-col justify-center sm:py-12 relative text-gray-700" // Added text-gray-700 here
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed', // Make the background fixed
            }}
        >
            <div className="relative py-3 sm:mx-auto lg:max-w-5xl xl:max-w-6xl lg:mx-auto w-full px-4"> {/* Added w-full for mobile */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="relative bg-white shadow-lg sm:rounded-3xl px-4 py-8 sm:p-8 lg:p-12">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 mt-2">Manage your final pages easily.</p>
                    </div>

                    {authUser ? (
                        <div className="grid gap-4 lg:grid-cols-1 xl:grid-cols-2">
                            {/* Challenge List */}
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Challenges</h2>
                                {createdChallenges.length > 0 ? (
                                    <div className="space-y-2">
                                        {createdChallenges.map((challenge) => (
                                            <button
                                                key={challenge.id}
                                                className={`w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${selectedChallenge?.id === challenge.id ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`}
                                                onClick={() => handleChallengeSelect(challenge)}
                                            >
                                                {challenge.title}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-700">No challenges created yet.</p>
                                )}
                            </div>

                            {/* Final Page Form / Management */}
                            {selectedChallenge && (
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                                        {isManaging ? `Manage Final Page` : `Create Final Page`}
                                    </h2>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Core Page Details */}
                                        <div className="mb-4">
                                            <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700">Page Title:</label>
                                            <input
                                                type="text"
                                                id="pageTitle"
                                                name="pageTitle"
                                                value={pageTitle}
                                                onChange={handleInputChange}
                                                placeholder="Enter page title"
                                                className="input input-warning w-full bg-white"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="pageDescription" className="block text-sm font-medium text-gray-700">Page Description:</label>
                                            <textarea
                                                id="pageDescription"
                                                name="pageDescription"
                                                value={pageDescription}
                                                onChange={handleInputChange}
                                                rows={3}
                                                placeholder="Describe your final page"
                                                className="textarea textarea-warning w-full bg-white"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="pageLocation" className="block text-sm font-medium text-gray-700">Page Location:</label>
                                            <input
                                                type="text"
                                                id="pageLocation"
                                                name="pageLocation"
                                                value={pageLocation}
                                                onChange={handleInputChange}
                                                placeholder="Enter page location"
                                                className="input input-warning w-full bg-white"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="pageExpiryDate" className="block text-sm font-medium text-gray-700">Page Expiry Date:</label>
                                            <input
                                                type="date"
                                                id="pageExpiryDate"
                                                name="pageExpiryDate"
                                                value={pageExpiryDate}
                                                onChange={handleInputChange}
                                                className="input input-warning w-full bg-white"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="newImageUrl" className="block text-sm font-medium text-gray-700">Image URLs:</label>
                                            <div className="flex rounded-md shadow-sm">
                                                <input
                                                    type="url"
                                                    name="newImageUrl"
                                                    id="newImageUrl"
                                                    placeholder="Enter image URL"
                                                    className="input input-warning flex-1 rounded-none rounded-l-md bg-white"
                                                    value={newImageUrl}
                                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddImageUrl}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    Add Image
                                                </button>
                                            </div>
                                        </div>

                                        {finalPageData.pageImageUrls.length > 0 && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700">Image URLs:</label>
                                                <ul className="list-disc pl-5 mt-1 text-gray-700">
                                                    {finalPageData.pageImageUrls.map((url, index) => (
                                                        <li key={index} className="flex items-center space-x-2">
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 break-all">{url}</a> {/* Added break-all */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImageUrl(index)}
                                                                className="text-red-500 hover:text-red-700 focus:outline-none"
                                                            >
                                                                Remove
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label htmlFor="pageVideoUrl" className="block text-sm font-medium text-gray-700">Video URL:</label>
                                            <input
                                                type="url"
                                                id="pageVideoUrl"
                                                name="pageVideoUrl"
                                                value={pageVideoUrl}
                                                onChange={handleInputChange}
                                                placeholder="https://example.com/video.mp4"
                                                className="input input-warning w-full bg-white"
                                            />
                                        </div>

                                        {/* Posts Section */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <h3 className="text-lg font-medium text-gray-900">Posts</h3>
                                            <div className="mb-4">
                                                <label htmlFor="newPostText" className="block text-sm font-medium text-gray-700">Post Text:</label>
                                                <textarea
                                                    id="newPostText"
                                                    name="newPostText"
                                                    value={newPostText}
                                                    onChange={(e) => setNewPostText(e.target.value)}
                                                    rows={2}
                                                    placeholder="Write your post content"
                                                    className="textarea textarea-warning w-full bg-white"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label htmlFor="newPostImageUrl" className="block text-sm font-medium text-gray-700">Post Image URL:</label>
                                                <input
                                                    type="url"
                                                    id="newPostImageUrl"
                                                    name="newPostImageUrl"
                                                    value={newPostImageUrl}
                                                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="input input-warning w-full bg-white"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddPost}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Add Post
                                            </button>
                                            {finalPageData.posts.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {finalPageData.posts.map((post) => (
                                                        <div key={post.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{post.text.substring(0, 50)}...</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePost(post.id)}
                                                                className="text-red-500 hover:text-red-700 focus:outline-none"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stories Section */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <h3 className="text-lg font-medium text-gray-900">Stories</h3>
                                            <div className="mb-4">
                                                <label htmlFor="newStoryText" className="block text-sm font-medium text-gray-700">Story Text:</label>
                                                <textarea
                                                    id="newStoryText"
                                                    name="newStoryText"
                                                    value={newStoryText}
                                                    onChange={(e) => setNewStoryText(e.target.value)}
                                                    rows={2}
                                                    placeholder="Tell your story"
                                                    className="textarea textarea-warning w-full bg-white"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label htmlFor="newStoryImageUrl" className="block text-sm font-medium text-gray-700">Story Image URL:</label>
                                                <input
                                                    type="url"
                                                    id="newStoryImageUrl"
                                                    name="newStoryImageUrl"
                                                    value={newStoryImageUrl}
                                                    onChange={(e) => setNewStoryImageUrl(e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="input input-warning w-full bg-white"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddStory}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Add Story
                                            </button>
                                            {finalPageData.stories.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {finalPageData.stories.map((story) => (
                                                        <div key={story.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{story.text.substring(0, 50)}...</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveStory(story.id)}
                                                                className="text-red-500 hover:text-red-700 focus:outline-none"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto" // Added width control
                                            >
                                                {isSubmitting ? (isManaging ? 'Updating...' : 'Creating...') : (isManaging ? 'Update Final Page' : 'Create Final Page')}
                                            </button>
                                        </div>

                                        {isManaging && (
                                            <div>
                                                <button
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={handleDeleteFinalPage}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto" // Added width control
                                                >
                                                    <FaTrashAlt className="mr-2" /> Delete Final Page
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                    <FinalPagePreview finalPageData={finalPageData} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className=" rounded-lg shadow overflow-hidden p-8 text-center">
                            <p className="text-gray-700">Please sign in to access the admin panel.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;