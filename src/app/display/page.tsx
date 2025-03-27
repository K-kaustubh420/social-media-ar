// components/ChallengeDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import 'ol/ol.css';
import { FaMapMarkerAlt, FaImage, FaVideo, FaUser, FaTag } from 'react-icons/fa';
import moment from 'moment';  // Make sure to install: npm install moment

interface Location {
    latitude: number;
    longitude: number;
    address?: string;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    imageUrls: string[];
    videoUrl?: string;
    location: Location;
    creatorName: string;
    creatorAvatarUrl: string;
    category: string;
    timestamp?: string; // ISO String
}

const API_ENDPOINT = '/api/challenges'; // Adjust as needed

const ChallengeDisplay = () => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChallenges = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(API_ENDPOINT);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: Challenge[] = await response.json();
                setChallenges(data);
            } catch (err: any) {
                setError('Error fetching challenges: ' + err.message);
                console.error("Error fetching challenges: ", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, []);

    if (loading) {
        return <div className="text-center py-4">Loading challenges...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">Error: {error}</div>;
    }

    if (challenges.length === 0) {
        return <div className="text-center py-4">No challenges found.</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-center mb-8">Explore Challenges</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map((challenge) => (
                        <div key={challenge.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="font-bold text-xl mb-2">{challenge.title}</h2>
                                <p className="text-gray-700 text-base">{challenge.description}</p>

                                <div className="mt-4">
                                    {challenge.imageUrls.length > 0 && (
                                        <div className="flex space-x-2 overflow-x-auto">
                                            {challenge.imageUrls.map((url, index) => (
                                                <img key={index} src={url} alt={`Challenge ${challenge.title} - ${index + 1}`} className="w-32 h-20 object-cover rounded-md" />
                                            ))}
                                        </div>
                                    )}
                                    {challenge.videoUrl && (
                                        <div className="mt-2">
                                            <a href={challenge.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Watch Video</a>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <p className="text-gray-600 text-sm">
                                        <FaMapMarkerAlt className="inline-block mr-1" /> Location: {challenge.location.latitude.toFixed(4)}, {challenge.location.longitude.toFixed(4)}
                                        {challenge.location.address && `, ${challenge.location.address}`}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        Created: {challenge.timestamp ? moment(challenge.timestamp).format('MMMM D, YYYY h:mm A') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50">
                                <div className="flex items-center">
                                    <img src={challenge.creatorAvatarUrl} alt={`${challenge.creatorName}'s Avatar`} className="w-8 h-8 rounded-full mr-2" />
                                    <p className="text-gray-800 text-sm font-semibold">{challenge.creatorName}</p>
                                </div>
                                <div className="mt-2">
                                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">{challenge.category}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChallengeDisplay;