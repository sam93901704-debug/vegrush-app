'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DeliveryPage() {
  const router = useRouter();

  useEffect(() => {
    // Set dev delivery token and redirect
    localStorage.setItem('token', 'dev-delivery');
    router.push('/delivery/orders');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

