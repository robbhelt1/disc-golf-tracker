'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import Link from 'next/link';

export default function Leaderboard() {
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Hidden admin toggle

  // Fetch data when page loads
  useEffect(() => {
    fetchScores();
  }, []);

  async function fetchScores() {
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .order('total_score', { ascending: true }); // Lowest score first

    if (error) console.error('Error fetching:', error);
    else setScorecards(data || []);
    setLoading(false);
  }

  // Admin Action: Delete a scorecard
  async function deleteScore(id: number) {
    if(!confirm("Are you sure you want to DELETE this round? This cannot be undone.")) return;

    const { error } = await supabase
      .from('scorecards')
      .delete()
      .eq('id', id);

    if (error) alert("Error deleting: " + error.message);
    else {
      alert("Round deleted.");
      fetchScores(); // Refresh the list
    }
  }

  // --- ANALYTICS ENGINE ---
  // We group all scorecards by player name to calculate stats
  const playerStats: any = {};

  scorecards.forEach(card => {
    const name = card.player_name;
    if (!playerStats[name]) {
      playerStats[name] = { 
        name, 
        rounds: 0, 
        totalStrokes: 0, 
        bestScore: 999,
        wins: 0 
      };
    }
    
    playerStats[name].rounds += 1;
    playerStats[name].totalStrokes += card.total_score;
    if (card.total_score < playerStats[name].bestScore) {
      playerStats[name].bestScore = card.total_score;
    }
  });

  // Convert object to array and sort by Average Score
  const leaderboardData = Object.values(playerStats).map((p: any) => ({
    ...p,
    average: (p.totalStrokes / p.rounds).toFixed(1)
  })).sort((a: any, b: any) => a.average - b.average);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-green-900 text-white p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/">
          <button className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
            &larr; Home
          </button>
        </Link>
        <h1 className="text-3xl font-bold text-center">Leaderboard</h1>
        <div className="w-20"></div> {/* Spacer to center title */}
      </div>

      {/* STATS CARDS (Top Players) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboardData.slice(0, 3).map((player: any, index) => (
          <div key={player.name} className={`p-4 rounded-xl shadow-lg text-center ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-white text-gray-800'}`}>
            <div className="text-4xl mb-2">{index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}</div>
            <h2 className="text-2xl font-bold">{player.name}</h2>
            <p className="font-bold text-xl mt-1">Avg: {player.average}</p>
            <p className="text-sm opacity-80">Best: {player.bestScore}</p>
          </div>
        ))}
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden text-gray-800 mb-8">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-4">Player</th>
              <th className="p-4 text-center">Rounds</th>
              <th className="p-4 text-center">Avg</th>
              <th className="p-4 text-center">Best</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((player: any, i) => (
              <tr key={player.name} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold">{i + 1}. {player.name}</td>
                <td className="p-4 text-center">{player.rounds}</td>
                <td className="p-4 text-center font-bold text-green-700">{player.average}</td>
                <td className="p-4 text-center">{player.bestScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECENT ROUNDS (Admin Area) */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-green-100">Recent Rounds History</h2>
          
          {/* SECRET ADMIN TOGGLE */}
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className="text-xs text-green-800 hover:text-green-200 uppercase tracking-widest"
          >
            {isAdmin ? 'Exit Admin' : 'Admin Login'}
          </button>
        </div>

        <div className="bg-green-800 rounded-xl p-4">
          {scorecards.map((card) => (
            <div key={card.id} className="flex justify-between items-center border-b border-green-700 py-3 last:border-0">
              <div>
                <span className="font-bold text-lg text-white">{card.player_name}</span>
                <span className="ml-3 text-green-300 text-sm">{new Date(card.created_at).toLocaleDateString()}</span>
                <div className="text-xs text-green-400 mt-1">
                  Tee: {card.tee_color} | Total: {card.total_score}
                </div>
              </div>

              {/* DELETE BUTTON (Only visible if Admin is ON) */}
              {isAdmin && (
                <button 
                  onClick={() => deleteScore(card.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                >
                  DELETE
                </button>
              )}
              
              {!isAdmin && (
                <span className="text-2xl font-bold text-white">{card.total_score}</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}