'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    
    // Listen for login/logout events to update the bar instantly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Don't show Navbar on Login or Signup pages
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav className="bg-green-800 text-white shadow-lg border-b border-green-700 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* HOME LINK (Left) */}
          <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
            <span>🌲</span>
            <span>MVDG</span>
          </Link>

          {/* RIGHT LINKS (Only show if logged in) */}
          {user ? (
            <div className="flex items-center gap-4 text-sm font-bold">
              <Link href="/play" className={`hover:text-green-300 ${pathname === '/play' ? 'text-green-300' : ''}`}>
                Play
              </Link>
              <Link href="/leaderboard" className={`hover:text-green-300 ${pathname === '/leaderboard' ? 'text-green-300' : ''}`}>
                Rank
              </Link>
              <Link href="/profile" className={`hover:text-green-300 ${pathname === '/profile' ? 'text-green-300' : ''}`}>
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded-full text-xs text-red-200 ml-1"
              >
                Log Out
              </button>
            </div>
          ) : (
            // Show Login if they aren't logged in
            <Link href="/login" className="font-bold hover:text-green-300">
              Log In
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}