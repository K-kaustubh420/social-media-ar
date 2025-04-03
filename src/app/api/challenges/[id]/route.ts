import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: Request, context: { params: { id: string } }) {
  const { params } = context; // Get params first
  const challengeId = params.id; // Extract ID safely

  try {
    const challengeDocRef = doc(db, 'challenges', challengeId);
    const challengeDocSnap = await getDoc(challengeDocRef);

    if (challengeDocSnap.exists()) {
      const challengeData = challengeDocSnap.data();

      const location = challengeData.location || {}; // Ensure location exists to avoid undefined errors
      const latitude = location.latitude || null;
      const longitude = location.longitude || null;

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
        locationName: challengeData.locationName || null,
        latitude,
        longitude,
        challengeImages: challengeData.imageUrls || [],
        challengeVideos: challengeData.videoUrls || [],
        challengeFiles: challengeData.challengeFiles || [],
        imageUrl: challengeData.imageUrl || null,
        videoUrl: challengeData.videoUrl || null,
        timestamp,
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
