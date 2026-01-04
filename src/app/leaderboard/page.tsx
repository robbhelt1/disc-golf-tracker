'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { TEES } from '@/courseData';
import Link from 'next/link';
import Image from 'next/image';

export default function Leaderboard() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTee, setFilterTee] = useState('All');
  const [profiles, setProfiles] = useState<any>({}); 

  useEffect(() => {
    fetchData();
  }, [filterTee]);

  async function fetchData() {
    setLoading(true);
    
    // 1. Fetch Rounds
    let query = supabase
      .from('scorecards')
      .select('*')
      .order('total_score', { ascending: true });

    if (filterTee !== 'All') {
      query = query.eq('tee_color', filterTee);
    }

    const { data: roundData } = await query;
    
    // 2. Fetch Profiles with the correct columns
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, avatar_url');

    const profileMap: any = {};
    if (profileData) {
      profileData.forEach((p: any) => {
        // Use first_name as the key to match scorecard's player_name
        if(p.first_name) profileMap[p.first_name] = p.avatar_url;
      });
    }
    setProfiles(profileMap);
    setRounds(roundData || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-green-900 text-white p-4 pb-20 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">🏆 Leaderboard</h1>

      <div className="flex gap-2 mb-6 w-full max-w-md overflow-x-auto pb-2">
        <button onClick={() => setFilterTee('All')} className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap ${filterTee === 'All' ? 'bg-white text-green-900' : 'bg-green-800 text-green-200'}`}>All Tees</button>
        {TEES.map(t => (
          <button key={t} onClick={() => setFilterTee(t)} className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap ${filterTee === t ? 'bg-white text-green-900' : 'bg-green-800 text-green-200'}`}>{t}</button>
        ))}
      </div>

      <div className="w-full max-w-md space-y-3">
        {loading ? (
          <div className="text-center text-green-200 animate-pulse">Loading scores...</div>
        ) : (
          rounds.map((round, index) => {
             const avatar = profiles[round.player_name];

             return (
              <div key={round.id} className="bg-white text-gray-800 p-4 rounded-xl shadow-lg flex items-center justify-between relative group">
                <div className="font-black text-2xl text-gray-300 w-8 text-center italic">{index + 1}</div>
                <div className="flex-1 px-4 flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    {/* Check if avatar exists and isn't just an empty string */}
                    {avatar && avatar.trim() !== "" ? (
                      <Image 
                        src={avatar} 
                        alt={round.player_name} 
                        fill 
                        className="rounded-full object-cover border-2 border-gray-200"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs border-2 border-green-200">
                        {round.player_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight">{round.player_name}</div>
                    <div className="text-xs text-gray-500 font-bold uppercase">{round.tee_color} Tees • {new Date(round.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-green-600 leading-none">{round.total_score}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</div>
                </div>
              </div>
             )
          })
        )}
      </div>
    </div>
  );
}