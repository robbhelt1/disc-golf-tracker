'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import { COURSE_DATA, TEES } from '@/courseData';
import Link from 'next/link';
import Image from 'next/image';

export default function Play() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- SECURITY CHECK ---
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); 
      } else {
        setUser(user);
        setLoadingUser(false);
      }
    }
    checkUser();
  }, [router]);

  // --- GAME STATE ---
  const [step, setStep] = useState(1);
  const [selectedTee, setSelectedTee] = useState('White');
  const [players, setPlayers] = useState<string[]>(['']); 
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0); 
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});
  const [saving, setSaving] = useState(false);

  // --- HELPER: CALCULATE TOTALS ---
  const getPlayerTotals = (player: string) => {
    const playerScores = scores[player] || {};
    let totalStrokes = 0;
    let totalPar = 0;

    COURSE_DATA.forEach(h => {
      if (playerScores[h.hole]) {
        totalStrokes += playerScores[h.hole];
        totalPar += h.par;
      }
    });

    const relativeScore = totalStrokes - totalPar;
    let displayRel = relativeScore > 0 ? `+${relativeScore}` : `${relativeScore}`;
    if (relativeScore === 0) displayRel = "E";

    return { totalStrokes, displayRel, relativeScore };
  };

  // --- ACTIONS ---
  const addPlayer = () => setPlayers([...players, '']);
  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    const realPlayers = players.filter(p => p.trim() !== '');
    if (realPlayers.length === 0) return alert("Add at least one player!");
    
    const initialScores: any = {};
    realPlayers.forEach(p => initialScores[p] = {});
    setScores(initialScores);
    setPlayers(realPlayers);
    setStep(2);
  };

  const updateScore = (player: string, change: number) => {
    const currentHoleNum = COURSE_DATA[currentHoleIndex].hole;
    const currentScore = scores[player][currentHoleNum] || COURSE_DATA[currentHoleIndex].par;
    
    setScores({
      ...scores,
      [player]: {
        ...scores[player],
        [currentHoleNum]: currentScore + change
      }
    });
  };

  const nextHole = () => {
    if (currentHoleIndex < COURSE_DATA.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    } else {
      finishRound();
    }
  };

  const prevHole = () => {
    if (currentHoleIndex > 0) setCurrentHoleIndex(currentHoleIndex - 1);
  };

  const finishRound = async () => {
    if(!confirm("Finish round and submit scores?")) return;
    setSaving(true);

    for (const player of players) {
      const playerScores = scores[player];
      let total = 0;
      Object.values(playerScores).forEach(s => total += s);

      const dataToSave: any = {
        player_name: player,
        tee_color: selectedTee,
        total_score: total,
        created_by_user: user.email 
      };

      COURSE_DATA.forEach(h => {
        dataToSave[`hole_${h.hole}`] = playerScores[h.hole] || h.par;
      });

      await supabase.from('scorecards').insert(dataToSave);
    }

    setSaving(false);
    setStep(3);
  };

  if (loadingUser) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white font-bold">Loading...</div>;

  // --- VIEW 1: SETUP ---
  if (step === 1) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
        <Image src="/logo.png" width={120} height={120} alt="Logo" className="mb-4 rounded-full shadow-lg" />
        <h1 className="text-3xl font-bold mb-8">New Round Setup</h1>
        <div className="w-full max-w-md bg-white rounded-xl p-6 text-gray-800 shadow-2xl">
          <label className="block font-bold mb-2">Select Tees</label>
          <div className="flex gap-2 mb-6">
            {TEES.map(tee => (
              <button key={tee} onClick={() => setSelectedTee(tee)} className={`flex-1 py-3 rounded-lg font-bold border-2 ${selectedTee === tee ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50'}`}>{tee}</button>
            ))}
          </div>
          <label className="block font-bold mb-2">Who is playing?</label>
          {players.map((p, i) => (
            <input key={i} type="text" placeholder={`Player ${i + 1} Name`} value={p} onChange={(e) => updatePlayerName(i, e.target.value)} className="w-full p-3 mb-3 border-2 rounded-lg" />
          ))}
          <button onClick={addPlayer} className="text-green-600 font-bold text-sm mb-8">+ Add Another Player</button>
          <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg">Start Game</button>
        </div>
      </div>
    );
  }

  // --- VIEW 3: SUMMARY ---
  if (step === 3) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-center text-gray-800">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2 text-green-800">Round Complete!</h1>
          <p className="text-gray-500 mb-6">Your scores have been posted.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {players.map(player => {
              const { totalStrokes, displayRel } = getPlayerTotals(player);
              return (
                <div key={player} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-3">
                  <span className="font-bold text-lg">{player}</span>
                  <div className="text-right">
                    <span className="block font-bold text-2xl text-green-700">{totalStrokes}</span>
                    <span className="text-sm text-gray-400">({displayRel})</span>
                  </div>
                </div>
              )
            })}
          </div>
          <Link href="/leaderboard"><button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg mb-3">View Leaderboard</button></Link>
          <Link href="/"><button className="text-gray-400 hover:text-gray-600 font-bold text-sm">Back to Home</button></Link>
        </div>
      </div>
    );
  }

  // --- VIEW 2: PLAYING (REDESIGNED) ---
  const currentHole = COURSE_DATA[currentHoleIndex];
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="bg-green-800 p-4 rounded-xl mb-4 shadow-lg border border-green-700">
        
        {/* Row 1: Logo & Hole Number */}
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white p-1 rounded-full shadow-md">
            <Image src="/logo.png" width={60} height={60} alt="Logo" className="rounded-full" />
          </div>
          <div>
             <h2 className="text-4xl font-black uppercase tracking-tight">Hole {currentHole.hole}</h2>
             <div className="flex gap-4 text-green-200 font-bold text-lg">
                <span>Par {currentHole.par}</span>
                <span>•</span>
                <span>{currentHole.distance} ft</span>
             </div>
          </div>
        </div>

        {/* Row 2: The Big Info Text (No longer tiny/italic) */}
        <div className="bg-green-900/50 p-4 rounded-lg border border-green-600">
           <p className="text-xl font-medium leading-relaxed text-white">
             {currentHole.info}
           </p>
        </div>
      </div>

      {/* MAP IMAGE AREA (Taller now!) */}
      {/* We use h-64 (256px) or h-72 depending on screen size to really use the space */}
      <div className="mb-4 w-full h-64 md:h-80 bg-gray-800 rounded-xl overflow-hidden relative shadow-2xl border-2 border-gray-700">
        {currentHole.image ? (
          <Image 
            src={currentHole.image} 
            alt={`Map of Hole ${currentHole.hole}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
             <span className="text-4xl mb-2">🗺️</span>
             <span className="font-bold">No Map Image</span>
          </div>
        )}
      </div>

      {/* PLAYERS LIST */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {players.map(player => {
          const s = scores[player][currentHole.hole] || currentHole.par;
          const { totalStrokes, displayRel, relativeScore } = getPlayerTotals(player);
          let scoreColor = "text-gray-500";
          if (relativeScore < 0) scoreColor = "text-green-600"; 
          if (relativeScore > 0) scoreColor = "text-red-500";   

          return (
            <div key={player} className="bg-white rounded-xl p-3 flex flex-col text-gray-800 shadow-md">
              <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                <span className="font-bold text-xl truncate max-w-[50%]">{player}</span>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                   <span className={`font-black ${scoreColor} text-lg`}>{displayRel}</span>
                   <span className="text-gray-500 text-sm font-bold">({totalStrokes})</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Strokes</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => updateScore(player, -1)} className="w-12 h-12 bg-red-100 text-red-600 rounded-full text-2xl font-bold flex items-center justify-center pb-1 shadow-sm border border-red-200">-</button>
                  <span className="text-4xl font-black w-12 text-center text-gray-800">{s}</span>
                  <button onClick={() => updateScore(player, 1)} className="w-12 h-12 bg-green-100 text-green-600 rounded-full text-2xl font-bold flex items-center justify-center pb-1 shadow-sm border border-green-200">+</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto pt-2 flex gap-3">
        {currentHoleIndex > 0 && (
          <button onClick={prevHole} className="flex-1 bg-gray-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg">&lt; Prev</button>
        )}
        <button onClick={nextHole} disabled={saving} className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg">
          {saving ? 'Saving...' : (currentHoleIndex < COURSE_DATA.length - 1 ? 'Next Hole >' : 'Finish Round')}
        </button>
      </div>
    </div>
  );
}