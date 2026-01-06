'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'1v1' | '2v2' | '3v3'>('1v1');
  const [players, setPlayers] = useState(['', '', '', '', '', '']);

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    // This packs up the data and sends it to the scorecard
    const params = new URLSearchParams();
    params.set('mode', mode);
    players.forEach((p, i) => {
      if (p) params.set(`p${i}`, p);
    });
    router.push(`/play?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans flex flex-col items-center">
      
      {/* LOGO AREA */}
      <div className="mb-8 mt-4 relative w-64 h-24">
         <Image 
           src="/logo.png" 
           alt="Logo" 
           fill 
           className="object-contain"
           priority
         />
      </div>

      <h1 className="text-2xl font-black italic text-green-500 mb-6 text-center uppercase tracking-widest">
        Game Setup
      </h1>

      {/* MODE SELECTOR */}
      <div className="w-full max-w-md bg-zinc-900 p-2 rounded-2xl flex gap-2 mb-8 border border-zinc-800">
        {['1v1', '2v2', '3v3'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as any)}
            className={`flex-1 py-4 rounded-xl font-black transition-all uppercase tracking-wider ${
              mode === m 
                ? 'bg-green-600 text-black shadow-lg shadow-green-900/20' 
                : 'text-zinc-500 hover:bg-zinc-800'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* PLAYER INPUTS */}
      <div className="w-full max-w-md space-y-6 mb-10">
        
        {/* TEAM 1 (BLUE) */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border-l-4 border-blue-500">
          <h3 className="text-blue-500 font-bold text-xs uppercase mb-4 tracking-widest">Team One (Blue)</h3>
          <input 
            className="w-full bg-black border border-zinc-700 focus:border-blue-500 p-4 rounded-xl mb-3 font-bold outline-none text-white placeholder-zinc-600" 
            placeholder="Player 1 Name" 
            value={players[0]} 
            onChange={(e) => handlePlayerChange(0, e.target.value)} 
          />
          {(mode === '2v2' || mode === '3v3') && (
            <input 
              className="w-full bg-black border border-zinc-700 focus:border-blue-500 p-4 rounded-xl font-bold outline-none text-white placeholder-zinc-600" 
              placeholder="Player 2 Name" 
              value={players[1]} 
              onChange={(e) => handlePlayerChange(1, e.target.value)} 
            />
          )}
          {mode === '3v3' && (
             <input 
               className="w-full bg-black border border-zinc-700 focus:border-blue-500 p-4 rounded-xl mt-3 font-bold outline-none text-white placeholder-zinc-600" 
               placeholder="Player 3 Name" 
               value={players[2]} 
               onChange={(e) => handlePlayerChange(2, e.target.value)} 
             />
          )}
        </div>

        {/* TEAM 2 (RED) - Only shows for 2v2 or 3v3 unless you want 1v1 to show "Opponent" */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border-l-4 border-red-500">
          <h3 className="text-red-500 font-bold text-xs uppercase mb-4 tracking-widest">Team Two (Red)</h3>
          <input 
             className="w-full bg-black border border-zinc-700 focus:border-red-500 p-4 rounded-xl mb-3 font-bold outline-none text-white placeholder-zinc-600" 
             placeholder={mode === '1v1' ? "Player 2 Name" : (mode === '2v2' ? "Player 3 Name" : "Player 4 Name")} 
             value={players[mode === '1v1' ? 1 : (mode === '2v2' ? 2 : 3)]} 
             onChange={(e) => handlePlayerChange(mode === '1v1' ? 1 : (mode === '2v2' ? 2 : 3), e.target.value)} 
          />
          {(mode === '2v2' || mode === '3v3') && (
            <input 
              className="w-full bg-black border border-zinc-700 focus:border-red-500 p-4 rounded-xl font-bold outline-none text-white placeholder-zinc-600" 
              placeholder={mode === '2v2' ? "Player 4 Name" : "Player 5 Name"} 
              value={players[mode === '2v2' ? 3 : 4]} 
              onChange={(e) => handlePlayerChange(mode === '2v2' ? 3 : 4, e.target.value)} 
            />
          )}
          {mode === '3v3' && (
             <input 
               className="w-full bg-black border border-zinc-700 focus:border-red-500 p-4 rounded-xl mt-3 font-bold outline-none text-white placeholder-zinc-600" 
               placeholder="Player 6 Name" 
               value={players[5]} 
               onChange={(e) => handlePlayerChange(5, e.target.value)} 
             />
          )}
        </div>
      </div>

      <button 
        onClick={startGame}
        className="w-full max-w-md bg-green-600 hover:bg-green-500 text-black font-black py-5 rounded-2xl text-xl uppercase tracking-widest shadow-xl shadow-green-900/40 active:scale-95 transition-all"
      >
        Start Round
      </button>
    </div>
  );
}