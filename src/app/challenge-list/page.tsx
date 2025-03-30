'use client'
import React, { useState, useEffect } from 'react';

interface Challenge {
    id: string;
    title: string;
    status: 'ongoing' | 'completed' | 'dropped' | 'accepted' | 'unknown'; // Include 'unknown'
    description?: string;
    imageUrl?: string;
    endDate?: string; // Add end date property
    timeLeft?: string; // Add time left property
}

const ChallengeStatusPage: React.FC = () => {
    const [acceptedChallenges, setAcceptedChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Mock challenges for demonstration
        const mockChallenges: Challenge[] = [
            {
                id: 'nepal-art-fest',
                title: 'nepal art fest',
                status: 'accepted',
                timeLeft: '3d 20 hrs 10 minutes',
                endDate: '30 mar 2025 11:45 pm',
            },
            {
                id: 'samay-being-samay',
                title: 'samay being samay',
                status: 'completed',
            },
            {
                id: 'musicfest',
                title: 'musicfest',
                status: 'dropped',
            },
        ];
        setAcceptedChallenges(mockChallenges);
        setLoading(false);
    }, []);

    const handleDropChallenge = (challengeId: string) => {
        setAcceptedChallenges(prevChallenges =>
            prevChallenges.map(challenge =>
                challenge.id === challengeId ? { ...challenge, status: 'dropped' } : challenge
            )
        );

    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'ongoing':
            case 'accepted':
                return 'accepted and ongoing';
            case 'completed':
                return 'completed and done';
            case 'dropped':
                return 'dropped or timed out';
            case 'unknown':
                return 'unknown';
            default:
                return 'unknown';
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'ongoing':
            case 'accepted':
                return 'bg-violet-600 text-white';
            case 'completed':
                return 'bg-green-500 text-white';
            case 'dropped':
                return 'bg-red-500 text-white';
            case 'unknown':
                return 'bg-indigo-400 text-white';
            default:
                return 'bg-gray-400 text-white';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-700 dark:text-gray-300">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
                <p className="text-red-500 dark:text-red-400">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 font-sans flex flex-col items-center border border-black pt-5">

            <div className="container mx-auto px-4" style={{ width: '375px' }}>
                <h1 className="text-2xl font-semibold text-purple-700 mb-4 text-left ml-3" >my challenges</h1>
                <div className="space-y-4">
                    {acceptedChallenges.map((challenge) => (
                        <div key={challenge.id} className={`rounded-xl p-4 bg-violet-300`} style={{ marginBottom: '20px' }}>
                            <h2 className="text-lg font-semibold text-gray-900">{challenge.title}</h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {challenge.status && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`} style={{ backgroundColor: (challenge.status === 'completed') ? '#82C68C' : (challenge.status === 'dropped') ? '#F14253' : undefined }}>
                                        {getStatusText(challenge.status)}
                                    </span>
                                )}
                                {challenge.timeLeft && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#F9AD58' }}>
                                        time left : {challenge.timeLeft}
                                    </span>
                                )}

                                {challenge.endDate && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#F9AD58' }}>
                                        challenge end date : {challenge.endDate}
                                    </span>
                                )}

                            </div>
                            <div className="mt-2">
                                {challenge.status === 'accepted' && (
                                    <button
                                        onClick={() => handleDropChallenge(challenge.id)}
                                        className="px-3 py-1 rounded-full text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        style={{ backgroundColor: '#F14253' }}
                                    >
                                        drop challenge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChallengeStatusPage;