'use client';
import { useState } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import { COURSE_DATA, TEES } from '@/courseData';

export default function Play() {
  const router = useRouter();
  
  // Game State
  const [step, setStep] = useState(1); // 1 = Setup, 2 = Playing
  const [selectedTee, setSelectedTee] = useState('White');
  const [players, setPlayers] = useState<string[]>(['']); 
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0); 
  
  // Scorekeeping
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});

  // --- SETUP HELPERS ---
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

  // --- GAMEPLAY HELPERS ---
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

  const prevHole = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  const nextHole = () => {
    if (currentHoleIndex < COURSE_DATA.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    } else {
      finishRound();
    }
  };

  const finishRound = async () => {
    if(!confirm("Finish round and submit scores?")) return;

    for (const player of players) {
      const playerScores = scores[player];
      
      let total = 0;
      Object.values(playerScores).forEach(s => total += s);

      const dataToSave: any = {
        player_name: player,
        tee_color: selectedTee,
        total_score: total,
      };

      COURSE_DATA.forEach(h => {
        dataToSave[`hole_${h.hole}`] = playerScores[h.hole] || h.par;
      });

      await supabase.from('scorecards').insert(dataToSave);
    }

    alert("Round Saved!");
    router.push('/');
  };

  // --- RENDER: SETUP SCREEN ---
  if (step === 1) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8">New Round Setup</h1>
        
        <div className="w-full max-w-md bg-white rounded-xl p-6 text-gray-800">
          <label className="block font-bold mb-2">Select Tees</label>
          <div className="flex gap-2 mb-6">
            {TEES.map(tee => (
              <button
                key={tee}
                onClick={() => setSelectedTee(tee)}
                className={`flex-1 py-2 rounded font-bold border-2 ${selectedTee === tee ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 border-gray-200'}`}
              >
                {tee}
              </button>
            ))}
          </div>

          <label className="block font-bold mb-2">Who is playing?</label>
          {players.map((p, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Player ${i + 1} Name`}
              value={p}
              onChange={(e) => updatePlayerName(i, e.target.value)}
              className="w-full p-3 mb-2 border rounded"
            />
          ))}
          <button onClick={addPlayer} className="text-green-600 font-bold text-sm mb-6">+ Add Another Player</button>

          <button onClick={startGame} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-xl">
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: PLAYING SCREEN ---
  const currentHole = COURSE_DATA[currentHoleIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      <div className="bg-green-800 p-4 rounded-xl mb-4 text-center">
        <h2 className="text-4xl font-bold">Hole {currentHole.hole}</h2>
        <div className="flex justify-center gap-6 mt-2 text-green-200 text-lg">
          <span>Par {currentHole.par}</span>
          <span>{currentHole.distance} ft</span>
        </div>
        <p className="mt-2 text-sm text-green-100 italic">{currentHole.info}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {players.map(player => {
          const s = scores[player][currentHole.hole] || currentHole.par;
          return (
            <div key={player} className="bg-white rounded-lg p-4 mb-3 flex items-center justify-between text-gray-800">
              <span className="font-bold text-xl truncate w-1/3">{player}</span>
              
              <div className="flex items-center gap-4">
                <button onClick={() => updateScore(player, -1)} className="w-12 h-12 bg-red-100 text-red-600 rounded-full text-2xl font-bold">-</button>
                <span className="text-3xl font-bold w-8 text-center">{s}</span>
                <button onClick={() => updateScore(player, 1)} className="w-12 h-12 bg-green-100 text-green-600 rounded-full text-2xl font-bold">+</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="mt-4 flex gap-3">
        {/* Only show PREV button if we are NOT on Hole 1 */}
        {currentHoleIndex > 0 && (
          <button 
            onClick={prevHole}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg"
          >
            &lt; Prev
          </button>
        )}
        
        <button 
          onClick={nextHole}
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg"
        >
          {currentHoleIndex < COURSE_DATA.length - 1 ? 'Next Hole >' : 'Finish Round'}
        </button>
      </div>
    </div>
  );
}