'use client';
// 1. Force dynamic to prevent build errors
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// --- FULL 18 HOLE DATA ---
const courseData = [
  { hole: 1, par: 3, distances: { red: 200, white: 240, blue: 385 }, info: "Mando left of the marked tree. Drop zone at white tee.", image: "/hole1.jpg" },
  { hole: 2, par: 3, distances: { red: 220, white: 280, blue: 350 }, info: "Straight shot low ceiling. Creek on left.", image: "/hole1.jpg" },
  { hole: 3, par: 4, distances: { red: 300, white: 400, blue: 520 }, info: "Long dogleg right. Landing zone past oak.", image: "/hole1.jpg" },
  { hole: 4, par: 4, distances: { red: 180, white: 220, blue: 260 }, info: "Island green. Miss is a penalty.", image: "/hole1.jpg" },
  { hole: 5, par: 3, distances: { red: 250, white: 300, blue: 350 }, info: "Uphill battle. Plays longer.", image: "/hole1.jpg" },
  { hole: 6, par: 3, distances: { red: 310, white: 380, blue: 450 }, info: "Island Hole", image: "/hole1.jpg" },
  { hole: 7, par: 3, distances: { red: 190, white: 230, blue: 280 }, info: "Watch for the drop off behind the basket.", image: "/hole1.jpg" },
  { hole: 8, par: 3, distances: { red: 210, white: 260, blue: 310 }, info: "Wide open hyzer line.", image: "/hole1.jpg" },
  { hole: 9, par: 3, distances: { red: 350, white: 450, blue: 550 }, info: "The long bomber hole. Let it rip.", image: "/hole1.jpg" },
  { hole: 10, par: 3, distances: { red: 200, white: 240, blue: 290 }, info: "Double mando through the gap.", image: "/hole1.jpg" },
  { hole: 11, par: 3, distances: { red: 220, white: 270, blue: 330 }, info: "Elevated basket on the hill.", image: "/hole1.jpg" },
  { hole: 12, par: 3, distances: { red: 290, white: 360, blue: 420 }, info: "Sharp dogleg left.", image: "/hole1.jpg" },
  { hole: 13, par: 4, distances: { red: 180, white: 220, blue: 260 }, info: "Short technical ace run.", image: "/hole1.jpg" },
  { hole: 14, par: 3, distances: { red: 240, white: 290, blue: 340 }, info: "Blind tee shot over the ridge.", image: "/hole1.jpg" },
  { hole: 15, par: 3, distances: { red: 320, white: 400, blue: 500 }, info: "OB road along the entire right side.", image: "/hole1.jpg" },
  { hole: 16, par: 3, distances: { red: 200, white: 250, blue: 300 }, info: "Downhill shot. Disk will turn over.", image: "/hole1.jpg" },
  { hole: 17, par: 3, distances: { red: 210, white: 260, blue: 310 }, info: "Water hazard long.", image: "/hole1.jpg" },
  { hole: 18, par: 3, distances: { red: 350, white: 450, blue: 580 }, info: "Final hole. Plays back towards the clubhouse.", image: "/hole1.jpg" },
];

function PlayContent() {
  const router = useRouter();
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
    for (let h = 0; h <= currentHoleIndex; h++) {
       const s = scores[h]?.[pIdx];
       const val = s || courseData[h].par;
       total += (val - courseData[h].par);
    }
    if (total === 0) return "E";
    return total > 0 ? `+${total}` : `${total}`;
  };

  // --- LOGIC: TEAM BEST BALL CALCULATION ---
  const getTeamScoreForHole = (hIdx: number, teamIndex: number) => {
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

  const finishRound = () => {
    const confirmFinish = window.confirm("Finish the round and save scores?");
    if (confirmFinish) {
      router.push('/'); // Or redirect to leaderboard if you prefer
    }
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
              
              <div className="flex items-center gap-3 w-40">
                <div className={`w-1 h-10 rounded-full ${mode === '1v1' ? 'bg-green-500' : (isTeam1 ? 'bg-blue-500' : 'bg-red-500')}`}></div>
                <div>
                  <div className="font-bold text-lg text-white truncate w-32">{name}</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Total: <span className="text-zinc-300">{getPlayerTotalToPar(idx)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={() => updateScore(idx, -1)} className="w-10 h-10 bg-zinc-800 rounded-xl text-xl font-bold text-zinc-400 active:bg-red-500 active:text-white">-</button>
                <span className={`text-3xl font-black w-8 text-center ${
                   isBest && mode !== '1v1' ? 'text-yellow-400' :
                   score < currentHole.par ? 'text-green-500' : 
                   score > currentHole.par ? 'text-red-500' : 'text-white'
                }`}>{score}</span>
                <button onClick={() => updateScore(idx, 1)} className="w-10 h-10 bg-zinc-800 rounded-xl text-xl font-bold text-zinc-400 active:bg-green-500 active:text-black">+</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* NAV */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-zinc-800 flex gap-4 z-50">
        <button 
           onClick={() => currentHoleIndex > 0 && setCurrentHoleIndex(currentHoleIndex - 1)} 
           disabled={currentHoleIndex === 0} 
           className="flex-1 bg-zinc-800 py-4 rounded-xl font-black uppercase text-sm disabled:opacity-20"
        >
          Prev
        </button>
        
        {currentHoleIndex < courseData.length - 1 ? (
          <button 
             onClick={() => setCurrentHoleIndex(currentHoleIndex + 1)} 
             className="flex-1 bg-green-600 text-black py-4 rounded-xl font-black uppercase text-sm shadow-lg shadow-green-900/50"
          >
            Next Hole
          </button>
        ) : (
          <button 
             onClick={finishRound} 
             className="flex-1 bg-yellow-500 text-black py-4 rounded-xl font-black uppercase text-sm shadow-lg shadow-yellow-900/50"
          >
            Finish Round
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-10">Loading Round...</div>}>
      <PlayContent />
    </Suspense>
  );
}