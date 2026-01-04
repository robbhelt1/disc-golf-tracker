'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import Image from 'next/image';

export default function FindPlayers() {
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setup();
  }, []);

  async function setup() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get current following list
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    if (following) setFollowingIds(following.map(f => f.following_id));
  }

  async function handleSearch() {
    if (!search) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .ilike('first_name', `%${search}%`);
    
    setPlayers(data || []);
  }

  async function toggleFollow(targetId: string) {
    if (!currentUserId) return;

    if (followingIds.includes(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId);
      setFollowingIds(prev => prev.filter(id => id !== targetId));
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId });
      setFollowingIds(prev => [...prev, targetId]);
    }
  }

  return (
    <div className="min-h-screen bg-green-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Find Players</h1>
      
      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="flex-1 p-3 rounded-lg text-gray-900 font-bold"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSearch} className="bg-white text-green-900 px-6 py-3 rounded-lg font-bold">Search</button>
      </div>

      <div className="space-y-4">
        {players.map(player => (
          <div key={player.id} className="bg-white text-gray-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                {player.avatar_url ? (
                  <Image src={player.avatar_url} alt="Avatar" fill className="rounded-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center font-bold">{player.first_name[0]}</div>
                )}
              </div>
              <div className="font-bold text-lg">{player.first_name} {player.last_name}</div>
            </div>
            
            {player.id !== currentUserId && (
              <button 
                onClick={() => toggleFollow(player.id)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${followingIds.includes(player.id) ? 'bg-gray-200 text-gray-600' : 'bg-green-600 text-white'}`}
              >
                {followingIds.includes(player.id) ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}