import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { Mistral } from '@mistralai/mistralai';

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
  likes?: number;
  views?: number;
  commentsCount?: number;
}

const apiKey = process.env.MISTRAL_API_KEY;
const client = apiKey ? new Mistral({ apiKey }) : null;


// Function to fetch user profile
async function getUserProfile(userId: string | null | undefined) { // userId can be null or undefined
  if (!userId) {
    return null; // Return null if no userId is provided (not logged in)
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.log(`User profile not found for UID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}


// Modified getRecommendations function with type check
async function getRecommendations(challenges: Challenge[], userProfile: any): Promise<Challenge[]> {
  if (!client) {
    console.warn('Mistral API key is missing. Returning challenges without recommendations.');
    return challenges;
  }

  try {
    let promptContent = `Recommend the best challenges from the following data: ${JSON.stringify(challenges)}`;

    if (userProfile && userProfile.visitedLocationIds && userProfile.visitedLocationIds.length > 0) {
      promptContent = `Recommend challenges that might be interesting to a user who has visited locations with IDs: ${JSON.stringify(userProfile.visitedLocationIds)}.  Consider these user's past interests when recommending challenges. Here are the available challenges: ${JSON.stringify(challenges)}`;
    } else {
      promptContent = `Recommend the best challenges from the following data for a general user. ${JSON.stringify(challenges)}`;
    }


    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: 'You are an AI assistant providing personalized challenge recommendations.' },
        { role: 'user', content: promptContent }
      ],
    });

    const responseText = chatResponse.choices?.[0]?.message?.content;
    console.log('Mistral Recommendations:', responseText);

    let recommendedTitles: string[] = []; // Initialize as empty array

    if (typeof responseText === 'string') { // Add type check here
      recommendedTitles = [...responseText.matchAll(/\*\*(.*?)\*\*/g)].map(match => match[1]);
    } else {
      console.warn('Mistral response content is not a string. Skipping title extraction.');
      recommendedTitles = []; // Ensure it remains an empty array in case of non-string response
    }


    console.log('Extracted Recommended Titles:', recommendedTitles);

    const finalChallenges = challenges.map((challenge) => {
      const isRecommended = recommendedTitles.some(title => challenge.title.toLowerCase() === title.toLowerCase());
      return {
        ...challenge,
        title: isRecommended ? `${challenge.title} (Recommended)` : challenge.title,
      };
    });

    return finalChallenges;
  } catch (error) {
    console.error('Error fetching recommendations from Mistral:', error);
    return challenges; // Return challenges as-is if Mistral fails
  }
}

// Updated GET function
export async function GET(request: Request) { // Add request parameter
  try {
    // 1. Get userId from query parameter (INSECURE - for example only)
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId'); // Example: /api/challenges?userId=someUserId

    console.log('User ID from query parameter:', userId); // Log the userId

    const q = query(collection(db, 'challenges'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const challenges: Challenge[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp ? data.timestamp.toDate().toISOString() : undefined;

      challenges.push({
        id: doc.id,
        ...data,
        timestamp
      } as Challenge);
    });

    // 2. Fetch user profile (only if userId is present)
    const userProfile = await getUserProfile(userId); // Pass userId to getUserProfile

    // 3. Get AI Recommendations using Mistral with fallback and user profile
    const recommendedChallenges = await getRecommendations(challenges, userProfile);

    return NextResponse.json(recommendedChallenges);
  } catch (error: any) {
    console.error('Error fetching challenges from Firebase:', error);
    return NextResponse.json([], { status: 500 });
  }
}