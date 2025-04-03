import { NextRequest, NextResponse } from 'next/server';

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export async function POST(req: NextRequest) {
  try {
    const { userLatitude, userLongitude, challengeLatitude, challengeLongitude } = await req.json();

    if (!userLatitude || !userLongitude || !challengeLatitude || !challengeLongitude) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      challengeLatitude,
      challengeLongitude
    );
    
    const RADIUS = 20000; // 20 kilometers in meters
    const isWithinRadius = distance <= RADIUS;

    console.log(`Distance: ${distance} meters, isWithinRadius: ${isWithinRadius}`);

    return NextResponse.json({ 
      isWithinRadius,
      calculatedDistance: distance
    }, { status: 200 });

  } catch (error) {
    console.error('Error in location check route:', error);
    return NextResponse.json({ error: 'Failed to process location' }, { status: 500 });
  }
}