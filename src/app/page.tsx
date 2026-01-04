'use client';
import Image from "next/image";
import Link from "next/link";
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in so we know whether to show "Sign Out"
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login'); // Send them to login screen
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-900 text-white relative">
      
      {/* --- LOGOUT BUTTON (Top Right) --- */}
      {user && (
        <button 
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-green-200 text-xs font-bold py-2 px-4 rounded-full border border-green-700 transition-all"
        >
          Sign Out ({user.email?.split('@')[0]})
        </button>
      )}

      <main className="flex flex-col items-center p-6 text-center">
        
        {/* LOGO AREA */}
        <div className="mb-8 bg-white p-4 rounded-full shadow-lg">
          <Image 
            src="/logo.png" 
            alt="App Logo" 
            width={150} 
            height={150} 
            className="rounded-full"
          />
        </div>

        <h1 className="text-4xl font-bold mb-2">
           Mountain Valley Disc Golf
        </h1>
        
        <h2 className="text-xl font-light mb-8 text-green-200">
           Official Scoring App
        </h2>

        <div className="w-full max-w-xs bg-white rounded-xl shadow-2xl overflow-hidden p-6 text-gray-800">
          <p className="mb-6 text-lg font-medium">Ready to hit the chains?</p>
          
          <Link href="/play">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl shadow-md transition-all mb-4">
              Start New Round
            </button>
          </Link>
          <Link href="/profile">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-md transition-all mb-4">
              My Profile
            </button>
          </Link>
          <Link href="/leaderboard">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg">
              View Leaderboard
            </button>
          </Link>
        </div>

      </main>
    </div>
  );
}