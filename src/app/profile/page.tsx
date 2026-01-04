'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Profile Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Stats
  const [stats, setStats] = useState<any>({ rounds: 0, best: '-', avg: '-' });

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    // Fetch Profile Info
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('email', user.email)
      .single();

    if (data) {
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setAvatarUrl(data.avatar_url || '');
    }

    // Fetch Stats (Rounds count, etc.)
    const { data: rounds } = await supabase
      .from('scorecards')
      .select('total_score')
      .eq('player_name', data?.first_name || user.email?.split('@')[0]); // Fallback logic

    if (rounds && rounds.length > 0) {
      const scores = rounds.map(r => r.total_score);
      const best = Math.min(...scores);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      setStats({ rounds: rounds.length, best, avg });
    }

    setLoading(false);
  }

  // Helper to Capitalize First Letter
  const handleNameChange = (val: string, setter: any) => {
    if (!val) { setter(''); return; }
    // Capitalize first letter, keep rest as typed
    const formatted = val.charAt(0).toUpperCase() + val.slice(1);
    setter(formatted);
  };

  async function updateProfile() {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      email: user.email, // Key to match
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl,
      updated_at: new Date()
    }, { onConflict: 'email' });

    if (error) {
      alert("Error updating profile!");
    } else {
      alert("Profile Updated Successfully!");
    }
    setLoading(false);
  }

  async function uploadAvatar(event: any) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Update State (user still needs to click "Save Profile" to commit to DB, or we can auto-save here)
      setAvatarUrl(data.publicUrl);
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white font-bold">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="w-full max-w-md bg-white text-gray-800 rounded-xl p-6 shadow-2xl">
        
        {/* AVATAR UPLOAD SECTION */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-4">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt="Avatar" 
                fill 
                className="rounded-full object-cover border-4 border-green-600 shadow-md"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold border-4 border-gray-100">
                No Pic
              </div>
            )}
            {/* Hidden File Input */}
            <input
              type="file"
              id="single"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-xs text-gray-500 uppercase font-bold">
            {uploading ? 'Uploading...' : 'Tap Image to Change'}
          </p>
        </div>

        {/* NAME INPUTS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => handleNameChange(e.target.value, setFirstName)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg font-bold focus:border-green-500 outline-none"
              placeholder="Robb"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => handleNameChange(e.target.value, setLastName)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg font-bold focus:border-green-500 outline-none"
              placeholder="Helt"
            />
          </div>
        </div>

        {/* STATS DISPLAY */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-between text-center border border-gray-100">
           <div>
              <div className="text-xl font-black text-gray-800">{stats.rounds}</div>
              <div className="text-xs text-gray-500 font-bold uppercase">Rounds</div>
           </div>
           <div>
              <div className="text-xl font-black text-green-600">{stats.best}</div>
              <div className="text-xs text-gray-500 font-bold uppercase">Best</div>
           </div>
           <div>
              <div className="text-xl font-black text-blue-600">{stats.avg}</div>
              <div className="text-xs text-gray-500 font-bold uppercase">Avg</div>
           </div>
        </div>

        <button 
          onClick={updateProfile}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-all active:scale-95"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>

      </div>
    </div>
  );
}