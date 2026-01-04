import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-900 text-white">
      <main className="flex flex-col items-center p-6 text-center">
        
        {/* YOUR LOGO HERE */}
        <div className="mb-8 bg-white p-4 rounded-full shadow-lg">
           {/* Change 'logo.png' below to 'logo.jpg' if your file is a jpg */}
          <Image 
            src="/logo.png" 
            alt="App Logo" 
            width={150} 
            height={150} 
            className="rounded-full"
          />
        </div>

        {/* YOUR APP NAME HERE */}
        <h1 className="text-4xl font-bold mb-2">
          Mountain Valley Disc Golf Scoring
        </h1>
        
        {/* YOUR TAGLINE HERE */}
        <h2 className="text-xl font-light mb-8 text-green-200">
        Designed for Members of Mountain Valley HOA by RH
        </h2>

        <div className="w-full max-w-xs bg-white rounded-xl shadow-2xl overflow-hidden p-6 text-gray-800">
          <p className="mb-6 text-lg font-medium">Ready to hit the chains?</p>
          
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl shadow-md transition-all">
            Start New Round
          </button>
          
          <div className="mt-4 border-t pt-4">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg">
              View Leaderboard
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}