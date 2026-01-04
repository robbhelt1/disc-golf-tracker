'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import { COURSE_DATA, TEES } from '@/courseData';

export default function Play() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- 1. SECURITY CHECK (The Bouncer) ---
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Kick to login if not authenticated
      } else {
        setUser(user);
        setLoadingUser(false);
      }
    }
    checkUser();
  }, [router]);

  // --- GAME STATE ---
  const [step, setStep] = useState(1); // 1 = Setup, 2 = Playing
  const [selectedTee, setSelectedTee] = useState('White');
  const [players, setPlayers] = useState<string[]>(['']); 
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0); 
  
  // Score Storage: { "PlayerName": { 1: 3, 2: 4 ... } }
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});

  // --- HELPER: CALCULATE TOTALS (Real-time Math) ---
  const getPlayerTotals = (player: string) => {
    const playerScores = scores[player] || {};
    let totalStrokes = 0;
    let totalPar = 0;

    // Loop through all holes to calculate running total
    COURSE_DATA.forEach(h => {
      // Only count holes where a score exists
      if (playerScores[h.hole]) {
        totalStrokes += playerScores[h.hole];
        totalPar += h.par;
      }
    });

    const relativeScore = totalStrokes - totalPar;
    
    // Format the display (e.g., "+2", "-1", "E")
    let displayRel = relativeScore > 0 ? `+${relativeScore}` : `${relativeScore}`;
    if (relativeScore === 0) displayRel = "E";

    return { totalStrokes, displayRel, relativeScore };
  };

  // --- GAMEPLAY ACTIONS ---
  const addPlayer = () => setPlayers([...players, '']);
  
  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    const realPlayers = players.filter(p => p.trim() !== '');
    if (realPlayers.length === 0) return alert("Add at least one player!");
    
    // Initialize score object
    const initialScores: any = {};
    realPlayers.forEach(p => initialScores[p] = {});
    setScores(initialScores);
    setPlayers(realPlayers);
    setStep(2);
  };

  const updateScore = (player: string, change: number) => {
    const currentHoleNum = COURSE_DATA[currentHoleIndex].hole;
    // Default to Par if no score exists yet
    const currentScore = scores[player][currentHoleNum] || COURSE_DATA[currentHoleIndex].par;
    
    setScores({
      ...scores,
      [player]: {
        ...scores[player],
        [currentHoleNum]: currentScore + change
      }
    });
  };

  const prevHole = () => {
    if (currentHoleIndex > 0) setCurrentHoleIndex(currentHoleIndex - 1);
  };

  const nextHole = () => {
    if (currentHoleIndex < COURSE_DATA.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    } else {
      finishRound();
    }
  };

  const finishRound = async () => {
    if(!confirm("Finish round and submit scores to the Leaderboard?")) return;

    // Loop through every player and save their card
    for (const player of players) {
      const playerScores = scores[player];
      
      let total = 0;
      Object.values(playerScores).forEach(s => total += s);

      // Prepare the data row for Supabase
      const dataToSave: any = {
        player_name: player,
        tee_color: selectedTee,
        total_score: total,
        created_by_user: user.email // Tracks who uploaded this score
      };

      // Map hole scores to columns hole_1, hole_2, etc.
      COURSE_DATA.forEach(h => {
        dataToSave[`hole_${h.hole}`] = playerScores[h.hole] || h.par;
      });

      await supabase.from('scorecards').insert(dataToSave);
    }

    alert("Round Saved Successfully!");
    router.push('/leaderboard'); // Send them straight to see the results
  };

  // --- LOADING SCREEN ---
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">
        <h1 className="text-2xl font-bold animate-pulse">Loading Game...</h1>
      </div>
    );
  }

  // --- VIEW 1: SETUP SCREEN ---
  if (step === 1) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8">New Round Setup</h1>
        
        <div className="w-full max-w-md bg-white rounded-xl p-6 text-gray-800 shadow-2xl">
          {/* TEES */}
          <label className="block font-bold mb-2 text-gray-700">Select Tees</label>
          <div className="flex gap-2 mb-6">
            {TEES.map(tee => (
              <button
                key={tee}
                onClick={() => setSelectedTee(tee)}
                className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${selectedTee === tee ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                {tee}
              </button>
            ))}
          </div>

          {/* PLAYERS */}
          <label className="block font-bold mb-2 text-gray-700">Who is playing?</label>
          {players.map((p, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Player ${i + 1} Name`}
              value={p}
              onChange={(e) => updatePlayerName(i, e.target.value)}
              className="w-full p-3 mb-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-medium"
            />
          ))}
          
          <button onClick={addPlayer} className="text-green-600 font-bold text-sm mb-8 flex items-center gap-1 hover:text-green-800 transition-colors">
            <span>+</span> Add Another Player
          </button>

          <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-transform active:scale-95">
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: PLAYING SCREEN ---
  const currentHole = COURSE_DATA[currentHoleIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* HOLE HEADER */}
      <div className="bg-green-800 p-4 rounded-xl mb-4 text-center shadow-lg border border-green-700">
        <h2 className="text-4xl font-bold text-white">Hole {currentHole.hole}</h2>
        <div className="flex justify-center gap-6 mt-2 text-green-200 text-lg font-medium">
          <span>Par {currentHole.par}</span>
          <span>{currentHole.distance} ft</span>
        </div>
        <p className="mt-2 text-sm text-green-300 italic">{currentHole.info}</p>
      </div>

      {/* PLAYER CARDS */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {players.map(player => {
          const s = scores[player][currentHole.hole] || currentHole.par;
          const { totalStrokes, displayRel, relativeScore } = getPlayerTotals(player);
          
          // Color Logic: Green for good (-), Red for bad (+), Gray for Even
          let scoreColor = "text-gray-500";
          if (relativeScore < 0) scoreColor = "text-green-600"; 
          if (relativeScore > 0) scoreColor = "text-red-500";   

          return (
            <div key={player} className="bg-white rounded-xl p-4 flex flex-col text-gray-800 shadow-md">
              {/* TOP ROW: Name + Real-time Stats */}
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <span className="font-bold text-xl truncate max-w-[50%]">{player}</span>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                   <span className={`font-bold ${scoreColor} text-lg`}>{displayRel}</span>
                   <span className="text-gray-400 text-sm font-semibold">({totalStrokes})</span>
                </div>
              </div>

              {/* BOTTOM ROW: The Buttons */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Strokes</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => updateScore(player, -1)} 
                    className="w-12 h-12 bg-red-100 text-red-600 rounded-full text-2xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center pb-1"
                  >-</button>
                  
                  <span className="text-4xl font-bold w-10 text-center text-gray-800">{s}</span>
                  
                  <button 
                    onClick={() => updateScore(player, 1)} 
                    className="w-12 h-12 bg-green-100 text-green-600 rounded-full text-2xl font-bold hover:bg-green-200 transition-colors flex items-center justify-center pb-1"
                  >+</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* NAVIGATION FOOTER */}
      <div className="mt-auto pt-2 flex gap-3">
        {currentHoleIndex > 0 && (
          <button 
            onClick={prevHole}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-colors"
          >
            &lt; Prev
          </button>
        )}
        
        <button 
          onClick={nextHole}
          className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-colors"
        >
          {currentHoleIndex < COURSE_DATA.length - 1 ? 'Next Hole >' : 'Finish Round'}
        </button>
      </div>
    </div>
  );
}