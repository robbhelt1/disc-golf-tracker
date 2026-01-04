'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
      
      {/* HEADER */}
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
        
        <section>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Mountain Valley Disc Golf Scoring App</h2>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Overview</h3>
          <p className="leading-relaxed">
            The Mountain Valley Disc Golf App is a comprehensive, mobile-first digital scorecard and course companion designed to elevate the player experience. It moves beyond simple scorekeeping by offering real-time analytics, multiple competitive game formats, and a persistent social history of every round played.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Key Features</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Secure Identity:</strong> Full user authentication system allowing players to sign up, log in, and maintain a personal identity within the app.</li>
            <li><strong>Course Intelligence:</strong> Visual hole maps, pro tips, and accurate distance data for Red, White, and Blue tee positions on every hole.</li>
            <li><strong>User Directory:</strong> A built-in social directory that allows you to easily find and add registered friends to your card, or add guests manually.</li>
            <li><strong>Live Scoring Engine:</strong> An advanced interface that calculates "Relation to Par" instantly as you play.</li>
            <li><strong>Real-Time Leaderboard:</strong> An in-game "Live Standings" panel that re-sorts instantly after every stroke entered, so you always know who is winning.</li>
            <li><strong>Global Rankings:</strong> A persistent leaderboard that tracks history and filters records by Tee Color (Red/White/Blue).</li>
            <li><strong>Profile & Stats:</strong> A dedicated profile view where players can analyze their personal history, including average score, best score, and total rounds played.</li>
            <li><strong>Data Control:</strong> Users can edit their own scorecards if mistakes are made, and Administrators have oversight to manage and delete rounds if necessary.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Game Modes</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Stroke Play:</strong> The standard format where every stroke counts.</li>
            <li><strong>Match Play (Skins):</strong> A competitive mode where the lowest score wins the hole ("The Pot"). Ties carry over to the next hole, increasing the stakes dynamically.</li>
            <li><strong>Doubles (2v2) & Triples (3v3):</strong> A "Best Ball" team format. Teams enter scores for all members, but the app automatically counts only the best score for the team total.</li>
          </ul>
        </section>

        {/* UPDATED CREDITS SECTION */}
        <section className="border-t border-gray-200 pt-6 mt-6 text-center">
          <p className="font-bold text-gray-800">App by Robb Helt. All Rights Reserved.</p>
        </section>

        <Link href="/">
          <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg">
            Back to Home
          </button>
        </Link>

      </div>
    </div>
  );
}