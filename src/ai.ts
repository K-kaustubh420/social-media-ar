// app/api/challenges/route.ts
import { db } from '@/firebase/firebase';
import { collection, getDocs, query, orderBy, startAfter, limit, DocumentData, QuerySnapshot } from 'firebase/firestore';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  category: string;
  creatorName: string;
  location: { latitude: number; longitude: number; address: string; };
  timestamp?: { seconds: number; nanoseconds: number };
  [key: string]: any; // allows other properties, not required
}

// Function to fetch initial challenges
async function fetchInitialChallenges(pageSize: number): Promise<{ challenges: Challenge[]; lastVisible: DocumentData | null }> {
  try {
    const challengesRef = collection(db, 'challenges');
    const q = query(challengesRef, orderBy('timestamp', 'desc'), limit(pageSize));
    const snapshot = await getDocs(q);

    const challenges: Challenge[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { challenges, lastVisible };

  } catch (error) {
    console.error("Error fetching initial challenges:", error);
    return { challenges: [], lastVisible: null };
  }
}

// Function to fetch paginated challenges
async function fetchPaginatedChallenges(pageSize: number, lastVisible: DocumentData): Promise<{ challenges: Challenge[]; lastVisible: DocumentData | null }> {
  try {
    if (!lastVisible) {
      console.warn("No lastVisible document provided. Returning empty results.");
      return { challenges: [], lastVisible: null };
    }

    const challengesRef = collection(db, 'challenges');
    const q = query(challengesRef, orderBy('timestamp', 'desc'), startAfter(lastVisible), limit(pageSize));
    const snapshot = await getDocs(q);

    const challenges: Challenge[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
    const newLastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { challenges, newLastVisible };
  } catch (error) {
    console.error("Error fetching paginated challenges:", error);
    return { challenges: [], lastVisible: null };
  }
}

async function getChallengeRecommendations(userPreferences: string, challenges: Challenge[]): Promise<Challenge[]> {
  if (!MISTRAL_API_KEY) {
    console.warn("Mistral API key not set. Returning unfiltered challenges.");
    return challenges;
  }

  try {
    const prompt = `You are a recommendation system for a social media platform based on challenges. Given the user preferences: "${userPreferences}" and a list of challenges, rank the challenges based on their relevance to the user preferences. Return only the challenge IDs in order of relevance from most relevant to least relevant. \n\nChallenges:\n${challenges.map(c => `${c.id}: ${c.title} - ${c.category} - ${c.description}`).join('\n')}\n\nRanked Challenge IDs (most relevant to least relevant, comma separated):`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false,
        safe_mode: false,
      }),
    });

    if (!response.ok) {
      console.error(`Mistral API error: ${response.status} - ${await response.text()}`);
      return challenges;
    }

    const data = await response.json();
    const content = data.choices[0].message.content as string;

    const rankedIds = content.split(',').map(id => id.trim());

    // Create a map of challenge IDs to challenges for efficient lookup.
    const challengeMap: { [id: string]: Challenge } = {};
    challenges.forEach(challenge => {
      challengeMap[challenge.id] = challenge;
    });

    // Rank the challenges based on the order of IDs returned by Mistral.
    const rankedChallenges: Challenge[] = [];
    rankedIds.forEach(id => {
      if (challengeMap[id]) {
        rankedChallenges.push(challengeMap[id]);
      }
    });

    // Append any challenges that were not ranked by Mistral to the end of the list.
    challenges.forEach(challenge => {
      if (!rankedIds.includes(challenge.id) && !rankedChallenges.includes(challenge)) {
        rankedChallenges.push(challenge);
      }
    });

    return rankedChallenges;

  } catch (error) {
    console.error("Error during Mistral API call:", error);
    return challenges;
  }
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get('cursor');
  const pageSizeParam = searchParams.get('pageSize');
  const userPreferences = searchParams.get('userPreferences') || '';  // Default to empty string if not provided

  const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10; // Default page size
  let lastVisible: DocumentData | null = null;

  try {
    if (cursorParam) {
      lastVisible = JSON.parse(decodeURIComponent(cursorParam));
    }
  } catch (error) {
    console.error("Error parsing cursor:", error);
    return new Response(JSON.stringify({ error: 'Invalid cursor' }), { status: 400 });
  }


  let challengesResult;
  if (lastVisible) {
    challengesResult = await fetchPaginatedChallenges(pageSize, lastVisible);
  } else {
    challengesResult = await fetchInitialChallenges(pageSize);
  }

  let { challenges, lastVisible: newLastVisible } = challengesResult;

  if (userPreferences) {
    challenges = await getChallengeRecommendations(userPreferences, challenges);
  }


  const nextCursor = newLastVisible ? encodeURIComponent(JSON.stringify(newLastVisible)) : null;

  return new Response(JSON.stringify({
    challenges,
    nextCursor,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}