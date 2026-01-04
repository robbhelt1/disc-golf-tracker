'use client';
import { useState } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(''); // <--- New State
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!firstName) return alert("Please enter your First Name.");
    
    setLoading(true);
    // Create user and send 'first_name' as metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName, // <--- This gets sent to the database trigger
        }
      }
    });

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
    } else {
      alert("Account created! Logging you in...");
      router.push('/play'); 
    }
  }

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-800">Create Account</h1>
        
        <label className="block font-bold mb-2">First Name</label>
        <input 
          type="text" 
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full p-3 mb-4 border-2 border-gray-200 rounded-lg capitalize"
          placeholder="e.g. Robb"
        />

        <label className="block font-bold mb-2">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border-2 border-gray-200 rounded-lg"
          placeholder="you@example.com"
        />

        <label className="block font-bold mb-2">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-8 border-2 border-gray-200 rounded-lg"
          placeholder="••••••••"
        />

        <button 
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-xl mb-4"
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </button>

        <p className="text-center text-gray-600">
          Already have an account? <Link href="/login" className="text-green-600 font-bold">Log In</Link>
        </p>
      </div>
    </div>
  );
}