import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
      <h1 className="text-5xl font-black tracking-tight">Warpala Expo Platform</h1>
      <p className="text-xl text-gray-600 max-w-2xl">
        Production-ready 3D experiences powered by Unreal Engine 5.7 Pixel Streaming.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/expo" 
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
        >
          Enter 3D Expo
        </Link>
        <Link 
          href="/dashboard/demo_sponsor" 
          className="px-8 py-3 bg-gray-100 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition"
        >
          Sponsor Dashboard
        </Link>
      </div>
    </div>
  );
}
