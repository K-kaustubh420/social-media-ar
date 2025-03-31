import React from 'react';

const FinalPage = () => {
    // Dummy data - same as before, for now
    const communityDetails = {
        name: 'BoomTown Fair',
        creator: 'Sujan Pradhan',
        postsCount: '1224',
        followersCount: '42k',
        startedDate: '12 Oct',
        description: 'Join us for an unforgettable party festival event! Experience the thrill of live music, delicious food, exciting games, and fantastic entertainment. Dance the night away to your favorite tunes, watch amazing performances, and create memories that will last a lifetime.',
        bgImage: 'https://images.unsplash.com/photo-1533174072536-70d2e2f719a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    };

    const talesPosts = [
        { id: 1, user: 'John Doe', userAvatar: 'https://i.pravatar.cc/50?img=1', image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80' },
        { id: 2, user: 'Alice Smith', userAvatar: 'https://i.pravatar.cc/50?img=2', image: 'https://images.unsplash.com/photo-1588072076103-862cc8d4b32d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' },
    ];

    const leaderboardTop3 = [
        { id: 1, user: 'Chester Wade', avatar: 'https://i.pravatar.cc/80?img=7' },
        { id: 2, user: 'Daniel Apodaca', avatar: 'https://i.pravatar.cc/80?img=8' },
        { id: 3, user: 'Daniel Apodaca', avatar: 'https://i.pravatar.cc/80?img=9' },
    ];

    const galleryImages = [
        'https://images.unsplash.com/photo-1510915228340-29c85a3a66ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
        'https://images.unsplash.com/photo-1501281668745-bff3c9cabe25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1549282710-24321693d883?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1587049297298-46d5443a81c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1494232410401-fcaba72d4f95?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1575424909144-0f38abb4935c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    ];


    return (
        <div className="bg-base-100 font-sans">
            {/* Header Section */}
            <div className="relative">
                <img src={communityDetails.bgImage} alt="Community Background" className="w-full h-[200px] object-cover blur-sm brightness-75" />
                <div className="absolute top-2 left-2">
                    <button className="btn btn-ghost btn-circle btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-2xl font-bold">{communityDetails.name}</h2>
                    <p className="text-xs">{communityDetails.creator}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs justify-around bg-base-200 text-base-content">
                <button className="tab tab-bordered tab-active rounded-none font-bold">Tales</button>
                <button className="tab tab-bordered rounded-none font-bold">Stories</button>
                <button className="tab tab-bordered rounded-none font-bold">Leaderboard</button>
                <button className="tab tab-bordered rounded-none font-bold">Members</button>
            </div>

            {/* Community Info & Stats */}
            <div className="px-4 py-3 mt-2">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <div className="font-bold text-base"><span className="text-lg">{communityDetails.postsCount}</span> <span className="font-normal text-xs text-gray-500">Posts</span></div>
                        <div className="font-bold text-base"><span className="text-lg">{communityDetails.followersCount}</span> <span className="font-normal text-xs text-gray-500">Followers</span></div>
                        <div className="font-bold text-base"><span className="text-lg">{communityDetails.startedDate}</span> <span className="font-normal text-xs text-gray-500">Started on</span></div>
                    </div>
                    <button className="btn btn-primary btn-sm rounded-full text-xs font-bold">Join</button>
                </div>
                <p className="text-gray-700 text-xs">{communityDetails.description}</p>
            </div>

            {/* Tales Section (Posts) */}
            <div className="px-2 grid grid-cols-2 gap-2 mt-3">
                {talesPosts.map(post => (
                    <div key={post.id} className="mb-2">
                        <div className="flex items-center mb-1">
                            <div className="avatar placeholder">
                                <div className="bg-neutral-focus text-neutral-content rounded-full w-5">
                                    <img src={post.userAvatar} alt="User Avatar" className="w-5 rounded-full"/>
                                </div>
                            </div>
                            <span className="ml-2 font-semibold text-xs">{post.user}</span>
                        </div>
                        <img src={post.image} alt={`Post by ${post.user}`} className="rounded-md w-full h-auto" />
                    </div>
                ))}
                {/* Placeholder Posts to match image layout if needed */}
                <div className="mb-2"></div> {/* Empty div to match two post layout in image */}
                <div className="mb-2"></div>
            </div>


            {/* Leaderboard Section */}
            <div className="px-4 py-3 bg-base-200 rounded-box mt-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-base">Leaderboard</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 justify-items-center">
                    {leaderboardTop3.map((leader, index) => (
                        <div key={leader.id} className="flex flex-col items-center">
                            <div className="relative">
                                <div className="avatar">
                                    <div className="w-16 rounded-full ring ring-primary ring-offset-2">
                                        <img src={leader.avatar} alt={`${leader.user} Avatar`} />
                                    </div>
                                </div>
                                <div className="absolute top-0 left-0 transform translate-x-1 translate-y-1">
                                    <div className={`badge badge-accent badge-sm`}> {index + 1}</div>
                                </div>
                            </div>
                            <p className="font-semibold mt-1 text-xs">{leader.user}</p>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-3">
                    <button className="btn btn-outline btn-xs rounded-full font-bold">Check all</button>
                </div>
            </div>

            {/* Gallery Section */}
            <div className="px-4 py-3 mt-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-base">Gallery</h3>
                    <a href="#" className="text-xs text-primary font-bold">See all</a>
                </div>
                <div className="grid grid-cols-3 gap-1">
                    {galleryImages.map((img, index) => (
                        <img key={index} src={img} alt="Gallery Image" className="rounded-sm w-full h-auto" style={{ aspectRatio: '1/1', objectFit: 'cover' }} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinalPage;