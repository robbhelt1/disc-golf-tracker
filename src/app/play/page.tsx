'use client';
import { useState } from 'react';
import Image from 'next/image';

// WE ARE DEFINING THE DATA RIGHT HERE SO IT CANNOT FAIL
const courseData = [
  {
    hole: 1,
    par: 3,
    distances: { red: 250, white: 300, blue: 350 },
    info: "Straight shot down the middle. Watch out for the tree on the left.",
    image: "/hole1.jpg" // Make sure this image exists in your public folder
  },
  {
    hole: 2,
    par: 4,
    distances: { red: 300, white: 380, blue: 450 },
    info: "Dogleg right. Keep it low to avoid the hanging branches.",
    image: "/hole1.jpg" // Using hole1 as a placeholder if hole2 doesn't exist
  },
  {
    hole: 3,
    par: 3,
    distances: { red: 200, white: 240, blue: 280 },
    info: "Water hazard on the right. Play it safe to the left side.",
    image: "/hole1.jpg"
  }
];

export default function PlayPage() {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);

  // Safety check just in case
  if (!courseData || courseData.length === 0) {
    return <div className="min-h-screen bg-black text-white p-10">No course data found.</div>;
  }

  const currentHole = courseData[currentHoleIndex];

  const nextHole = () => {
    if (currentHoleIndex < courseData.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  const prevHole = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black italic text-green-500 uppercase">Hole {currentHole.hole}</h1>
        <div className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Par {currentHole.par}</div>
      </div>

      {/* HOLE IMAGE AREA */}
      <div className="relative w-full h-64 rounded-3xl overflow-hidden mb-6 border-2 border-zinc-800 shadow-2xl bg-zinc-900 flex items-center justify-center">
        {/* We use a simple img tag here to avoid Next.js Image strictness causing errors */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentHole.image} 
          alt={`Hole ${currentHole.hole}`} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* DISTANCE GRID */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900 p-3 rounded-2xl border-b-4 border-red-500 text-center">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Red</p>
          <p className="text-xl font-black">{currentHole.distances.red}</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-2xl border-b-4 border-white text-center">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">White</p>
          <p className="text-xl font-black">{currentHole.distances.white}</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-2xl border-b-4 border-blue-500 text-center">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Blue</p>
          <p className="text-xl font-black">{currentHole.distances.blue}</p>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-zinc-900/50 p-5 rounded-3xl mb-24 border border-zinc-800">
        <p className="text-zinc-300 leading-relaxed text-sm italic">
          "{currentHole.info}"
        </p>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="fixed bottom-6 left-4 right-4 flex gap-3">
        <button 
          onClick={prevHole}
          disabled={currentHoleIndex === 0}
          className="flex-1 bg-zinc-800 py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-20"
        >
          Back
        </button>
        <button 
          onClick={nextHole}
          disabled={currentHoleIndex === courseData.length - 1}
          className="flex-1 bg-green-600 py-5 rounded-2xl font-black uppercase tracking-widest text-black shadow-lg shadow-green-900/40"
        >
          Next
        </button>
      </div>
    </div>
  );
}