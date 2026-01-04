'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [nuking, setNuking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      // SECURITY CHECK: Only allow the specific admin email
      if (!user || user.email !== 'helt@oncuetech.com') {
        alert("⛔ ACCESS DENIED ⛔\nYou are not the Admin.");
        router.push('/');
        return;
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  const handleNuke = async () => {
    // Safety Check 1
    if(!confirm("⚠️ NUCLEAR WARNING ⚠️\n\nThis will DELETE ALL SCORECARDS and REMOVE ALL USERS.\n\nOnly your account (helt@oncuetech.com) will survive.\n\nAre you sure?")) return;

    // Safety Check 2
    const verification = prompt("Type 'DELETE' to confirm nuclear reset:");
    if (verification !== 'DELETE') {
        alert("Cancelled. The board is safe.");
        return;
    }

    setNuking(true);

    try {
        // 1. Delete ALL Scorecards (Rows where ID is not -1, effectively all rows)
        const { error: scoreError } = await supabase
            .from('scorecards')
            .delete()
            .neq('id', -1); 

        if (scoreError) throw scoreError;

        // 2. Delete ALL Profiles EXCEPT the Admin
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .neq('email', 'helt@oncuetech.com');

        if (profileError) throw profileError;

        alert("☢️ NUCLEAR RESET COMPLETE ☢️\n\nThe board is clean. All users (except you) are gone.");
        router.push('/');

    } catch (error: any) {
        alert("Error during nuke: " + error.message);
    } finally {
        setNuking(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-red-500 font-bold flex items-center justify-center">Verifying Clearance...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-black mb-2 text-red-600">ADMIN CONSOLE</h1>
        <p className="text-gray-400 mb-12">Authorized Personnel Only: Robb Helt</p>

        <div className="bg-black border border-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">League Reset</h2>
            <p className="mb-8 text-sm text-gray-400">
                This action is permanent. It will wipe the leaderboard and remove all registered players from the directory so you can start a fresh season.
            </p>

            <button
                onClick={handleNuke}
                disabled={nuking}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-xl text-2xl shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all border-2 border-red-400"
            >
                {nuking ? 'DESTROYING DATA...' : '☢️ NUKE EVERYTHING'}
            </button>
        </div>
    </div>
  );
}