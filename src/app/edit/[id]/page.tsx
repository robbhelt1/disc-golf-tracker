'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { useRouter, useParams } from 'next/navigation';
import { COURSE_DATA } from '@/courseData';

export default function EditScorecard() {
  const params = useParams(); 
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any>({});
  const [playerInfo, setPlayerInfo] = useState<any>({});

  // Parse ID correctly
  // Note: useParams returns string or array. We force it to string.
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    if (id) fetchScorecard(id);
  }, [id]);

  async function fetchScorecard(scoreId: string) {
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('id', scoreId)
      .single();

    if (error || !data) {
      console.error("Error:", error);
      alert("Could not find round #" + scoreId);
      router.push('/leaderboard');
    } else {
      setPlayerInfo(data);
      const loadedScores: any = {};
      COURSE_DATA.forEach(h => {
        loadedScores[h.hole] = data[`hole_${h.hole}`];
      });
      setScores(loadedScores);
      setLoading(false);
    }
  }

  const handleScoreChange = (hole: number, val: string) => {
    const num = parseInt(val) || 0;
    setScores({ ...scores, [hole]: num });
  };

  const saveChanges = async () => {
    if (!id) return;
    setLoading(true);
    
    let newTotal = 0;
    Object.values(scores).forEach((s: any) => newTotal += s);

    const updates: any = { total_score: newTotal };
    COURSE_DATA.forEach(h => {
      updates[`hole_${h.hole}`] = scores[h.hole];
    });

    const { error } = await supabase
      .from('scorecards')
      .update(updates)
      .eq('id', id);

    if (error) {
      alert("Error saving: " + error.message);
      setLoading(false);
    } else {
      alert("Scorecard Updated!");
      router.back(); 
    }
  };

  if (loading) return <div className="min-h-screen bg-green-900 text-white flex items-center justify-center font-bold">Loading Scorecard...</div>;

  return (
    <div className="min-h-screen bg-green-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Edit Scorecard</h1>
      <h2 className="text-xl text-green-200 mb-6">{playerInfo.player_name}</h2>

      <div className="bg-white text-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <div className="grid grid-cols-3 gap-4 mb-6">
           <div className="font-bold text-gray-500 uppercase text-xs">Hole</div>
           <div className="font-bold text-gray-500 uppercase text-xs text-center">Par</div>
           <div className="font-bold text-gray-500 uppercase text-xs text-center">Score</div>

           {COURSE_DATA.map(h => (
             <div key={h.hole} className="contents">
                <div className="flex items-center font-bold text-lg">#{h.hole}</div>
                <div className="flex items-center justify-center text-gray-400">{h.par}</div>
                <div>
                  <input 
                    type="number" 
                    value={scores[h.hole] || ''}
                    onChange={(e) => handleScoreChange(h.hole, e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2 text-center font-bold text-xl focus:border-green-500 outline-none"
                  />
                </div>
             </div>
           ))}
        </div>

        <button 
          onClick={saveChanges}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg mb-4"
        >
          Save Changes
        </button>

        <button onClick={() => router.back()} className="w-full text-gray-400 font-bold hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );
}