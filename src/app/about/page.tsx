'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
      
      {/* HEADER - UPDATED LOGO */}
      <div className="bg-white p-4 rounded-xl shadow-lg mb-6 w-full max-w-xs">
        <Image 
          src="/logo.png" 
          width={300} 
          height={100} 
          alt="Logo" 
          className="w-full h-auto object-contain" 
        />
      </div>
      
      <h1 className="text-3xl font-bold mb-8 text-center">About This App</h1>

      <div className="w-full max-w-2xl bg-white text-gray-800 rounded-xl p-8 shadow-2xl space-y-6">
        {/* ... (The rest of your text stays the same) ... */}
        <section>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Mountain Valley Disc Golf Scoring App</h2>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Overview</h3>
          <p className="leading-relaxed">
            The Mountain Valley Disc Golf App is a comprehensive, mobile-first digital scorecard and course companion designed to elevate the player experience. It moves beyond simple scorekeeping by offering real-time analytics, multiple competitive game formats, and a persistent social history of every round played.
          </p>
        </section>

        {/* ... KEEP THE REST OF THE TEXT SECTIONS ... */}
        
        <Link href="/">
          <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}