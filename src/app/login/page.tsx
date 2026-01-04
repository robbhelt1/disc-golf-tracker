'use client';
import { useState } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login Failed: " + error.message);
      setLoading(false);
    } else {
      router.push('/play'); // Success! Go to game.
    }
  }

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-800">Member Login</h1>
        
        <label className="block font-bold mb-2">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border-2 border-gray-200 rounded-lg"
        />

        <label className="block font-bold mb-2">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 border-2 border-gray-200 rounded-lg"
        />
        
        <p className="text-xs text-gray-500 mb-6 italic">
          *To reset password, please contact Robb Helt via text.
        </p>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-xl mb-4"
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>

        <p className="text-center text-gray-600">
          New Player? <Link href="/signup" className="text-green-600 font-bold">Create Account</Link>
        </p>
      </div>
    </div>
  );
}