'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import Link from 'next/link';

export default function Profile() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetchMyRounds();
  }, []);

  async function fetchMyRounds() {
    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Should redirect to login ideally
    setUserEmail(user.email || '');

    // 2. Fetch Rounds created by this user
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('created_by_user', user.email)
      .order('created_at', { ascending: false }); // Newest first

    if (error) console.error('Error:', error);
    else setRounds(data || []);
    setLoading(false);
  }

  // Calculate quick stats
  const totalRounds = rounds.length;
  const bestScore = rounds.length > 0 ? Math.min(...rounds.map(r => r.total_score)) : '-';
  const averageScore = rounds.length > 0 
    ? (rounds.reduce((acc, cur) => acc + cur.total_score, 0) / totalRounds).toFixed(1) 
    : '-';

  return (
    <div className="min-h-screen bg-green-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/">
          <button className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
            &larr; Home
          </button>
        </Link>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="w-20"></div> 
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white text-gray-800 p-4 rounded-xl text-center shadow-lg">
          <div className="text-gray-500 text-xs font-bold uppercase">Rounds</div>
          <div className="text-3xl font-black text-green-700">{totalRounds}</div>
        </div>
        <div className="bg-white text-gray-800 p-4 rounded-xl text-center shadow-lg">
          <div className="text-gray-500 text-xs font-bold uppercase">Best</div>
          <div className="text-3xl font-black text-blue-600">{bestScore}</div>
        </div>
        <div className="bg-white text-gray-800 p-4 rounded-xl text-center shadow-lg">
          <div className="text-gray-500 text-xs font-bold uppercase">Avg</div>
          <div className="text-3xl font-black text-orange-600">{averageScore}</div>
        </div>
      </div>

      {/* Rounds History List */}
      <h2 className="text-xl font-bold mb-4 border-b border-green-700 pb-2">My History</h2>
      <div className="space-y-3">
        {rounds.map((round) => (
          <div key={round.id} className="bg-green-800 p-4 rounded-xl flex justify-between items-center shadow-md border border-green-700">
            <div>
              <div className="font-bold text-lg">{round.player_name}</div>
              <div className="text-xs text-green-300">
                {new Date(round.created_at).toLocaleDateString()} • {round.tee_color} Tees
              </div>
              {/* EDIT BUTTON */}
              <Link href={`/edit/${round.id}`}>
                <button className="mt-2 bg-black/20 hover:bg-black/40 text-xs px-3 py-1 rounded text-green-100 border border-green-600">
                  Edit Scores
                </button>
              </Link>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">{round.total_score}</div>
              <div className="text-xs text-green-300">Total</div>
            </div>
          </div>
        ))}
        {rounds.length === 0 && !loading && (
          <div className="text-center text-green-300 py-8 italic">No rounds played yet. Go hit the course!</div>
        )}
      </div>
    </div>
  );
}