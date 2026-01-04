import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import NavBar from "./components/NavBar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mountain Valley Disc Golf",
  description: "Official Scoring App",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* Navigation Top Bar */}
        <NavBar /> 
        
        {/* Main Content Area (Grows to fill space) */}
        <main className="flex-1">
          {children}
        </main>

        {/* Global Footer (Appears on every page) */}
        <footer className="bg-black/90 text-gray-500 text-center py-6 text-xs font-bold uppercase tracking-widest">
           App by Robb Helt. All Rights Reserved.
        </footer>

        {/* Vercel Speed Insights */}
        <SpeedInsights />
      </body>
    </html>
  );
}