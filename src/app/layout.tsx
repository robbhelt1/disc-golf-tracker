import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// CHANGE: We are using a relative path (..) to find the components folder
import NavBar from "../components/NavBar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mountain Valley Disc Golf",
  description: "Official Scoring App",
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