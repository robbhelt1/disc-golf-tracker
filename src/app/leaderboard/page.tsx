'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import Link from 'next/link';

// *** ADMIN CONFIGURATION ***
const ADMIN_EMAIL = 'helt@oncuetech.com'; 
// ***************************

export default function Leaderboard() {
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // --- FILTER STATE ---
  const [filterTee, setFilterTee] = useState('All'); // 'All', 'Red', 'White', 'Blue'

  useEffect(() => {
    fetchScores();
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email === ADMIN_EMAIL) {
      setIsAdmin(true);
    }
  }

  async function fetchScores() {
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .order('created_at', { ascending: false }); // Get newest first for the history list

    if (error) console.error('Error fetching:', error);
    else setScorecards(data || []);
    setLoading(false);
  }

  async function deleteScore(id: number) {
    if(!confirm("Are you sure you want to DELETE this round? This cannot be undone.")) return;
    const { error } = await supabase.from('scorecards').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else {
      alert("Round deleted.");
      fetchScores();
    }
  }

  // --- ANALYTICS ENGINE ---
  const playerStats: any = {};

  // 1. Filter the raw list based on the dropdown
  const filteredScorecards = scorecards.filter(card => {
    if (filterTee === 'All') return true;
    return card.tee_color === filterTee;
  });

  // 2. Calculate stats on the filtered list
  filteredScorecards.forEach(card => {
    const name = card.player_name;
    if (!playerStats[name]) {
      playerStats[name] = { name, rounds: 0, totalStrokes: 0, bestScore: 999 };
    }
    playerStats[name].rounds += 1;
    playerStats[name].totalStrokes += card.total_score;
    if (card.total_score < playerStats[name].bestScore) playerStats[name].bestScore = card.total_score;
  });

  // 3. Sort by Average Score (Ascending)
  const leaderboardData = Object.values(playerStats).map((p: any) => ({
    ...p,
    average: (p.totalStrokes / p.rounds).toFixed(1)
  })).sort((a: any, b: any) => a.average - b.average);

  return (
    <div className="min-h-screen bg-green-900 text-white p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/">
          <button className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg">&larr; Home</button>
        </Link>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <div className="w-16"></div>
      </div>

      {/* --- FILTER DROPDOWN --- */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-2 rounded-xl shadow-lg flex items-center gap-3">
          <span className="text-gray-500 font-bold text-sm uppercase pl-2">Filter Tees:</span>
          <select 
            value={filterTee}
            onChange={(e) => setFilterTee(e.target.value)}
            className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-lg outline-none cursor-pointer"
          >
            <option value="All">Show All</option>
            <option value="Red">Red</option>
            <option value="White">White</option>
            <option value="Blue">Blue</option>
          </select>
        </div>
      </div>

      {/* TOP 3 STATS CARDS */}
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

      {/* DETAILED RANKING TABLE */}
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
            {leaderboardData.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 font-bold">No rounds found for {filterTee} Tees.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RECENT ROUNDS HISTORY (With Admin Controls) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-green-100 mb-4">Recent Rounds ({filterTee})</h2>
        <div className="bg-green-800 rounded-xl p-4">
          {filteredScorecards.map((card) => (
            <div key={card.id} className="flex justify-between items-center border-b border-green-700 py-3 last:border-0">
              <div>
                <span className="font-bold text-lg text-white">{card.player_name}</span>
                <span className="ml-3 text-green-300 text-sm">{new Date(card.created_at).toLocaleDateString()}</span>
                <div className="text-xs text-green-400 mt-1">
                  {card.tee_color} Tees | Total: {card.total_score}
                </div>
              </div>

              {/* ADMIN CONTROLS: EDIT & DELETE */}
              {isAdmin && (
                <div className="flex gap-2">
                  <Link href={`/edit/${card.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold shadow-md">
                      EDIT
                    </button>
                  </Link>
                  <button 
                    onClick={() => deleteScore(card.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold shadow-md"
                  >
                    DELETE
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredScorecards.length === 0 && (
             <div className="text-center text-green-300 italic">No history found.</div>
          )}
        </div>
      </div>
    </div>
  );
}