// app/api/challenges/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id: challengeId } = params;

  try {
    const challengeDocRef = doc(db, 'challenges', challengeId);
    const challengeDocSnap = await getDoc(challengeDocRef);

    if (challengeDocSnap.exists()) {
      const challengeData = challengeDocSnap.data();

      // Access latitude and longitude from the nested 'location' object:
      const location = challengeData.location;  // Get the location object

      const latitude = location?.latitude || null;       // Access latitude with optional chaining, default to null
      const longitude = location?.longitude || null;     // Access longitude with optional chaining, default to null

      const timestamp = challengeData.timestamp ? challengeData.timestamp.toDate().toISOString() : undefined;

      const challenge = {
        id: challengeDocSnap.id,
        title: challengeData.title,
        subtitle: challengeData.subtitle,
        description: challengeData.description,
        creatorName: challengeData.creatorName,
        creatorAvatarUrl: challengeData.creatorAvatarUrl,
        dailyVisits: challengeData.dailyVisits,
        participants: challengeData.participants,
        startDate: challengeData.startDate,
        locationName: challengeData.locationName || null, // Assuming this exists outside the location object
        latitude: latitude,
        longitude: longitude,
        challengeImages: challengeData.imageUrls || [],
        challengeVideos: challengeData.videoUrls || [],
        challengeFiles: challengeData.challengeFiles || [],
        imageUrl: challengeData.imageUrl || null,
        videoUrl: challengeData.videoUrl || null,
        timestamp: timestamp,
      };

      return NextResponse.json(challenge);
    } else {
      return new NextResponse(JSON.stringify({ message: 'Challenge not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}