'use client';
import { useParams } from 'next/navigation';

export default function TestRoute() {
    const params = useParams();
    return (
        <div>
            <h1>Test Dynamic Route</h1>
            <p>Slug: {params.slug}</p>
        </div>
    );
}