'use client';
import { useState } from 'react';
import { courseData } from '@/courseData';
import Image from 'next/image';

export default function PlayPage() {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
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
        <h1 className="text-2xl font-black italic text-green-500">HOLE {currentHole.hole}</h1>
        <div className="text-zinc-400 font-bold">Par {currentHole.par}</div>
      </div>

      {/* HOLE IMAGE */}
      <div className="relative w-full h-64 rounded-3xl overflow-hidden mb-6 border-2 border-zinc-800">
        <Image 
          src={currentHole.image} 
          alt={`Hole ${currentHole.hole}`} 
          fill 
          className="object-cover"
        />
      </div>

      {/* DISTANCES */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-zinc-900 p-3 rounded-2xl border-b-4 border-red-500">
          <p className="text-xs text-zinc-500 font-bold uppercase">Red</p>
          <p className="text-xl font-black">{currentHole.distances.red}</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-2xl border-b-4 border-white">
          <p className="text-xs text-zinc-500 font-bold uppercase">White</p>
          <p className="text-xl font-black">{currentHole.distances.white}</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-2xl border-b-4 border-blue-500">
          <p className="text-xs text-zinc-500 font-bold uppercase">Blue</p>
          <p className="text-xl font-black">{currentHole.distances.blue}</p>
        </div>
      </div>

      {/* HOLE INFO */}
      <div className="bg-zinc-900 p-5 rounded-3xl mb-10 border border-zinc-800">
        <p className="text-zinc-300 leading-relaxed text-sm italic">
          "{currentHole.info}"
        </p>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="fixed bottom-8 left-4 right-4 flex gap-4">
        <button 
          onClick={prevHole}
          disabled={currentHoleIndex === 0}
          className="flex-1 bg-zinc-800 py-4 rounded-2xl font-black disabled:opacity-30"
        >
          BACK
        </button>
        <button 
          onClick={nextHole}
          disabled={currentHoleIndex === courseData.length - 1}
          className="flex-1 bg-green-600 py-4 rounded-2xl font-black shadow-lg shadow-green-900/20"
        >
          NEXT HOLE
        </button>
      </div>
    </div>
  );
}