'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import { COURSE_DATA, TEES } from '@/courseData';
import Link from 'next/link';
import Image from 'next/image';

// Types for Team Logic
type Team = {
  name: string;
  members: string[];
};

export default function Play() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- USER DIRECTORY ---
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  
  // --- GAME CONFIG ---
  const MODES = ['Stroke Play', 'Match Play', 'Doubles (2v2)', 'Triples (3v3)'];
  const [gameMode, setGameMode] = useState('Stroke Play');
  const [selectedTee, setSelectedTee] = useState('White');
  
  // --- PLAYERS & TEAMS STATE ---
  const [players, setPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // --- SCORING STATE ---
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});
  
  const [step, setStep] = useState(1);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0); 
  const [saving, setSaving] = useState(false);

  // --- INIT ---
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      setLoadingUser(false);

      const { data: profiles } = await supabase.from('profiles').select('email, first_name').neq('email', user.email); 
      if (profiles) setRegisteredUsers(profiles);
      
      const { data: myProfile } = await supabase.from('profiles').select('first_name').eq('email', user.email).single();
      const myName = myProfile?.first_name || user.email?.split('@')[0] || 'Me';
      
      setPlayers(prev => prev.length === 0 ? [myName] : prev);
    }
    init();
  }, [router]);

  // --- HELPER: IS TEAM MODE? ---
  const isTeamMode = gameMode.includes('Doubles') || gameMode.includes('Triples');

  // --- SCORING ENGINES ---
  const getIndividualStats = (player: string) => {
    const playerScores = scores[player] || {};
    let total = 0; let par = 0;
    COURSE_DATA.forEach(h => {
      if (playerScores[h.hole] && playerScores[h.hole] > 0) {
        total += playerScores[h.hole]; par += h.par;
      }
    });
    const rel = total - par;
    const displayRel = rel > 0 ? `+${rel}` : rel === 0 ? "E" : `${rel}`;
    return { total, displayRel, rel };
  };

  const getTeamStats = (team: Team) => {
    let teamTotal = 0; let teamPar = 0; let currentHoleScore = 99; 
    COURSE_DATA.forEach(h => {
      const memberScores = team.members.map(m => scores[m]?.[h.hole] || 0);
      const playedScores = memberScores.filter(s => s > 0);
      if (playedScores.length > 0) {
        const bestBall = Math.min(...playedScores);
        teamTotal += bestBall; teamPar += h.par;
      }
    });
    const currentHoleNum = COURSE_DATA[currentHoleIndex].hole;
    const currentMemberScores = team.members.map(m => scores[m]?.[currentHoleNum] || COURSE_DATA[currentHoleIndex].par);
    currentHoleScore = Math.min(...currentMemberScores);
    const rel = teamTotal - teamPar;
    const displayRel = rel > 0 ? `+${rel}` : rel === 0 ? "E" : `${rel}`;
    return { teamTotal, displayRel, rel, currentHoleScore };
  };

  const calculateMatchStandings = () => {
    if (gameMode !== 'Match Play') return { points: {}, currentPot: 0 };
    const points: Record<string, number> = {};
    players.forEach(p => points[p] = 0);
    let currentPot = 1;
    COURSE_DATA.forEach((h) => {
      const holeScores = players.map(p => ({ name: p, score: scores[p]?.[h.hole] || 0 }));
      if (holeScores.some(x => x.score === 0)) return; 
      const minScore = Math.min(...holeScores.map(x => x.score));
      const winners = holeScores.filter(x => x.score === minScore);
      if (winners.length === 1) { points[winners[0].name] += currentPot; currentPot = 1; } 
      else { currentPot += 1; }
    });
    return { points, currentPot };
  };
  const matchStandings = calculateMatchStandings();

  const getLiveRankings = () => {
    if (isTeamMode) {
      return teams.map(t => {
        const stats = getTeamStats(t);
        return { name: t.name, score: stats.displayRel, sortVal: stats.rel, detail: stats.teamTotal };
      }).sort((a, b) => a.sortVal - b.sortVal);
    } else if (gameMode === 'Match Play') {
      return players.map(p => ({
        name: p, score: `${matchStandings.points[p] || 0} Pts`, sortVal: matchStandings.points[p] || 0, detail: ''
      })).sort((a, b) => b.sortVal - a.sortVal);
    } else {
      return players.map(p => {
        const stats = getIndividualStats(p);
        return { name: p, score: stats.displayRel, sortVal: stats.rel, detail: stats.total };
      }).sort((a, b) => a.sortVal - b.sortVal);
    }
  };
  const liveRankings = getLiveRankings();

  // --- ACTIONS ---
  const addTeam = () => {
    const size = gameMode.includes('Doubles') ? 2 : 3;
    const teamName = prompt(`Enter Team Name (e.g. 'Team Alpha'):`);
    if (!teamName) return;
    const newMembers = [];
    for(let i=0; i<size; i++) {
       const mName = prompt(`Enter Player ${i+1} Name for ${teamName}:`);
       newMembers.push(mName || `${teamName} P${i+1}`);
    }
    setTeams([...teams, { name: teamName, members: newMembers }]);
    const newScores = { ...scores };
    newMembers.forEach(m => newScores[m] = {});
    setScores(newScores);
  };
  const removeTeam = (index: number) => setTeams(teams.filter((_, i) => i !== index));
  const addSoloPlayer = () => {
    if (!selectedUserToAdd || players.includes(selectedUserToAdd)) return;
    setPlayers([...players, selectedUserToAdd]); setSelectedUserToAdd(''); 
  };
  const addManualSolo = () => {
    const name = prompt("Guest Name:");
    if (name && !players.includes(name)) setPlayers([...players, name]);
  };
  const startGame = () => {
    if (isTeamMode && teams.length < 2) return alert("You need at least 2 teams!");
    if (!isTeamMode && players.length < 1) return alert("Add at least one player!");
    setStep(2);
  };
  const updateScore = (player: string, change: number) => {
    const currentHoleNum = COURSE_DATA[currentHoleIndex].hole;
    const currentScore = scores[player]?.[currentHoleNum] || COURSE_DATA[currentHoleIndex].par;
    setScores({ ...scores, [player]: { ...(scores[player] || {}), [currentHoleNum]: currentScore + change } });
  };
  const finishRound = async () => {
    if(!confirm("Finish round and submit scores?")) return;
    setSaving(true);
    const dataToInsert = [];
    if (isTeamMode) {
      for (const team of teams) {
        const { teamTotal } = getTeamStats(team);
        const row: any = { player_name: team.name, tee_color: selectedTee, total_score: teamTotal, game_mode: gameMode, created_by_user: user.email };
        COURSE_DATA.forEach(h => {
          const memberScores = team.members.map(m => scores[m]?.[h.hole] || h.par);
          row[`hole_${h.hole}`] = Math.min(...memberScores);
        });
        dataToInsert.push(row);
      }
    } else {
      for (const player of players) {
         const { total } = getIndividualStats(player);
         const row: any = { player_name: player, tee_color: selectedTee, total_score: total, game_mode: gameMode, created_by_user: user.email };
         COURSE_DATA.forEach(h => { row[`hole_${h.hole}`] = scores[player]?.[h.hole] || h.par; });
         dataToInsert.push(row);
      }
    }
    await supabase.from('scorecards').insert(dataToInsert);
    setSaving(false); setStep(3);
  };
  const nextHole = () => currentHoleIndex < COURSE_DATA.length - 1 ? setCurrentHoleIndex(currentHoleIndex + 1) : finishRound();
  const prevHole = () => currentHoleIndex > 0 && setCurrentHoleIndex(currentHoleIndex - 1);

  if (loadingUser) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white font-bold">Loading...</div>;

  // --- MAX WIDTH WRAPPER FOR ALL VIEWS ---
  const Container = ({ children }: any) => (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center">
      <div className="w-full max-w-md bg-gray-900 flex flex-col relative shadow-2xl min-h-screen">
        {children}
      </div>
    </div>
  );

  // --- VIEW 1: SETUP ---
  if (step === 1) {
    const availableToAdd = registeredUsers.filter(u => !players.includes(u.first_name || u.email.split('@')[0]));
    return (
      <Container>
        <div className="p-6 flex flex-col items-center">
          <Image src="/logo.png" width={100} height={100} alt="Logo" className="mb-4 rounded-full shadow-lg" />
          <h1 className="text-2xl font-bold mb-4">Round Setup</h1>
          <div className="w-full bg-white rounded-xl p-6 text-gray-800 shadow-lg">
            <label className="block font-bold mb-2 text-sm uppercase text-gray-500">Game Mode</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MODES.map(m => (
                <button key={m} onClick={() => setGameMode(m)} className={`py-2 px-1 text-xs rounded border-2 font-bold ${gameMode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50'}`}>{m}</button>
              ))}
            </div>
            <label className="block font-bold mb-2 text-sm uppercase text-gray-500">Tees</label>
            <div className="flex gap-2 mb-4">
              {TEES.map(tee => (
                <button key={tee} onClick={() => setSelectedTee(tee)} className={`flex-1 py-2 rounded border-2 font-bold text-sm ${selectedTee === tee ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50'}`}>{tee}</button>
              ))}
            </div>
            <div className="mb-6">
               <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm uppercase text-gray-500">{isTeamMode ? "Teams" : "Players"}</label>
                  {isTeamMode ? (
                     <button onClick={addTeam} className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700">+ Add Team</button>
                  ) : (
                     <button onClick={addManualSolo} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Manual</button>
                  )}
               </div>
               {!isTeamMode ? (
                  <>
                    <div className="flex gap-2 mb-2">
                       <select className="flex-1 p-2 border rounded text-sm" value={selectedUserToAdd} onChange={(e) => setSelectedUserToAdd(e.target.value)}>
                          <option value="">Select User...</option>
                          {availableToAdd.map((u: any) => <option key={u.email} value={u.first_name || u.email.split('@')[0]}>{u.first_name || u.email.split('@')[0]}</option>)}
                       </select>
                       <button onClick={addSoloPlayer} className="bg-green-600 text-white px-3 rounded font-bold text-sm">Add</button>
                    </div>
                    <div className="space-y-2">
                       {players.map((p, i) => (
                          <div key={i} className="flex justify-between bg-gray-50 p-2 rounded border text-sm font-bold">{p} <button onClick={() => setPlayers(players.filter((_,x) => x!==i))} className="text-red-500 font-bold">x</button></div>
                       ))}
                    </div>
                  </>
               ) : (
                  <div className="space-y-2">
                     {teams.map((t, i) => (
                        <div key={i} className="bg-blue-50 p-2 rounded border border-blue-200">
                           <div className="flex justify-between font-bold text-blue-800 text-sm"><span>{t.name}</span><button onClick={() => removeTeam(i)} className="text-red-500 text-xs">Remove</button></div>
                           <div className="text-xs text-gray-600">{t.members.join(', ')}</div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            <button onClick={startGame} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-lg shadow-lg">Start Game</button>
          </div>
        </div>
      </Container>
    );
  }

  // --- VIEW 3: SUMMARY ---
  if (step === 3) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center text-gray-800 w-full">
            <h1 className="text-2xl font-bold text-green-800 mb-2">Round Complete!</h1>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
               {liveRankings.map((r, i) => (
                  <div key={i} className="flex justify-between border-b py-2 last:border-0 text-sm">
                     <span className="font-bold">{r.name}</span>
                     <span className="font-bold text-green-700">{r.score}</span>
                  </div>
               ))}
            </div>
            <Link href="/leaderboard"><button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mb-2">Leaderboard</button></Link>
            <Link href="/"><button className="text-gray-400 font-bold text-sm">Home</button></Link>
          </div>
        </div>
      </Container>
    );
  }

  // --- VIEW 2: PLAYING (COMPACTED) ---
  const currentHole = COURSE_DATA[currentHoleIndex];
  const distRed = currentHole.distances?.red || 0;
  const distWhite = currentHole.distances?.white || 0;
  const distBlue = currentHole.distances?.blue || 0;

  return (
    <Container>
      <div className="flex flex-col h-[calc(100vh-64px)]"> {/* Subtract Navbar height */}
        
        {/* COMPACT HEADER */}
        <div className="bg-green-800 p-3 shadow-lg border-b border-green-700 z-10"> 
          <div className="flex justify-between items-end mb-2">
             <div>
               <h2 className="text-2xl font-black uppercase leading-none">Hole {currentHole.hole}</h2>
               <div className="text-green-300 font-bold text-sm">Par {currentHole.par}</div>
             </div>
             {gameMode === 'Match Play' && (
                <div className="bg-yellow-500 text-black font-bold px-2 py-1 rounded text-xs">Pot: {matchStandings.currentPot}</div>
             )}
          </div>
          <div className="flex gap-1 text-center text-[10px] font-bold uppercase tracking-wider">
             <div className="flex-1 bg-red-800/50 p-1 rounded text-red-100 border border-red-500/30">Red: {distRed}</div>
             <div className="flex-1 bg-white/10 text-gray-100 p-1 rounded border border-white/20">White: {distWhite}</div>
             <div className="flex-1 bg-blue-800/50 p-1 rounded text-blue-100 border border-blue-500/30">Blue: {distBlue}</div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          
          {/* MAP (Slightly shorter) */}
          <div className="w-full h-40 bg-gray-800 relative border-b border-gray-700 shadow-inner">
            {currentHole.image ? (
              <Image src={currentHole.image} alt="Map" fill className="object-cover" />
            ) : <div className="flex items-center justify-center h-full text-gray-500 font-bold text-sm">No Map</div>}
             <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1">
                <p className="text-xs italic text-gray-200 truncate">{currentHole.info}</p>
             </div>
          </div>

          {/* PLAYERS LIST */}
          <div className="p-3 space-y-3">
            {isTeamMode ? (
              teams.map((team, idx) => {
                  const { currentHoleScore, displayRel } = getTeamStats(team);
                  return (
                    <div key={idx} className="bg-white rounded-lg overflow-hidden shadow text-gray-800 border-l-4 border-blue-600">
                        <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b">
                          <span className="font-bold text-blue-900 truncate">{team.name}</span>
                          <div className="text-right leading-none">
                              <span className="block font-black text-xl">{currentHoleScore}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-bold">Best Ball</span>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {team.members.map(member => (
                              <div key={member} className="flex justify-between items-center">
                                <span className="text-xs font-bold w-20 truncate">{member}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateScore(member, -1)} className="w-8 h-8 bg-red-100 text-red-600 rounded-full font-bold flex items-center justify-center pb-0.5">-</button>
                                    <span className="font-bold w-6 text-center">{scores[member]?.[currentHole.hole] || currentHole.par}</span>
                                    <button onClick={() => updateScore(member, 1)} className="w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold flex items-center justify-center pb-0.5">+</button>
                                </div>
                              </div>
                          ))}
                        </div>
                    </div>
                  )
              })
            ) : (
              players.map(player => {
                const s = scores[player]?.[currentHole.hole] || currentHole.par;
                return (
                  <div key={player} className="bg-white rounded-lg p-3 flex justify-between items-center text-gray-800 shadow">
                    <div className="font-bold text-base truncate w-24">{player}</div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateScore(player, -1)} className="w-10 h-10 bg-red-100 text-red-600 rounded-full text-xl font-bold flex items-center justify-center pb-1 shadow-sm border border-red-200">-</button>
                      <span className="text-3xl font-black w-8 text-center">{s}</span>
                      <button onClick={() => updateScore(player, 1)} className="w-10 h-10 bg-green-100 text-green-600 rounded-full text-xl font-bold flex items-center justify-center pb-1 shadow-sm border border-green-200">+</button>
                    </div>
                  </div>
                )
              })
            )}

            {/* --- MOVED NAVIGATION BUTTONS HERE --- */}
            <div className="flex gap-3 my-4">
              {currentHoleIndex > 0 && (
                <button onClick={prevHole} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl shadow-lg border border-gray-600 active:scale-95 transition-transform">
                   &lt; Prev
                </button>
              )}
              <button 
                 onClick={nextHole} 
                 disabled={saving} 
                 className={`flex-[3] text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform ${saving ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                 {saving ? 'Saving...' : (currentHoleIndex < 17 ? 'Next Hole >' : 'Finish Round')}
              </button>
            </div>

            {/* LIVE STANDINGS */}
            <div className="mt-6">
              <div className="bg-gray-800 rounded-t-lg p-1 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest border border-gray-700 border-b-0">
                  Live Standings
              </div>
              <div className="bg-white rounded-b-lg overflow-hidden shadow border border-gray-300">
                  <table className="w-full text-xs text-gray-800">
                    <tbody>
                        {liveRankings.map((r, i) => (
                          <tr key={i} className={`border-b last:border-0 ${i === 0 ? 'bg-yellow-50' : ''}`}>
                              <td className="py-2 px-3 font-bold text-gray-400 w-6 text-center">{i + 1}</td>
                              <td className="py-2 px-1 font-bold truncate">{r.name}</td>
                              <td className={`py-2 px-3 font-black text-right ${r.score.toString().includes('+') ? 'text-red-500' : r.score.toString().includes('-') ? 'text-green-600' : 'text-gray-800'}`}>
                                {r.score}
                              </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Container>
  );
}