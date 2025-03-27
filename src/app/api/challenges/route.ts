import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
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

async function getRecommendations(challenges: Challenge[]): Promise<Challenge[]> {
  if (!client) {
    console.warn('Mistral API key is missing. Returning challenges without recommendations.');
    return challenges;
  }

  try {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: 'You are an AI assistant providing recommendations.' },
        { role: 'user', content: `Recommend the best challenges from the following data: ${JSON.stringify(challenges)}` }
      ],
    });

    const responseText = chatResponse.choices?.[0]?.message?.content;
    console.log('Mistral Recommendations:', responseText);

    // Extract challenge titles using regex
    const recommendedTitles = [...responseText.matchAll(/\*\*(.*?)\*\*/g)].map(match => match[1]);

    console.log('Extracted Recommended Titles:', recommendedTitles);

    // Add the '(Recommended)' label for matching titles
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

export async function GET() {
  try {
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

    // Get AI Recommendations using Mistral with fallback
    const recommendedChallenges = await getRecommendations(challenges);

    return NextResponse.json(recommendedChallenges);
  } catch (error: any) {
    console.error('Error fetching challenges from Firebase:', error);
    return NextResponse.json([], { status: 500 });
  }
}
