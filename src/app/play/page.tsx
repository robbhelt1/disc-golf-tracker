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

  // --- USER DIRECTORY STATE ---
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [players, setPlayers] = useState<string[]>([]); 
  
  // --- GAME MODES ---
  const MODES = ['Stroke Play', 'Match Play'];
  const [gameMode, setGameMode] = useState('Stroke Play');

  // --- INIT ---
  useEffect(() => {
    async function init() {
      // 1. Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); 
        return;
      }
      setUser(user);
      setLoadingUser(false);

      // 2. Fetch User Directory
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, first_name')
        .neq('email', user.email); 
      
      if (profiles) setRegisteredUsers(profiles);
      
      // Auto-add MYSELF
      const { data: myProfile } = await supabase.from('profiles').select('first_name').eq('email', user.email).single();
      const myName = myProfile?.first_name || user.email?.split('@')[0] || 'Me';
      setPlayers((prev) => prev.length === 0 ? [myName] : prev);
    }
    init();
  }, [router]);

  // --- GAME STATE ---
  const [step, setStep] = useState(1);
  const [selectedTee, setSelectedTee] = useState('White');
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0); 
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});
  const [saving, setSaving] = useState(false);

  // --- SCORING ENGINES ---

  // 1. STROKE PLAY (Standard)
  const getStrokeStats = (player: string) => {
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

    return { 
      mainScore: totalStrokes, 
      subScore: `(${displayRel})`, 
      relativeScore 
    };
  };

  // 2. MATCH PLAY (Skins / Carry-over)
  // Logic: Iterate through all completed holes. 
  // If a player has the UNIQUE lowest score, they win the "Pot".
  // If tied for lowest, "Pot" increases for next hole.
  const calculateMatchStandings = () => {
    const points: Record<string, number> = {};
    players.forEach(p => points[p] = 0);
    
    let currentPot = 1;

    // Loop through all holes up to current
    COURSE_DATA.forEach((h, index) => {
      // Stop if we haven't played this hole yet (unless we are on it right now, check if scores exist)
      // Actually, only calc completed holes or current if scores entered?
      // Let's calc for ALL holes that have scores for everyone.
      
      const holeScores = players.map(p => ({ 
        name: p, 
        score: scores[p]?.[h.hole] || 0 
      }));

      // If anyone has a 0 (unplayed), stop calculating
      if (holeScores.some(x => x.score === 0)) return;

      // Find lowest score
      const minScore = Math.min(...holeScores.map(x => x.score));
      
      // Who got that score?
      const winners = holeScores.filter(x => x.score === minScore);

      if (winners.length === 1) {
        // ONE WINNER -> They take the pot
        points[winners[0].name] += currentPot;
        currentPot = 1; // Reset pot
      } else {
        // TIE -> Pot carries over
        currentPot += 1;
      }
    });

    return { points, currentPot };
  };

  const matchStandings = calculateMatchStandings();

  // --- WRAPPER TO GET STATS BASED ON MODE ---
  const getPlayerDisplayStats = (player: string) => {
    if (gameMode === 'Stroke Play') {
      return getStrokeStats(player);
    } else {
      // Match Play
      const pts = matchStandings.points[player] || 0;
      return {
        mainScore: pts,
        subScore: "Points",
        relativeScore: -pts // Invert for color logic (Higher points = Green/Good)
      };
    }
  };


  // --- ACTIONS ---
  const addPlayerFromList = () => {
    if (!selectedUserToAdd) return;
    if (!players.includes(selectedUserToAdd)) {
      setPlayers([...players, selectedUserToAdd]);
      setSelectedUserToAdd(''); 
    }
  };

  const addManualPlayer = () => {
    const name = prompt("Enter Guest Name:");
    if (name && !players.includes(name)) {
      setPlayers([...players, name]);
    }
  };

  const removePlayer = (indexToRemove: number) => {
    setPlayers(players.filter((_, i) => i !== indexToRemove));
  };

  const startGame = () => {
    if (players.length === 0) return alert("Add at least one player!");
    const initialScores: any = {};
    players.forEach(p => initialScores[p] = {});
    setScores(initialScores);
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
        total_score: total, // We still save strokes for history
        game_mode: gameMode, // <--- NEW FIELD
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

  // --- USER BADGE ---
  const UserBadge = () => (
    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg z-50 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
      <span className="text-xs text-white font-medium tracking-wide">
        {players[0] || 'Me'}
      </span>
    </div>
  );

  if (loadingUser) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white font-bold">Loading...</div>;

  // --- VIEW 1: SETUP ---
  if (step === 1) {
    const availableToAdd = registeredUsers.filter(u => {
      const displayName = u.first_name || u.email.split('@')[0];
      return !players.includes(displayName);
    });

    return (
      <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center relative">
        <UserBadge /> 
        <Image src="/logo.png" width={120} height={120} alt="Logo" className="mb-4 rounded-full shadow-lg" />
        <h1 className="text-3xl font-bold mb-6">New Round Setup</h1>
        
        <div className="w-full max-w-md bg-white rounded-xl p-6 text-gray-800 shadow-2xl">
          
          {/* GAME MODE SELECTOR */}
          <label className="block font-bold mb-2">Game Mode</label>
          <div className="flex gap-2 mb-6">
            {MODES.map(m => (
              <button 
                key={m} 
                onClick={() => setGameMode(m)} 
                className={`flex-1 py-3 rounded-lg font-bold border-2 ${gameMode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400'}`}
              >
                {m}
              </button>
            ))}
          </div>
          {gameMode === 'Match Play' && (
            <p className="text-sm text-gray-500 mb-6 italic bg-blue-50 p-2 rounded border border-blue-100">
              ℹ️ <strong>Rules:</strong> Lowest score wins the hole. Ties carry over to the next hole (Skins).
            </p>
          )}

          <label className="block font-bold mb-2">Select Tees</label>
          <div className="flex gap-2 mb-6">
            {TEES.map(tee => (
              <button key={tee} onClick={() => setSelectedTee(tee)} className={`flex-1 py-3 rounded-lg font-bold border-2 ${selectedTee === tee ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50'}`}>{tee}</button>
            ))}
          </div>

          <label className="block font-bold mb-2">Current Players</label>
          <div className="bg-gray-50 rounded-lg p-2 mb-4 space-y-2">
            {players.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-gray-100">
                <span className="font-bold text-lg">{p}</span>
                {i > 0 && <button onClick={() => removePlayer(i)} className="text-red-500 text-sm font-bold">Remove</button>}
              </div>
            ))}
          </div>

          <label className="block font-bold mb-2">Add From Directory</label>
          <div className="flex gap-2 mb-4">
            <select className="flex-1 p-3 border-2 rounded-lg bg-white" value={selectedUserToAdd} onChange={(e) => setSelectedUserToAdd(e.target.value)}>
              <option value="">-- Select a User --</option>
              {availableToAdd.map((u: any) => {
                 const name = u.first_name || u.email.split('@')[0];
                 return <option key={u.email} value={name}>{name}</option>
              })}
            </select>
            <button onClick={addPlayerFromList} disabled={!selectedUserToAdd} className="bg-green-600 text-white px-4 rounded-lg font-bold">Add</button>
          </div>

          <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg mt-4">Start Game</button>
        </div>
      </div>
    );
  }

  // --- VIEW 3: SUMMARY ---
  if (step === 3) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center justify-center relative">
        <UserBadge /> 
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-center text-gray-800">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2 text-green-800">Round Complete!</h1>
          <p className="text-gray-500 mb-6">Mode: {gameMode}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {players.map(player => {
              const stats = getPlayerDisplayStats(player);
              return (
                <div key={player} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-3">
                  <span className="font-bold text-lg">{player}</span>
                  <div className="text-right">
                    <span className="block font-bold text-2xl text-green-700">{stats.mainScore}</span>
                    <span className="text-sm text-gray-400">{gameMode === 'Match Play' ? 'Points Won' : stats.subScore}</span>
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

  // --- VIEW 2: PLAYING ---
  const currentHole = COURSE_DATA[currentHoleIndex];
  const distRed = currentHole.distances?.red || 0;
  const distWhite = currentHole.distances?.white || 0;
  const distBlue = currentHole.distances?.blue || 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col relative">
      <UserBadge /> 
      
      <div className="bg-green-800 p-4 rounded-xl mb-4 shadow-lg border border-green-700 mt-8"> 
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white p-1 rounded-full shadow-md">
            <Image src="/logo.png" width={60} height={60} alt="Logo" className="rounded-full" />
          </div>
          <div>
             <h2 className="text-4xl font-black uppercase tracking-tight">Hole {currentHole.hole}</h2>
             <div className="text-green-200 font-bold text-xl">Par {currentHole.par}</div>
          </div>
        </div>

        {/* MATCH PLAY POT INDICATOR */}
        {gameMode === 'Match Play' && (
           <div className="bg-yellow-500 text-black font-bold p-2 rounded-lg text-center mb-4 shadow-md">
              <span className="text-sm uppercase tracking-wide">Hole Value (Pot)</span>
              <div className="text-2xl">{matchStandings.currentPot} Points</div>
              <div className="text-xs font-normal">Ties carry over to next hole!</div>
           </div>
        )}

        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-red-700 rounded-lg p-2 text-center border border-red-500 shadow-sm">
             <div className="text-xs uppercase font-bold text-red-200">Red</div>
             <div className="text-lg font-black">{distRed}</div>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-2 text-center border border-gray-300 shadow-sm">
             <div className="text-xs uppercase font-bold text-gray-500">White</div>
             <div className="text-lg font-black text-gray-800">{distWhite}</div>
          </div>
          <div className="flex-1 bg-blue-700 rounded-lg p-2 text-center border border-blue-500 shadow-sm">
             <div className="text-xs uppercase font-bold text-blue-200">Blue</div>
             <div className="text-lg font-black">{distBlue}</div>
          </div>
        </div>
        <div className="bg-green-900/50 p-4 rounded-lg border border-green-600">
           <p className="text-xl font-medium leading-relaxed text-white">{currentHole.info}</p>
        </div>
      </div>

      <div className="mb-4 w-full h-64 md:h-80 bg-gray-800 rounded-xl overflow-hidden relative shadow-2xl border-2 border-gray-700">
        {currentHole.image ? (
          <Image src={currentHole.image} alt={`Map of Hole ${currentHole.hole}`} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500"><span className="font-bold">No Map Image</span></div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {players.map(player => {
          const s = scores[player][currentHole.hole] || currentHole.par;
          
          // DYNAMIC STATS (Stroke or Match)
          const stats = getPlayerDisplayStats(player);
          
          let scoreColor = "text-gray-500";
          if (stats.relativeScore < 0) scoreColor = "text-green-600"; // Good
          if (stats.relativeScore > 0) scoreColor = "text-red-500";   // Bad (or low points)

          return (
            <div key={player} className="bg-white rounded-xl p-3 flex flex-col text-gray-800 shadow-md">
              <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                <span className="font-bold text-xl truncate max-w-[50%]">{player}</span>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                   {/* In Match Play, this shows Points */}
                   <span className={`font-black ${scoreColor} text-lg`}>{stats.mainScore}</span>
                   <span className="text-gray-500 text-sm font-bold">{stats.subScore}</span>
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