import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = params;
    const docId = `${challengeId}-final`;
    const docRef = doc(db, 'finalpages', docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(docSnap.data(), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
