import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// We use a relative path (./) to find the components folder we just moved
import NavBar from "./components/NavBar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mountain Valley Disc Golf",
  description: "Official Scoring App",
  icons: {
    icon: '/logo.png',       // The little icon in the browser tab
    shortcut: '/logo.png',   // Shortcut icon
    apple: '/logo.png',      // Icon when added to iPhone home screen
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar /> 
        {children}
      </body>
    </html>
  );
}