// THIS LINE FIXES THE VERCEL BUILD ERROR
export const dynamic = 'force-dynamic';

'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// DATA EMBEDDED DIRECTLY TO PREVENT IMPORT ERRORS
const courseData = [
  { hole: 1, par: 3, distances: { red: 200, white: 240, blue: 385 }, info: "Mando left of the marked tree. Drop zone is located at the white tee.", image: "/hole1.jpg" },
  { hole: 2, par: 3, distances: { red: 220, white: 280, blue: 350 }, info: "Straight shot with a low ceiling. Watch for the creek on the left.", image: "/hole1.jpg" },
  { hole: 3, par: 4, distances: { red: 300, white: 400, blue: 520 }, info: "Long dogleg right. Ideal landing zone is past the large oak.", image: "/hole1.jpg" },
  { hole: 4, par: 3, distances: { red: 180, white: 220, blue: 260 }, info: "Island green. If you miss the island, proceed to drop zone.", image: "/hole1.jpg" },
  { hole: 5, par: 3, distances: { red: 250, white: 300, blue: 350 }, info: "Uphill battle. Plays 20 feet longer than marked.", image: "/hole1.jpg" },
  // You can add holes 6-18 here later
];

export default function PlayPage() {
  const searchParams = useSearchParams();
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  
  // Stores scores: { holeIndex: { playerIndex: score } }
  const [scores, setScores] = useState<Record<number, Record<number, number>>>({});

  useEffect(() => {
    const names: string[] = [];
    // Grab names from URL (p0, p1, p2...)
    let i = 0;
    while (true) {
      const name = searchParams.get(`p${i}`);
      if (!name && i > 5) break; // Stop checking after reasonable limit
      if (name) names.push(name);
      i++;
    }
    // Fallback if no names found
    if (names.length === 0) names.push("Player 1");
    setPlayerNames(names);
  }, [searchParams]);

  const currentHole = courseData[currentHoleIndex] || courseData[0];

  const updateScore = (playerIdx: number, change: number) => {
    setScores(prev => {
      const holeScores = prev[currentHoleIndex] || {};
      const currentScore = holeScores[playerIdx] || currentHole.par; 
      return {
        ...prev,
        [currentHoleIndex]: {
          ...holeScores,
          [playerIdx]: currentScore + change
        }
      };
    });
  };

  const getScore = (playerIdx: number) => {
    return scores[currentHoleIndex]?.[playerIdx] || currentHole.par;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-32">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-4">
        <h1 className="text-4xl font-black italic text-green-500 uppercase leading-none">Hole {currentHole.hole}</h1>
        <div className="text-right">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Par</p>
          <p className="text-2xl font-black leading-none">{currentHole.par}</p>
        </div>
      </div>

      {/* IMAGE - USING STANDARD IMG TAG FOR SAFETY */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 border-2 border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentHole.image} 
          alt={`Hole ${currentHole.hole}`} 
          className="w-full h-full object-cover opacity-80" 
        />
        
        {/* OVERLAY DISTANCES */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 flex justify-around border-t border-zinc-700">
           <div className="text-center">
             <span className="block text-[10px] text-red-500 font-black uppercase">Red</span>
             <span className="font-bold">{currentHole.distances.red}</span>
           </div>
           <div className="text-center">
             <span className="block text-[10px] text-zinc-300 font-black uppercase">White</span>
             <span className="font-bold">{currentHole.distances.white}</span>
           </div>
           <div className="text-center">
             <span className="block text-[10px] text-blue-500 font-black uppercase">Blue</span>
             <span className="font-bold">{currentHole.distances.blue}</span>
           </div>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-zinc-900/80 p-4 rounded-2xl mb-8 border border-zinc-800">
        <p className="text-zinc-400 text-sm italic leading-relaxed">"{currentHole.info}"</p>
      </div>

      {/* SCORING AREA */}
      <div className="space-y-3">
        <h3 className="font-black text-zinc-600 uppercase tracking-widest text-xs mb-2 ml-1">Card</h3>
        {playerNames.map((name, idx) => (
          <div key={idx} className="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shadow-lg">
            <span className="font-bold text-lg text-white pl-2 w-32 truncate">{name}</span>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => updateScore(idx, -1)}
                className="w-10 h-10 bg-zinc-800 rounded-xl text-xl font-bold text-zinc-400 active:bg-red-500 active:text-white transition-colors"
              >-</button>
              
              <span className={`text-3xl font-black w-8 text-center ${
                 getScore(idx) < currentHole.par ? 'text-green-500' : 
                 getScore(idx) > currentHole.par ? 'text-red-500' : 'text-white'
              }`}>
                {getScore(idx)}
              </span>
              
              <button 
                onClick={() => updateScore(idx, 1)}
                className="w-10 h-10 bg-zinc-800 rounded-xl text-xl font-bold text-zinc-400 active:bg-green-500 active:text-black transition-colors"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-zinc-800 flex gap-4 z-50">
        <button 
          onClick={() => currentHoleIndex > 0 && setCurrentHoleIndex(currentHoleIndex - 1)}
          disabled={currentHoleIndex === 0}
          className="flex-1 bg-zinc-800 py-4 rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-20 transition-all"
        >
          Prev Hole
        </button>
        <button 
          onClick={() => currentHoleIndex < courseData.length - 1 && setCurrentHoleIndex(currentHoleIndex + 1)}
          disabled={currentHoleIndex === courseData.length - 1}
          className="flex-1 bg-green-600 text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-green-900/50 active:scale-95 transition-all"
        >
          Next Hole
        </button>
      </div>
    </div>
  );
}