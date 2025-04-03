// components/Profile.tsx
import Image from 'next/image';
import ReelsGrid from './reelsgrid';
import { notFound } from 'next/navigation';

export interface ProfileData {
    uid: string;
    email: string;
    username: string;
    displayName: string;
    bio: string;
    profilePictureUrl: string | undefined;
    createdAt: any;
    updatedAt: any;
    postCount: number;
    challengeCount: number;
    followingCount: number;
    followerCount: number;
    visitedLocationsCount: number;
    savedPostIds: string[];
    visitedLocationIds: string[];
    followingUids: string[];
}

interface ProfileProps {
    userData: ProfileData | null;
    profileId: string;
}

const Profile: React.FC<ProfileProps> = ({ userData }) => {
    const userName = userData?.displayName || userData?.username || "User";
    const imageUrl = userData?.profilePictureUrl || "/defaultpic.png";
    const groupCount = userData?.challengeCount || 0;
    const interestsCount = userData?.followingCount || 0;
    const rsvpCount = userData?.followerCount || 0;

    const reels = [
        {
            id: 1,
            thumbnail: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            videoUrl: "https://www.example.com/reel1.mp4",
            caption: "Exploring the outdoors!",
            views: "1.5M",
            likes: "120k",
            comments: "2.5k",
            timestamp: "2 hours ago",
            user: {
                username: userData?.username || "kyleuser",
                profilePic: userData?.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            }
        },
        {
            id: 2,
            thumbnail: "https://images.unsplash.com/photo-1707343843598-3975d7254339?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            videoUrl: "https://www.example.com/reel2.mp4",
            caption: "City lights at night",
            views: "875K",
            likes: "120k",
            comments: "2.5k",
            timestamp: "2 hours ago",
            user: {
                username: userData?.username || "kyleuser",
                profilePic: userData?.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            }
        },
        {
            id: 3,
            thumbnail: "https://images.unsplash.com/photo-1708560990193-e38c8d7a9b49?q=80&w=2834&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            videoUrl: "https://www.example.com/reel3.mp4",
            caption: "Working on a new project",
            views: "2.3M",
            likes: "120k",
            comments: "2.5k",
            timestamp: "2 hours ago",
            user: {
                username: userData?.username || "kyleuser",
                profilePic: userData?.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            }
        },
        {
            id: 4,
            thumbnail: "https://images.unsplash.com/photo-1708767272035-4f45a89a5135?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            videoUrl: "https://www.example.com/reel4.mp4",
            caption: "Weekend vibes",
            views: "550K",
            likes: "120k",
            comments: "2.5k",
            timestamp: "2 hours ago",
            user: {
                username: userData?.username || "kyleuser",
                profilePic: userData?.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            }
        },
        {
            id: 5,
            thumbnail: "https://images.unsplash.com/photo-1708848087987-33d5a7b19f8d?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            videoUrl: "https://www.example.com/reel5.mp4",
            caption: "Delicious food!",
            views: "1.2M",
            likes: "120k",
            comments: "2.5k",
            timestamp: "2 hours ago",
            user: {
                username: userData?.username || "kyleuser",
                profilePic: userData?.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            }
        },
        {
            id: 6,
            thumbnail: "https://images.unsplash.com/photo-1708890165988-3770485f7429?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            videoUrl: "https://www.example.com/reel6.mp4",
            caption: "Enjoying the sunset",
            views: "980K",
            likes: "120k",
            comments: "2.5k",
            timestamp: "2 hours ago",
            user: {
                username: userData?.username || "kyleuser",
                profilePic: userData?.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            }
        },
    ];

    if (!userData) {
        return (
          <div></div>
        ) 
    }

    return (
        <div className="min-h-screen flex flex-col" data-theme="night">
            <div className="navbar bg-base-300 md:hidden">
             {/* Mobile top bar code */}
            </div>

            <div className="flex-grow flex flex-col w-full max-w-3xl mx-auto">
                <div className="card lg:card-side bg-base-100 shadow-xl m-4">
                    <div className="avatar relative  ml-2 mt-2">
                        <div className="w-24 h-24 md:w-32 md:h-32  rounded-full">
                            <Image
                                src={imageUrl}
                                alt="Profile Photo"
                                layout="fill"
                                objectFit="cover"
                            />
                        </div>
                        <button className="absolute bottom-0 right-0 btn btn-circle btn-sm  bg-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </button>
                    </div>

                    <div className="card-body">
                        <h1 className="text-2xl md:text-4xl font-bold">{userName}</h1>
                        <div className="grid grid-cols-3 gap-4 my-4">
                            <div className="stat">
                                <div className="stat-title">Followers</div>
                                <div className="stat-value">{groupCount}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Following</div>
                                <div className="stat-value">{interestsCount}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Community</div>
                                <div className="stat-value">{rsvpCount}</div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Banner and "I'm looking to" Section  and Reels Section */}
                <div className="card w-full bg-base-100 shadow-xl mx-4 mb-6">
                    <div className="card-body">
                        <h2 className="card-title"> Try for Free</h2>
                        <p>The best of exploring for people seeking friendship. Free for 7 days.</p>
                        <div className="card-actions justify-end">
                            <button className="btn btn-primary">Try Our pro version </button>
                        </div>
                    </div>
                </div>

                <div className="w-full px-4">
                    <h3 className="text-lg font-semibold mb-2">I'm looking to</h3>
                    <div className="flex flex-wrap gap-2">
                        <button className="btn btn-outline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22c.251-.112.529-.01.695.218a3.75 3.75 0 005.157-4.632c-.692-1.413-2.06-3.376-5.888-3.722A48.257 48.257 0 0012 4.5c-2.542 0-5.056.183-7.5.524-3.827.346-5.196 2.309-5.887 3.722a3.75 3.75 0 005.157 4.632c.167.228.445.33.696.219l2.74 1.219c.776.86 2.81 2.929 5.814 5.519z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM8.25 15a.75.75 0 110-1.5.75.75 0 010 1.5zM15.75 15a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                            Professionally Network
                        </button>
                        <button className="btn btn-outline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            Make Friends
                        </button>
                        <button className="btn btn-outline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5a15.556 15.556 0 016.174-.87 15.676 15.676 0 013.438.953 15.556 15.556 0 016.363-.953 15.751 15.751 0 015.725 6.082c.288.298.594.558.917.777l-.493.493a.75.75 0 01-1.06 0l-.493-.493c.34-.232.66-.523.953-.87.952-1.133 2.218-1.943 3.637-2.348a15.65 15.65 0 01-.953 6.588 15.556 15.556 0 01-6.174.87 15.676 15.676 0 01-3.438-.953 15.701 15.701 0 01-7.316 0 15.676 15.676 0 01-3.438.953 15.556 15.556 0 01-6.174.87 15.65 15.65 0 01-.953-6.588 15.556 15.556 0 015.932-3.477c-.328-.949.07-1.949.953-2.625a15.75 15.75 0 013.954-1.313c.65-.09 1.307.006 1.925.274.49.212.946.486 1.362.816.417.33.794.707 1.124 1.124.33.416.604.872.816 1.362.268.618.364 1.275.274 1.925a15.6 15.6 0 01-1.904 4.843c-.587.486-1.244.816-1.925 1.007-.536.151-1.081.23-1.637.23-.49 0-.98-.06-1.459-.182-.618-.158-1.216-.379-1.782-.662l-.493-.493a.75.75 0 010-1.06l.493-.493a14.175 14.175 0 00-1.782-.662 14.096 14.096 0 00-3.096 0 14.175 14.175 0 00-1.782.662l-.493.493a.75.75 0 11-1.06-1.06l.493-.493c-.566-.283-1.164-.504-1.782-.662a14.32 14.32 0 00-1.459-.182c-.556 0-1.101.08-1.637.23a15.723 15.723 0 01-1.925-1.007 15.493 15.493 0 01-5.54-5.198 15.75 15.75 0 015.932-3.476zm10.444 3.129l-2.625 2.625m0 0a.75.75 0 01-1.06 0l-2.625-2.625m3.685 2.625a.75.75 0 01-1.06 0l-2.125-2.125m3.185 2.125a.75.75 0 11-1.06-1.06l1.25-1.25a.75.75 0 011.31-.22c.43.16.775.442 1.007.816.177.293.273.634.273.984v.003a.75.75 0 01-.786.786l-.786-.003v-.003a14.32 14.32 0 00-1.007.783l-.75.75a.75.75 0 01-1.06-1.06l.75-.75c.212-.33.33-.716.31-1.114l-.003-.786a.75.75 0 01.786-.786h.003c.35 0 .691.096.984.273a2.235 2.235 0 01.816 1.007z" />
                            </svg>
                            Practice Hobbies
                        </button>
                        <button className="btn btn-outline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Socialize
                        </button>
                    </div>
                </div>


                <div className="w-full px-4 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Reels</h3>
                    <ReelsGrid reels={reels} />
                </div>
            </div>
        </div>
    );
};

export default Profile;