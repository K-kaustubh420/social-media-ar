"use client";

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Profile, { ProfileData } from '../Profile';

const SpecificProfilePage = () => {
    const params = useParams();
    const profileId = params.profileId as string;
    const [userData, setUserData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileId) {
            console.log("Profile ID is missing in params.");
            return notFound();
        }

        const fetchUserProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // **VERY IMPORTANT: Double-check your collection name here!**
                const userDocRef = doc(db, 'users', profileId); // Or 'user' - make sure it's correct!
                console.log("Fetching user document ref:", userDocRef.path);

                const docSnap = await getDoc(userDocRef);
                console.log("Document snapshot received:", docSnap);

                if (docSnap.exists()) {
                    console.log("Document exists!");
                    setUserData(docSnap.data() as ProfileData);
                    setIsLoading(false);
                } else {
                    console.log(`Document with ID ${profileId} does not exist.`);
                    setIsLoading(false);
                    return notFound(); // Keep notFound here
                }
            } catch (e) {
                console.error("Error fetching profile:", e);
                console.error("Error object:", e); // Log the full error object!
                setError("Failed to load profile."); // We can remove setError later
                setIsLoading(false);
                return notFound(); // Keep notFound here
            }
        };

        fetchUserProfile();
    }, [profileId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // **We can likely remove this entire if (error) block once notFound() is working**
    if (error) {
        return (
           notFound() 
        );
    }

    if (!userData) {
        return notFound();
    }

    return (
        <div>
            <Profile userData={userData} profileId={profileId} />
        </div>
    );
};

export default SpecificProfilePage;