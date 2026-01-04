'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';
import { COURSE_DATA, TEES } from '@/courseData';

export default function Play() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- 1. SECURITY CHECK (The Bouncer) ---
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Kick to login if not authenticated
      } else {
        setUser(user);
        setLoadingUser(false);
      }
    }
    checkUser();
  }, [router]);

  // --- GAME STATE ---
  const [step, setStep] = useState(1); // 1 = Setup, 2 = Playing
  const [selectedTee, setSelectedTee] = useState('White');
  const [players, setPlayers] = useState<string[]>(['']); 
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0); 
  
  // Score Storage: { "PlayerName": { 1: 3, 2: 4 ... } }
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});

  // --- HELPER: CALCULATE TOTALS (Real-time Math) ---
  const getPlayerTotals = (player: string) => {
    const playerScores = scores[player] || {};
    let totalStrokes = 0;
    let totalPar = 0;

    // Loop through all holes to calculate running total
    COURSE_DATA.forEach(h => {
      // Only count holes where a score exists
      if (playerScores[h.hole]) {
        totalStrokes += playerScores[h.hole];
        totalPar += h.par;
      }
    });

    const relativeScore = totalStrokes - totalPar;
    
    // Format the display (e.g., "+2", "-1", "E")
    let displayRel = relativeScore > 0 ? `+${relativeScore}` : `${relativeScore}`;
    if (relativeScore === 0) displayRel = "E";

    return { totalStrokes, displayRel, relativeScore };
  };

  // --- GAMEPLAY ACTIONS ---
  const addPlayer = () => setPlayers([...players, '']);
  
  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    const realPlayers = players.filter(p => p.trim() !== '');
    if (realPlayers.length === 0) return alert("Add at least one player!");
    
    // Initialize score object
    const initialScores: any = {};
    realPlayers.forEach(p => initialScores[p] = {});
    setScores(initialScores);
    setPlayers(realPlayers);
    setStep(2);
  };

  const updateScore = (player: string, change: number) => {
    const currentHoleNum = COURSE_DATA[currentHoleIndex].hole;
    // Default to Par if no score exists yet
    const currentScore = scores[player][currentHoleNum] || COURSE_DATA[currentHoleIndex].par;
    
    setScores({
      ...scores,
      [player]: {
        ...scores[player],
        [currentHoleNum]: currentScore + change
      }
    });
  };

  const prevHole = () => {
    if (currentHoleIndex > 0) setCurrentHoleIndex(currentHoleIndex - 1);
  };

  const nextHole = () => {
    if (currentHoleIndex < COURSE_DATA.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    } else {
      finishRound();
    }
  };

  const finishRound = async () => {
    if(!confirm("Finish round and submit scores to the Leaderboard?")) return;

    // Loop through every player and save their card
    for (const player of players) {
      const playerScores = scores[player];
      
      let total = 0;
      Object.values(playerScores).forEach(s => total += s);

      // Prepare the data row for Supabase
      const dataToSave: any = {
        player_name: player,
        tee_color: selectedTee,
        total_score: total,
        created_by_user: user.email // Tracks who uploaded this score
      };

      // Map hole scores to columns hole_1, hole_2, etc.
      COURSE_DATA.forEach(h => {
        dataToSave[`hole_${h.hole}`] = playerScores[h.hole] || h.par;
      });

      await supabase.from('scorecards').insert(dataToSave);
    }

    alert("Round Saved Successfully!");
    router.push('/leaderboard'); // Send them straight to see the results
  };

  // --- LOADING SCREEN ---
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-green-9