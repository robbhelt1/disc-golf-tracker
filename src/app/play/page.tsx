'use client';
// 1. Force dynamic to prevent build errors
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// DATA EMBEDDED
const courseData = [
  { hole: 1, par: 3, distances: { red: 200, white: 240, blue: 385 }, info: "Mando left of the marked tree. Drop zone at white tee.", image: "/hole1.jpg" },
  { hole: 2, par: 3, distances: { red: 220, white: 280, blue: 350 }, info: "Straight shot low ceiling. Creek on left.", image: "/hole1.jpg" },
  { hole: 3, par: 4, distances: { red: 300, white: 400, blue: 520 }, info: "Long dogleg right. Landing zone past oak.", image: "/hole1.jpg" },
  { hole: 4, par: 3, distances: { red: 180, white: 220, blue: 260 }, info: "Island green. Miss is a penalty.", image: "/hole1.jpg" },
  { hole: 5, par: 3, distances: { red: 250, white: 300, blue: 350 }, info: "Uphill battle. Plays longer.", image: "/hole1.jpg" },
];

function PlayContent() {
  const searchParams = useSearchParams();
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [mode, setMode] = useState('1v1');
  
  // scores[holeIndex][playerIndex]
  const [scores, setScores] = useState<Record<number, Record<number, number>>>({});

  useEffect(() => {
    // 1. Get Mode
    const currentMode = searchParams.get('mode') || '1v1';
    setMode(currentMode);

    // 2. Get Players
    const names: string[] = [];
    let i = 0;
    while (true) {
      const name = searchParams.get(`p${i}`);
      if (!name && i > 5) break; 
      if (name) names.push(name);
      i++;
    }
    if (names.length === 0) names.push("Player 1");
    setPlayerNames(names);
  }, [searchParams]);

  const currentHole = courseData[currentHoleIndex] || courseData[0];

  // --- LOGIC: UPDATE SCORE ---
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

  const getHoleScore = (hIdx: number, pIdx: number) => {
    return scores[hIdx]?.[pIdx] || courseData[hIdx].par;
  };

  // --- LOGIC: PLAYER TOTAL (LIVE) ---
  const getPlayerTotalToPar = (pIdx: number) => {
    let total = 0;
    // Sum up all holes played so far (including current)
    for (let h = 0; h <= currentHoleIndex; h++) {
       const s = scores[h]?.[pIdx];
       // Only count if a score has been entered (checked by existence)
       // OR assume default par if we want live updating immediately
       const val = s || courseData[h].par;
       total += (val - courseData[h].par);
    }
    if (total === 0) return "E";
    return total > 0 ? `+${total}` : `${total}`;
  };

  // --- LOGIC: TEAM BEST BALL CALCULATION ---
  const getTeamScoreForHole = (hIdx: number, teamIndex: number) => {
    // Team 1 = Players 0, 1 (and 2 if 3v3)
    // Team 2 = Players 2, 3 (or 3, 4, 5 if 3v3)
    
    let pStart = 0; 
    let pEnd = 0;

    if (teamIndex === 1) {
      pStart = 0;
      pEnd = mode === '3v3' ? 2 : 1;
    } else {
      pStart = mode === '3v3' ? 3 : 2;
      pEnd = mode === '3v3' ? 5 : 3;
    }

    let bestScore = 99;
    for (let i = pStart; i <= pEnd; i++) {
      if (playerNames[i]) {
        const s = getHoleScore(hIdx, i);
        if (s < bestScore) bestScore = s;
      }
    }
    return bestScore;
  };

  const getTeamTotalToPar = (teamIndex: number) => {
    let total = 0;
    for (let h = 0; h <= currentHoleIndex; h++) {
      const best = getTeamScoreForHole(h, teamIndex);
      total += (best - courseData[h].par);
    }
    if (total === 0) return "E";
    return total > 0 ? `+${total}` : `${total}`;
  };

  // Check if a specific player has the "Best Score" for their team on this hole
  const isBestScore = (pIdx: number) => {
    if (mode === '1v1') return false;
    const myScore = getHoleScore(currentHoleIndex, pIdx);
    
    // Determine my team
    let team = 1;
    if (mode === '2v2' && pIdx > 1) team = 2;
    if (mode === '3v3' && pIdx > 2) team = 2;

    const best = getTeamScoreForHole(currentHoleIndex, team);
    return myScore === best;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-32">
      
      {/* --- TOP BAR: TEAM LIVE SCORES --- */}
      {mode !== '1v1' && (
        <div className="flex justify-between bg-zinc-900/80 p-3 rounded-xl mb-4 border border-zinc-700">
          <div className="text-center w-1/2 border-r border-zinc-700">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Team One</p>
            <p className="text-2xl font-black">{getTeamTotalToPar(1)}</p>
          </div>
          <div className="text-center w-1/2">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Team Two</p>
            <p className="text-2xl font-black">{getTeamTotalToPar(2)}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-4">
        <h1 className="text-4xl font-black italic text-green-500 uppercase leading-none">Hole {currentHole.hole}</h1>
        <div className="text-right">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Par</p>
          <p className="text-2xl font-black leading-none">{currentHole.par}</p>
        </div>
      </div>

      {/* IMAGE */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 border-2 border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentHole.image} 
          alt={`Hole ${currentHole.hole}`} 
          className="w-full h-full object-cover opacity-80" 
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 flex justify-around border-t border-zinc-700">
           <div className="text-center"><span className="block text-[10px] text-red-500 font-black uppercase">Red</span><span className="font-bold">{currentHole.distances.red}</span></div>
           <div className="text-center"><span className="block text-[10px] text-zinc-300 font-black uppercase">White</span><span className="font-bold">{currentHole.distances.white}</span></div>
           <div className="text-center"><span className="block text-[10px] text-blue-500 font-black uppercase">Blue</span><span className="font-bold">{currentHole.distances.blue}</span></div>
        </div>
      </div>

      {/* SCORING AREA */}
      <div className="space-y-3">
        {playerNames.map((name, idx) => {
          const isTeam1 = (mode === '2v2' && idx < 2) || (mode === '3v3' && idx < 3);
          const score = getHoleScore(currentHoleIndex, idx);
          const isBest = isBestScore(idx);

          return (
            <div key={idx} className={`relative flex items-center justify-between p-3 rounded-2xl border shadow-lg ${
               isBest && mode !== '1v1' ? 'bg-zinc-800 border-yellow-500/50' : 'bg-zinc-900 border-zinc-800'
            }`}>
              
              {/* Left Side: Name & Team Indicator */}
              <div className="flex items-center gap-3 w-40">
                <div className={`w-1 h-10 rounded-full ${isTeam1 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                <div>
                  <div className="font-bold text-lg text-white truncate w-32">{name}</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Total: <span className="text-zinc-300">{getPlayerTotalToPar(idx)}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Scorer */}
              <div className="flex items-center gap-3">
                <button onClick={() => updateScore(idx, -1)} className="w-10 h-10 bg-zinc-800 rounded-xl text-xl font-bold text-zinc-400 active:bg-red-500 active:text-white">-</button>
                
                <span className={`text-3xl font-black w-8 text-center ${
                   isBest && mode !== '1v1' ? 'text-yellow-400' :
                   score < currentHole.par ? 'text-green-500' : 
                   score > currentHole.par ? 'text-red-500' : 'text-white'
                }`}>
                  {score}
                </span>
                
                <button onClick={() => updateScore(idx, 1)} className="w-10 h-10 bg-zinc-800 rounded-xl text-xl font-bold text-zinc-400 active:bg-green-500 active:text-black">+</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* NAV */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-zinc-800 flex gap-4 z-50">
        <button onClick={() => currentHoleIndex > 0 && setCurrentHoleIndex(currentHoleIndex - 1)} disabled={currentHoleIndex === 0} className="flex-1 bg-zinc-800 py-4 rounded-xl font-black uppercase text-sm disabled:opacity-20">Prev</button>
        <button onClick={() => currentHoleIndex < courseData.length - 1 && setCurrentHoleIndex(currentHoleIndex + 1)} disabled={currentHoleIndex === courseData.length - 1} className="flex-1 bg-green-600 text-black py-4 rounded-xl font-black uppercase text-sm">Next Hole</button>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-10">Loading...</div>}>
      <PlayContent />
    </Suspense>
  );
}