import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request, { params }) {
  const { challengeId } = params;

  try {
    const finalPageDocRef = doc(db, 'finalPages', challengeId);
    const finalPageDocSnap = await getDoc(finalPageDocRef);

    if (finalPageDocSnap.exists()) {
      const finalPageData = finalPageDocSnap.data();
      return NextResponse.json({
        id: finalPageDocSnap.id,
        ...finalPageData,
      });
    } else {
      return new NextResponse(JSON.stringify({ message: 'Final page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching final page:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}