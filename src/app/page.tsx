import Image from "next/image";
import Link from "next/link"; // <--- This is the magic tool we need

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-900 text-white">
      <main className="flex flex-col items-center p-6 text-center">
        
        {/* LOGO AREA */}
        <div className="mb-8 bg-white p-4 rounded-full shadow-lg">
          <Image 
            src="/logo.png" 
            alt="App Logo" 
            width={150} 
            height={150} 
            className="rounded-full"
          />
        </div>

        <h1 className="text-4xl font-bold mb-2">
           Mountain Valley Disc Golf
        </h1>
        
        <h2 className="text-xl font-light mb-8 text-green-200">
           Official Scoring App
        </h2>

        <div className="w-full max-w-xs bg-white rounded-xl shadow-2xl overflow-hidden p-6 text-gray-800">
          <p className="mb-6 text-lg font-medium">Ready to hit the chains?</p>
          
          {/* --- THE FIX IS HERE --- */}
          {/* We are wrapping the button in a Link so it acts like a door to the next room */}
          <Link href="/play">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl shadow-md transition-all mb-4">
              Start New Round
            </button>
          </Link>
          {/* ----------------------- */}
          
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg">
            View Leaderboard
          </button>
        </div>

      </main>
    </div>
  );
}